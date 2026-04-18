const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { processMessage } = require('../services/chatbotService');
const db = require('../config/db');

router.post('/message', authenticate, async (req,res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  const response = await processMessage(req.user.user_id, message, history||[]);
  res.json({ response });
});

router.get('/history', authenticate, async (req,res) => {
  const [logs] = await db.query(
    'SELECT user_message,bot_response,created_at FROM AI_Chat_Log WHERE user_id=? ORDER BY created_at ASC LIMIT 50',
    [req.user.user_id]
  );
  res.json(logs);
});

module.exports = router;
