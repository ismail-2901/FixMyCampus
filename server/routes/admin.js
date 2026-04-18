const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const db = require('../config/db');

router.get('/dashboard', authenticate, requireRole('admin'), async (req, res) => {
  const [depts] = await db.query('SELECT department_id FROM Admin_Assignments WHERE admin_id=?', [req.user.user_id]);
  const ids = depts.map(d => d.department_id);
  if (!ids.length) return res.json({ reports:[], stats:{pending:0,inprogress:0,resolved:0} });

  const ph = ids.map(()=>'?').join(',');
  const [reports] = await db.query(
    `SELECT r.report_id,r.title,r.status,r.created_at,r.awaiting_closure,
            a.anon_id AS author,c.name AS category,d.name AS department
     FROM Reports r
     LEFT JOIN Anonymous_ID a ON r.user_id=a.user_id
     LEFT JOIN Categories c ON r.category_id=c.category_id
     LEFT JOIN Departments d ON r.department_id=d.department_id
     WHERE r.department_id IN (${ph}) ORDER BY r.created_at DESC LIMIT 100`,
    ids
  );
  
  console.log('\n===== ADMIN DASHBOARD API RESPONSE =====');
  console.log(`Admin ${req.user.user_id} departments:`, ids);
  console.log(`Found ${reports.length} reports`);
  reports.slice(0, 3).forEach((r, i) => {
    console.log(`\nReport ${i+1}:`);
    console.log(`  report_id: "${r.report_id}"`);
    console.log(`  title: "${r.title}" (type: ${typeof r.title}, length: ${r.title?.length})`);
    console.log(`  awaiting_closure: ${r.awaiting_closure} (type: ${typeof r.awaiting_closure})`);
    console.log(`  category: "${r.category}"`);
    console.log(`  department: "${r.department}"`);
    console.log(`  title ends with 0? ${r.title?.endsWith('0')}`);
    console.log(`  All keys:`, Object.keys(r));
  });
  
  const [[p]]  = await db.query(`SELECT COUNT(*) AS c FROM Reports WHERE status='Pending' AND department_id IN (${ph})`, ids);
  const [[ip]] = await db.query(`SELECT COUNT(*) AS c FROM Reports WHERE status='In Progress' AND department_id IN (${ph})`, ids);
  const [[rs]] = await db.query(`SELECT COUNT(*) AS c FROM Reports WHERE status='Resolved' AND department_id IN (${ph})`, ids);
  
  const response = { reports, stats:{ pending:p.c, inprogress:ip.c, resolved:rs.c } };
  console.log('\nFinal response being sent:');
  console.log(JSON.stringify(response.reports.slice(0, 2), null, 2));
  res.json(response);
});

module.exports = router;
