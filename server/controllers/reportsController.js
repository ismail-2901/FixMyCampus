const db = require('../config/db');

const genReportId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return 'RPT-' + Array.from({length:6}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
};

// Helper: insert notification + emit socket event to user's personal room
async function notify(req, userId, type, title, message, link) {
  try {
    await db.query(
      'INSERT INTO Notifications (user_id,type,title,message,link) VALUES (?,?,?,?,?)',
      [userId, type, title, message, link]
    );
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        notification_id: Date.now(),
        user_id: userId, type, title, message, link,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
  } catch (e) { /* never crash for notification failures */ }
}

const createReport = async (req, res) => {
  let { title, description, category_id, department_id } = req.body;
  title       = (title || '').trim();
  description = (description || '').trim();
  const cat_id  = parseInt(category_id);
  const dept_id = parseInt(department_id);

  if (!title || title.length < 3)              return res.status(400).json({ error: 'Title required (min 3 chars)' });
  if (!description || description.length < 10) return res.status(400).json({ error: 'Description required (min 10 chars)' });
  if (isNaN(cat_id)  || cat_id  <= 0)          return res.status(400).json({ error: 'Valid category required' });
  if (isNaN(dept_id) || dept_id <= 0)          return res.status(400).json({ error: 'Valid department required' });

  try {
    const reportId = genReportId();
    await db.query(
      `INSERT INTO Reports (report_id,user_id,title,description,category_id,department_id,status,is_approved)
       VALUES (?,?,?,?,?,?,'Pending',FALSE)`,
      [reportId, req.user.user_id, title, description, cat_id, dept_id]
    );
    if (req.files?.length) {
      for (const f of req.files)
        await db.query('INSERT INTO Attachments (report_id,file_path,file_type) VALUES (?,?,?)',
          [reportId, f.filename, f.mimetype]);
    }
    // Real-time notify every superadmin
    const [superadmins] = await db.query("SELECT user_id FROM Users WHERE role='superadmin'");
    for (const sa of superadmins) {
      await notify(req, sa.user_id, 'new_report', 'New Report Submitted',
        `A new report "${title}" is awaiting your approval.`, `/reports/${reportId}`);
    }
    res.status(201).json({ message: 'Report submitted! Awaiting superadmin approval.', report_id: reportId });
  } catch (err) {
    console.error('createReport error:', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

const getReports = async (req, res) => {
  const { status, category_id, department_id, search, page=1, limit=10 } = req.query;
  const user   = req.user;
  const offset = (page - 1) * limit;
  let where = [], params = [];

  if (user.role === 'student' || user.role === 'staff') {
    where.push('r.user_id=?'); params.push(user.user_id);
  } else if (user.role === 'admin') {
    const [a] = await db.query('SELECT department_id FROM Admin_Assignments WHERE admin_id=?', [user.user_id]);
    const ids = a.map(x => x.department_id);
    if (ids.length) { where.push(`r.department_id IN (${ids.map(()=>'?')})`); params.push(...ids); }
    else return res.json({ reports:[], total:0, page:1, pages:0 });
    where.push('r.is_approved=TRUE');
  }

  if (status)        { where.push('r.status=?');        params.push(status); }
  if (category_id)   { where.push('r.category_id=?');   params.push(category_id); }
  if (department_id) { where.push('r.department_id=?'); params.push(department_id); }
  if (search)        { where.push('(r.title LIKE ? OR r.description LIKE ?)'); params.push(`%${search}%`,`%${search}%`); }

  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  try {
    const [reports] = await db.query(
      `SELECT r.report_id, r.title, r.status, r.created_at,
              (r.awaiting_closure+0) AS awaiting_closure,
              (r.is_approved+0)     AS is_approved,
              a.anon_id AS author, c.name AS category, d.name AS department,
              (SELECT COUNT(*) FROM Comments cm WHERE cm.report_id=r.report_id) AS comment_count
       FROM Reports r
       LEFT JOIN Anonymous_ID a ON r.user_id=a.user_id
       LEFT JOIN Categories   c ON r.category_id=c.category_id
       LEFT JOIN Departments  d ON r.department_id=d.department_id
       ${w} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM Reports r ${w}`, params);
    res.json({ reports, total, page:parseInt(page), pages:Math.ceil(total/limit) });
  } catch (err) {
    console.error('getReports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

const getReport = async (req, res) => {
  const { id } = req.params;
  const user   = req.user;
  try {
    const [rows] = await db.query(
      `SELECT r.report_id, r.title, r.description, r.status, r.created_at, r.updated_at,
              (r.awaiting_closure+0) AS awaiting_closure,
              (r.is_approved+0)     AS is_approved,
              r.user_id,
              a.anon_id AS author, c.name AS category, d.name AS department
       FROM Reports r
       LEFT JOIN Anonymous_ID a ON r.user_id=a.user_id
       LEFT JOIN Categories   c ON r.category_id=c.category_id
       LEFT JOIN Departments  d ON r.department_id=d.department_id
       WHERE r.report_id=?`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Report not found' });
    const report = rows[0];
    if ((user.role==='student'||user.role==='staff') && report.user_id !== user.user_id)
      return res.status(403).json({ error: 'Access denied' });

    const [attachments] = await db.query('SELECT * FROM Attachments WHERE report_id=?', [id]);
    const [responses]   = await db.query(
      `SELECT rr.response_id, rr.message, rr.created_at, a.anon_id AS responder
       FROM Report_Responses rr LEFT JOIN Anonymous_ID a ON rr.admin_id=a.user_id
       WHERE rr.report_id=? ORDER BY rr.created_at ASC`, [id]
    );
    res.json({ ...report, attachments, responses });
  } catch (err) {
    console.error('getReport error:', err);
    res.status(500).json({ error: 'Failed to get report' });
  }
};

const updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!['Pending','In Progress','Resolved','Rejected'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });

  const [rows] = await db.query(
    'SELECT user_id, title, (is_approved+0) AS is_approved FROM Reports WHERE report_id=?',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Report not found' });
  if (req.user.role === 'admin' && Number(rows[0].is_approved) !== 1)
    return res.status(403).json({ error: 'Report must be approved by superadmin first' });

  await db.query('UPDATE Reports SET status=? WHERE report_id=?', [status, req.params.id]);

  // Real-time notify student
  await notify(req, rows[0].user_id, 'status_change', 'Report Status Updated',
    `Your report "${rows[0].title}" is now: ${status}`, `/reports/${req.params.id}`);

  // Also emit report_update event so ReportDetail page auto-refreshes
  const io = req.app.get('io');
  if (io) io.to(`report_${req.params.id}`).emit('report_update', { report_id: req.params.id, status });

  res.json({ message: 'Status updated' });
};

const respondToReport = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  await db.query(
    'INSERT INTO Report_Responses (report_id,admin_id,message,attachment_path) VALUES (?,?,?,?)',
    [req.params.id, req.user.user_id, message, req.file?.filename||null]
  );
  await db.query(`UPDATE Reports SET status='In Progress' WHERE report_id=? AND status='Pending'`, [req.params.id]);

  const [rows] = await db.query('SELECT user_id, title FROM Reports WHERE report_id=?', [req.params.id]);
  if (rows.length) {
    await notify(req, rows[0].user_id, 'admin_response', 'Admin Responded to Your Report',
      `An admin responded to your report "${rows[0].title}".`, `/reports/${req.params.id}`);
  }
  const io = req.app.get('io');
  if (io) io.to(`report_${req.params.id}`).emit('report_update', { report_id: req.params.id });

  res.json({ message: 'Response sent' });
};

const askClosure = async (req, res) => {
  await db.query('UPDATE Reports SET awaiting_closure=TRUE,closure_asked_at=NOW() WHERE report_id=?', [req.params.id]);
  const [rows] = await db.query('SELECT user_id, title FROM Reports WHERE report_id=?', [req.params.id]);
  if (rows.length) {
    await notify(req, rows[0].user_id, 'closure_request', 'Has Your Issue Been Resolved?',
      `Please confirm if your report "${rows[0].title}" has been resolved.`, `/reports/${req.params.id}`);
  }
  const io = req.app.get('io');
  if (io) io.to(`report_${req.params.id}`).emit('report_update', { report_id: req.params.id });
  res.json({ message: 'Closure request sent' });
};

const confirmClosure = async (req, res) => {
  const { resolved } = req.body;
  const status = resolved ? 'Resolved' : 'In Progress';
  await db.query('UPDATE Reports SET status=?,awaiting_closure=FALSE WHERE report_id=?', [status, req.params.id]);
  const io = req.app.get('io');
  if (io) io.to(`report_${req.params.id}`).emit('report_update', { report_id: req.params.id, status });
  res.json({ message: 'Response recorded' });
};

const getPublicReports = async (req, res) => {
  try {
    const [reports] = await db.query(
      `SELECT r.report_id, r.title, r.created_at, r.updated_at,
              c.name AS category, d.name AS department,
              TIMESTAMPDIFF(HOUR, r.created_at, r.updated_at) AS hours_taken
       FROM Reports r
       LEFT JOIN Categories  c ON r.category_id=c.category_id
       LEFT JOIN Departments d ON r.department_id=d.department_id
       WHERE r.status='Resolved' AND r.is_approved=TRUE
       ORDER BY r.updated_at DESC LIMIT 100`
    );
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch public reports' });
  }
};

const getCategories  = async (req, res) => { const [r] = await db.query('SELECT * FROM Categories ORDER BY category_id'); res.json(r); };
const getDepartments = async (req, res) => { const [r] = await db.query('SELECT * FROM Departments ORDER BY name'); res.json(r); };

module.exports = { createReport, getReports, getReport, updateStatus, respondToReport, askClosure, confirmClosure, getPublicReports, getCategories, getDepartments };
