const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/db');

// Get all notifications — cast TINYINT booleans to avoid MySQL Buffer issues
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT notification_id, user_id, type, title, message, link,
              (is_read + 0) AS is_read,
              created_at
       FROM Notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (e) {
    console.error('Fetch notifications error:', e);
    res.json([]);
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) AS count FROM Notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.user_id]
    );
    res.json({ count: Number(count) });
  } catch (e) {
    res.json({ count: 0 });
  }
});

// Mark one notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await db.query(
      'UPDATE Notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
  } catch (e) {}
  res.json({ ok: true });
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticate, async (req, res) => {
  try {
    await db.query(
      'UPDATE Notifications SET is_read = TRUE WHERE user_id = ?',
      [req.user.user_id]
    );
  } catch (e) {}
  res.json({ ok: true });
});

module.exports = router;
