// routes/groups.js
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
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Only super admin can create groups' });
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const [r] = await db.query('INSERT INTO Group_Discussions (title,description,created_by) VALUES (?,?,?)',
    [title,description,req.user.user_id]);
  await db.query('INSERT INTO Group_Members (group_id,user_id) VALUES (?,?)', [r.insertId,req.user.user_id]);
  res.status(201).json({ group_id: r.insertId });
});
router.post('/:id/join', authenticate, async (req,res) => {
  await db.query('INSERT IGNORE INTO Group_Members (group_id,user_id) VALUES (?,?)', [req.params.id,req.user.user_id]);
  res.json({ message: 'Joined' });
});
router.delete('/:id/leave', authenticate, async (req,res) => {
  await db.query('DELETE FROM Group_Members WHERE group_id=? AND user_id=?', [req.params.id,req.user.user_id]);
  res.json({ message: 'Left group' });
});
router.get('/:id/posts', authenticate, async (req,res) => {
  const [p] = await db.query(
    `SELECT p.post_id,p.content,p.posted_at,a.anon_id AS author
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

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content required' });
    }

    // Verify user is a member of this group
    const [member] = await db.query(
      'SELECT id FROM Group_Members WHERE group_id=? AND user_id=?',
      [groupId, req.user.user_id]
    );
    if (!member.length) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // Save post to database
    const [result] = await db.query(
      'INSERT INTO Group_Posts (group_id, user_id, content) VALUES (?, ?, ?)',
      [groupId, req.user.user_id, content.trim()]
    );

    // Get the saved post with author anon_id
    const [posts] = await db.query(
      `SELECT p.post_id, p.content, p.posted_at, a.anon_id AS author
       FROM Group_Posts p LEFT JOIN Anonymous_ID a ON p.user_id=a.user_id
       WHERE p.post_id=?`,
      [result.insertId]
    );

    res.status(201).json(posts[0]);
  } catch (err) {
    console.error('Save post error:', err);
    res.status(500).json({ error: 'Failed to save post' });
  }
});

module.exports = router;
