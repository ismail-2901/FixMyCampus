// controllers/superAdminController.js
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateAnonId } = require('../utils/anonId');

const getAllUsers = async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let where = ['1=1'], params = [];
  if (role) { where.push('u.role=?'); params.push(role); }
  if (search) { where.push('(u.name LIKE ? OR u.email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  const [users] = await db.query(
    `SELECT u.user_id,u.name,u.email,u.role,u.is_banned,u.is_verified,u.created_at,a.anon_id,d.name AS department
     FROM Users u
     LEFT JOIN Anonymous_ID a ON u.user_id=a.user_id
     LEFT JOIN Departments d ON u.department_id=d.department_id
     WHERE ${where.join(' AND ')} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM Users u WHERE ${where.join(' AND ')}`, params);
  res.json({ users, total });
};

const banUser = async (req, res) => {
  await db.query('UPDATE Users SET is_banned=? WHERE user_id=?', [req.body.ban, req.params.id]);
  res.json({ message: req.body.ban ? 'User banned' : 'User unbanned' });
};

const deleteUser = async (req, res) => {
  await db.query('DELETE FROM Users WHERE user_id=? AND role!="superadmin"', [req.params.id]);
  res.json({ message: 'User deleted' });
};

const createAdmin = async (req, res) => {
  const { name, email, password, department_id } = req.body;
  if (!name || !email || !password || !department_id)
    return res.status(400).json({ error: 'All fields required' });
  if (!email.endsWith('@diu.edu.bd'))
    return res.status(400).json({ error: 'Must use @diu.edu.bd email' });
  try {
    const [ex] = await db.query('SELECT user_id FROM Users WHERE email=?', [email]);
    if (ex.length) return res.status(409).json({ error: 'Email already exists' });
    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.query(
      `INSERT INTO Users (name,email,password_hash,role,department_id,is_verified) VALUES (?,?,?,'admin',?,TRUE)`,
      [name, email, hash, department_id]
    );
    const anonId = await generateAnonId();
    await db.query('INSERT INTO Anonymous_ID (anon_id,user_id) VALUES (?,?)', [anonId, r.insertId]);
    await db.query('INSERT INTO Admin_Assignments (admin_id,department_id) VALUES (?,?)', [r.insertId, department_id]);
    res.status(201).json({ message: 'Admin created', admin_id: r.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create admin' });
  }
};

const getStats = async (req, res) => {
  const [[users]] = await db.query(`SELECT COUNT(*) AS c FROM Users WHERE role IN ('student','staff')`);
  const [[reports]] = await db.query('SELECT COUNT(*) AS c FROM Reports');
  const [[pending]] = await db.query(`SELECT COUNT(*) AS c FROM Reports WHERE status='Pending'`);
  const [[resolved]] = await db.query(`SELECT COUNT(*) AS c FROM Reports WHERE status='Resolved'`);
  const [[admins]] = await db.query(`SELECT COUNT(*) AS c FROM Users WHERE role='admin'`);
  const [byDept] = await db.query(
    `SELECT d.name,COUNT(r.report_id) AS count FROM Departments d
     LEFT JOIN Reports r ON d.department_id=r.department_id
     GROUP BY d.department_id ORDER BY count DESC LIMIT 5`
  );
  const [byCat] = await db.query(
    `SELECT c.name,COUNT(r.report_id) AS count FROM Categories c
     LEFT JOIN Reports r ON c.category_id=r.category_id GROUP BY c.category_id ORDER BY count DESC`
  );
  res.json({ users: users.c, reports: reports.c, pending: pending.c, resolved: resolved.c, admins: admins.c, byDept, byCat });
};

const approveReport = async (req, res) => {
  await db.query('UPDATE Reports SET is_approved=? WHERE report_id=?', [req.body.approve, req.params.id]);
  res.json({ message: 'Updated' });
};

const getAllReports = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let where = ['1=1'], params = [];
  if (status) { where.push('r.status=?'); params.push(status); }
  const [reports] = await db.query(
    `SELECT r.report_id,r.title,r.status,r.is_approved,r.created_at,
            a.anon_id AS author,c.name AS category,d.name AS department
     FROM Reports r
     LEFT JOIN Anonymous_ID a ON r.user_id=a.user_id
     LEFT JOIN Categories c ON r.category_id=c.category_id
     LEFT JOIN Departments d ON r.department_id=d.department_id
     WHERE ${where.join(' AND ')} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );
  res.json(reports);
};

module.exports = { getAllUsers, banUser, deleteUser, createAdmin, getStats, approveReport, getAllReports };
