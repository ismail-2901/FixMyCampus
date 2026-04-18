// controllers/reportsController.js
const db = require('../config/db');

const genReportId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const id = Array.from({length:6}, ()=> chars[Math.floor(Math.random()*chars.length)]).join('');
  return `RPT-${id}`;
};

const createReport = async (req, res) => {
  console.log('\n===== REPORT CREATION DEBUG =====');
  console.log('Raw req.body keys:', Object.keys(req.body));
  console.log('Raw req.body values:');
  Object.entries(req.body).forEach(([k,v]) => {
    console.log(`  ${k}: "${v}" (type:${typeof v}, length:${v?.length})`);
  });
  
  let { title, description, category_id, department_id } = req.body;
  
  console.log('\nEXTRACTED VALUES:');
  console.log(`  title: "${title}" (type:${typeof title})`);
  console.log(`  description: "${description?.substring(0,30)}..." (type:${typeof description})`);
  console.log(`  category_id: "${category_id}" (type:${typeof category_id})`);
  console.log(`  department_id: "${department_id}" (type:${typeof department_id})`);
  
  // Trim and clean inputs
  title = (title || '').trim();
  description = (description || '').trim();
  
  console.log('\nAFTER TRIM:');
  console.log(`  title: "${title}" (length:${title.length})`);
  console.log(`  description length: ${description.length}`);
  
  // Parse with validation
  const cat_id = parseInt(category_id);
  const dept_id = parseInt(department_id);
  
  console.log('\nAFTER PARSE:');
  console.log(`  category_id: ${cat_id} (isNaN:${isNaN(cat_id)}, isValid:${!isNaN(cat_id) && cat_id > 0})`);
  console.log(`  department_id: ${dept_id} (isNaN:${isNaN(dept_id)}, isValid:${!isNaN(dept_id) && dept_id > 0})`);
  
  // Strict validation
  if (!title || title.length < 3) {
    console.log('❌ VALIDATION FAILED: Title');
    return res.status(400).json({ error: 'Title required (min 3 chars)' });
  }
  if (!description || description.length < 10) {
    console.log('❌ VALIDATION FAILED: Description');
    return res.status(400).json({ error: 'Description required (min 10 chars)' });
  }
  if (isNaN(cat_id) || cat_id <= 0) {
    console.log('❌ VALIDATION FAILED: Category ID invalid');
    return res.status(400).json({ error: 'Valid category required' });
  }
  if (isNaN(dept_id) || dept_id <= 0) {
    console.log('❌ VALIDATION FAILED: Department ID invalid');
    return res.status(400).json({ error: 'Valid department required' });
  }

  try {
    const reportId = genReportId();
    console.log(`\n✅ All validations passed!`);
    console.log(`Creating report: ${reportId}`);
    console.log(`Final title to store: "${title}"`);
    
    await db.query(
      'INSERT INTO Reports (report_id,user_id,title,description,category_id,department_id) VALUES (?,?,?,?,?,?)',
      [reportId, req.user.user_id, title, description, cat_id, dept_id]
    );
    console.log('✅ Inserted into database\n');
    if (req.files?.length) {
      for (const f of req.files)
        await db.query('INSERT INTO Attachments (report_id,file_path,file_type) VALUES (?,?,?)',
          [reportId, f.filename, f.mimetype]);
    }
    res.status(201).json({ message: 'Report submitted!', report_id: reportId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

const getReports = async (req, res) => {
  const { status, category_id, department_id, search, page=1, limit=10 } = req.query;
  const user   = req.user;
  const offset = (page - 1) * limit;
  let where = [], params = [];

  // Students/Staff only see their own approved reports
  if (user.role === 'student' || user.role === 'staff') {
    where.push('r.user_id=?'); params.push(user.user_id);
    where.push('r.is_approved=TRUE'); 
  } 
  // Admins only see approved reports in their department
  else if (user.role === 'admin') {
    const [a] = await db.query('SELECT department_id FROM Admin_Assignments WHERE admin_id=?', [user.user_id]);
    const ids = a.map(x => x.department_id);
    if (ids.length) { 
      where.push(`r.department_id IN (${ids.map(()=>'?')})`); 
      params.push(...ids); 
    } else return res.json({ reports:[], total:0, page:1, pages:0 });
    where.push('r.is_approved=TRUE');
  }
  // Superadmin sees all reports
  else if (user.role === 'superadmin') {
    // No restrictions
  }

  if (status)        { where.push('r.status=?');        params.push(status); }
  if (category_id)   { where.push('r.category_id=?');   params.push(category_id); }
  if (department_id) { where.push('r.department_id=?'); params.push(department_id); }
  if (search)        { where.push('(r.title LIKE ? OR r.description LIKE ?)'); params.push(`%${search}%`,`%${search}%`); }

  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  try {
    const [reports] = await db.query(
      `SELECT r.report_id,r.title,r.status,r.created_at,r.awaiting_closure,
              a.anon_id AS author, c.name AS category, d.name AS department,
              (SELECT COUNT(*) FROM Comments cm WHERE cm.report_id=r.report_id) AS comment_count
       FROM Reports r
       LEFT JOIN Anonymous_ID a ON r.user_id=a.user_id
       LEFT JOIN Categories c ON r.category_id=c.category_id
       LEFT JOIN Departments d ON r.department_id=d.department_id
       ${w} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    console.log('\n===== GET REPORTS API RESPONSE =====');
    console.log(`Found ${reports.length} reports`);
    reports.slice(0, 3).forEach((r, i) => {
      console.log(`\nReport ${i+1}:`);
      console.log(`  report_id: ${r.report_id}`);
      console.log(`  title: "${r.title}" (length: ${r.title?.length})`);
      console.log(`  category: "${r.category}"`);
      console.log(`  department: "${r.department}"`);
      console.log(`  Keys in object:`, Object.keys(r));
    });
    
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM Reports r ${w}`, params);
    const response = { reports, total, page:parseInt(page), pages:Math.ceil(total/limit) };
    console.log('Sending response with', reports.length, 'reports');
    console.log('First report object:', JSON.stringify(reports[0], null, 2));
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

const getReport = async (req, res) => {
  const { id } = req.params;
  const user   = req.user;
  try {
    const [rows] = await db.query(
      `SELECT r.*, a.anon_id AS author, c.name AS category, d.name AS department
       FROM Reports r
       LEFT JOIN Anonymous_ID a ON r.user_id=a.user_id
       LEFT JOIN Categories c ON r.category_id=c.category_id
       LEFT JOIN Departments d ON r.department_id=d.department_id
       WHERE r.report_id=?`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Report not found' });
    const report = rows[0];

    if ((user.role==='student'||user.role==='staff') && report.user_id !== user.user_id)
      return res.status(403).json({ error: 'Access denied' });

    const [attachments] = await db.query('SELECT * FROM Attachments WHERE report_id=?', [id]);
    const [responses]   = await db.query(
      `SELECT rr.*, a.anon_id AS responder
       FROM Report_Responses rr LEFT JOIN Anonymous_ID a ON rr.admin_id=a.user_id
       WHERE rr.report_id=? ORDER BY rr.created_at ASC`, [id]
    );
    res.json({ ...report, attachments, responses });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get report' });
  }
};

const updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!['Pending','In Progress','Resolved','Rejected'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  await db.query('UPDATE Reports SET status=? WHERE report_id=?', [status, req.params.id]);
  res.json({ message: 'Status updated' });
};

const respondToReport = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  await db.query(
    'INSERT INTO Report_Responses (report_id,admin_id,message,attachment_path) VALUES (?,?,?,?)',
    [req.params.id, req.user.user_id, message, req.file?.filename || null]
  );
  await db.query(`UPDATE Reports SET status='In Progress' WHERE report_id=? AND status='Pending'`, [req.params.id]);
  res.json({ message: 'Response sent' });
};

const askClosure = async (req, res) => {
  await db.query('UPDATE Reports SET awaiting_closure=TRUE,closure_asked_at=NOW() WHERE report_id=?', [req.params.id]);
  res.json({ message: 'Closure request sent' });
};

const confirmClosure = async (req, res) => {
  const { resolved } = req.body;
  const status = resolved ? 'Resolved' : 'In Progress';
  await db.query('UPDATE Reports SET status=?,awaiting_closure=FALSE WHERE report_id=?', [status, req.params.id]);
  res.json({ message: 'Response recorded' });
};

const getCategories  = async (req, res) => { const [r] = await db.query('SELECT * FROM Categories ORDER BY category_id'); res.json(r); };
const getDepartments = async (req, res) => { const [r] = await db.query('SELECT * FROM Departments ORDER BY name'); res.json(r); };

module.exports = { createReport,getReports,getReport,updateStatus,respondToReport,askClosure,confirmClosure,getCategories,getDepartments };
