// controllers/commentsController.js
const db = require('../config/db');

const getComments = async (req, res) => {
  const [comments] = await db.query(
    `SELECT c.comment_id,c.content,c.parent_comment_id,c.created_at,a.anon_id AS author
     FROM Comments c LEFT JOIN Anonymous_ID a ON c.user_id=a.user_id
     WHERE c.report_id=? AND c.is_hidden=FALSE ORDER BY c.created_at ASC`,
    [req.params.reportId]
  );
  res.json(comments);
};

const addComment = async (req, res) => {
  const { content, parent_comment_id } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  const [r] = await db.query(
    'INSERT INTO Comments (report_id,user_id,parent_comment_id,content) VALUES (?,?,?,?)',
    [req.params.reportId, req.user.user_id, parent_comment_id||null, content]
  );
  res.status(201).json({ comment_id: r.insertId });
};

const deleteComment = async (req, res) => {
  await db.query('UPDATE Comments SET is_hidden=TRUE WHERE comment_id=?', [req.params.commentId]);
  res.json({ message: 'Comment hidden' });
};

const reactToReport = async (req, res) => {
  const { type } = req.body;
  const valid = ['like','dislike','warning','love'];
  if (!valid.includes(type)) return res.status(400).json({ error: 'Invalid reaction' });
  await db.query(
    `INSERT INTO Reactions (report_id,user_id,type) VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE type=VALUES(type)`,
    [req.params.reportId, req.user.user_id, type]
  );
  res.json({ message: 'Reaction saved' });
};

module.exports = { getComments, addComment, deleteComment, reactToReport };
