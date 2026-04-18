const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/db');

router.get('/search', authenticate, async (req,res) => {
  const { anon_id } = req.query;
  if (!anon_id) return res.json([]);
  const [rows] = await db.query(
    'SELECT anon_id FROM Anonymous_ID WHERE anon_id LIKE ? LIMIT 10', [`%${anon_id}%`]
  );
  res.json(rows);
});

module.exports = router;
