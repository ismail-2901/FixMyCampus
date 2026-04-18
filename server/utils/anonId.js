// utils/anonId.js
const db = require('../config/db');

const generateAnonId = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id, exists = true;
  while (exists) {
    const suffix = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    id = `ANON-${suffix}`;
    const [rows] = await db.query('SELECT anon_id FROM Anonymous_ID WHERE anon_id = ?', [id]);
    exists = rows.length > 0;
  }
  return id;
};

module.exports = { generateAnonId };
