const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/db');

router.get('/', authenticate, async (req,res) => {
  const [g] = await db.query(
    `SELECT g.*,a.anon_id AS creator,
      (SELECT COUNT(*) FROM Group_Members gm WHERE gm.group_id=g.group_id) AS member_count,
      (SELECT COUNT(*) FROM Group_Members gm WHERE gm.group_id=g.group_id AND gm.user_id=?) AS is_member
     FROM Group_Discussions g LEFT JOIN Anonymous_ID a ON g.created_by=a.user_id
     ORDER BY g.created_at DESC`,
    [req.user.user_id]
  );
  res.json(g);
});

router.post('/', authenticate, async (req,res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Only superadmin can create groups' });
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const [r] = await db.query('INSERT INTO Group_Discussions (title,description,created_by) VALUES (?,?,?)',
    [title, description, req.user.user_id]);
  await db.query('INSERT INTO Group_Members (group_id,user_id) VALUES (?,?)', [r.insertId, req.user.user_id]);
  res.status(201).json({ group_id: r.insertId });
});

router.post('/:id/join', authenticate, async (req,res) => {
  await db.query('INSERT IGNORE INTO Group_Members (group_id,user_id) VALUES (?,?)', [req.params.id, req.user.user_id]);
  res.json({ message: 'Joined' });
});

router.delete('/:id/leave', authenticate, async (req,res) => {
  await db.query('DELETE FROM Group_Members WHERE group_id=? AND user_id=?', [req.params.id, req.user.user_id]);
  res.json({ message: 'Left group' });
});

router.get('/:id/posts', authenticate, async (req,res) => {
  const [p] = await db.query(
    `SELECT p.post_id, p.group_id, p.content, p.posted_at, a.anon_id AS author
     FROM Group_Posts p LEFT JOIN Anonymous_ID a ON p.user_id=a.user_id
     WHERE p.group_id=? ORDER BY p.posted_at ASC LIMIT 200`,
    [req.params.id]
  );
  res.json(p);
});

router.post('/:id/posts', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const groupId = req.params.id;

    if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });

    const [member] = await db.query(
      'SELECT id FROM Group_Members WHERE group_id=? AND user_id=?',
      [groupId, req.user.user_id]
    );
    if (!member.length) return res.status(403).json({ error: 'Not a member of this group' });

    const [result] = await db.query(
      'INSERT INTO Group_Posts (group_id, user_id, content) VALUES (?, ?, ?)',
      [groupId, req.user.user_id, content.trim()]
    );

    const [posts] = await db.query(
      `SELECT p.post_id, p.group_id, p.content, p.posted_at, a.anon_id AS author
       FROM Group_Posts p LEFT JOIN Anonymous_ID a ON p.user_id=a.user_id
       WHERE p.post_id=?`,
      [result.insertId]
    );
    const post = posts[0];

    // Broadcast to everyone in the room EXCEPT the sender
    // The sender already has the post from the API response
    const io = req.app.get('io');
    if (io) {
      const senderSocketId = req.headers['x-socket-id'] || null;
      io.to(`group_${groupId}`).except(senderSocketId || []).emit('group_post', post);
    }

    // Notify group members (not the sender)
    const [members] = await db.query(
      'SELECT user_id FROM Group_Members WHERE group_id=? AND user_id != ?',
      [groupId, req.user.user_id]
    );
    const [groupInfo] = await db.query('SELECT title FROM Group_Discussions WHERE group_id=?', [groupId]);
    if (groupInfo.length) {
      for (const m of members) {
        await db.query(
          "INSERT INTO Notifications (user_id,type,title,message,link) VALUES (?,?,?,?,?)",
          [m.user_id, 'group_message', `New message in ${groupInfo[0].title}`,
           `${post.author}: ${content.trim().substring(0, 80)}`, `/groups`]
        ).catch(()=>{});
        if (io) {
          io.to(`user_${m.user_id}`).emit('notification', {
            type: 'group_message',
            title: `New message in ${groupInfo[0].title}`,
            message: `${post.author}: ${content.trim().substring(0, 80)}`
          });
        }
      }
    }

    res.status(201).json(post);
  } catch (err) {
    console.error('Post error:', err);
    res.status(500).json({ error: 'Failed to save post' });
  }
});

module.exports = router;
