// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendVerificationEmail } = require('../services/emailService');
const { generateAnonId } = require('../utils/anonId');

const DOMAIN = '@diu.edu.bd';

const register = async (req, res) => {
  const { name, email, password, department_id } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });

  if (!email.endsWith(DOMAIN))
    return res.status(400).json({ error: `Email must end with ${DOMAIN}` });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const [existing] = await db.query('SELECT user_id FROM Users WHERE email=?', [email]);
    if (existing.length) return res.status(409).json({ error: 'This email is already registered' });

    const hash = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const exp = new Date(Date.now() + 15 * 60 * 1000);

    const [result] = await db.query(
      `INSERT INTO Users (name,email,password_hash,role,department_id,verification_code,verification_expires)
       VALUES (?,?,?,?,?,?,?)`,
      [name, email, hash, 'student', department_id || null, code, exp]
    );

    const anonId = await generateAnonId();
    await db.query('INSERT INTO Anonymous_ID (anon_id,user_id) VALUES (?,?)', [anonId, result.insertId]);

    await sendVerificationEmail(email, name, code);

    res.status(201).json({
      message: 'Registration successful! Check your email (or server terminal) for the verification code.',
      anonymous_id: anonId,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

const verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code required' });

  try {
    const [rows] = await db.query(
      'SELECT user_id, verification_code, verification_expires FROM Users WHERE email=?', [email]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const user = rows[0];
    if (user.verification_code !== code.toString())
      return res.status(400).json({ error: 'Invalid verification code' });
    if (new Date() > new Date(user.verification_expires))
      return res.status(400).json({ error: 'Code expired. Please request a new one.' });

    await db.query('UPDATE Users SET is_verified=TRUE, verification_code=NULL WHERE user_id=?', [user.user_id]);
    res.json({ message: 'Email verified! You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const [rows] = await db.query(
      `SELECT u.*, a.anon_id FROM Users u
       LEFT JOIN Anonymous_ID a ON u.user_id=a.user_id
       WHERE u.email=?`,
      [email]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid email or password' });

    const user = rows[0];
    if (user.is_banned) return res.status(403).json({ error: 'This account has been banned' });
    if (!user.is_verified) return res.status(403).json({ error: 'Please verify your email first' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        anonymous_id: user.anon_id,
        department_id: user.department_id,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

const resendCode = async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await db.query('SELECT user_id, name, is_verified FROM Users WHERE email=?', [email]);
    if (!rows.length) return res.status(404).json({ error: 'Email not found' });
    if (rows[0].is_verified) return res.status(400).json({ error: 'Email already verified' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const exp = new Date(Date.now() + 15 * 60 * 1000);
    await db.query('UPDATE Users SET verification_code=?, verification_expires=? WHERE email=?', [code, exp, email]);
    await sendVerificationEmail(email, rows[0].name, code);
    res.json({ message: 'New verification code sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend code' });
  }
};

const getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.user_id,u.name,u.email,u.role,u.department_id,u.student_id,
              a.anon_id AS anonymous_id, d.name AS department_name
       FROM Users u
       LEFT JOIN Anonymous_ID a ON u.user_id=a.user_id
       LEFT JOIN Departments d ON u.department_id=d.department_id
       WHERE u.user_id=?`,
      [req.user.user_id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

module.exports = { register, verifyEmail, login, resendCode, getMe };
