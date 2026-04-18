// services/cronJobs.js - Auto-close stale reports
const cron = require('node-cron');
const db   = require('../config/db');

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [r] = await db.query(
    `UPDATE Reports SET status='Resolved', awaiting_closure=FALSE
     WHERE awaiting_closure=TRUE AND closure_asked_at < ?`,
    [sevenDaysAgo]
  ).catch(() => [{ affectedRows: 0 }]);
  if (r.affectedRows > 0) console.log(`⏰ Auto-closed ${r.affectedRows} report(s)`);
});

console.log('⏰ Cron jobs initialized');
