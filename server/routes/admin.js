const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const db = require('../config/db');

router.get('/dashboard', authenticate, requireRole('admin'), async (req, res) => {
  const [depts] = await db.query('SELECT department_id FROM Admin_Assignments WHERE admin_id=?', [req.user.user_id]);
  const ids = depts.map(d => d.department_id);
  if (!ids.length) return res.json({ reports:[], stats:{pending:0,inprogress:0,resolved:0} });

  const ph = ids.map(()=>'?').join(',');
  const [reports] = await db.query(
    `SELECT r.report_id, r.title, r.status, r.created_at,
            (r.awaiting_closure + 0) AS awaiting_closure,
            (r.is_approved + 0) AS is_approved,
            a.anon_id AS author, c.name AS category, d.name AS department
     FROM Reports r
     LEFT JOIN Anonymous_ID a ON r.user_id=a.user_id
     LEFT JOIN Categories c ON r.category_id=c.category_id
     LEFT JOIN Departments d ON r.department_id=d.department_id
     WHERE r.department_id IN (${ph}) AND r.is_approved=TRUE
     ORDER BY r.created_at DESC LIMIT 100`,
    ids
  );

  const [[p]]  = await db.query(`SELECT COUNT(*) AS c FROM Reports WHERE status='Pending' AND department_id IN (${ph}) AND is_approved=TRUE`, ids);
  const [[ip]] = await db.query(`SELECT COUNT(*) AS c FROM Reports WHERE status='In Progress' AND department_id IN (${ph}) AND is_approved=TRUE`, ids);
  const [[rs]] = await db.query(`SELECT COUNT(*) AS c FROM Reports WHERE status='Resolved' AND department_id IN (${ph}) AND is_approved=TRUE`, ids);

  res.json({ reports, stats:{ pending:p.c, inprogress:ip.c, resolved:rs.c } });
});

module.exports = router;
