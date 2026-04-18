// seed.js - Run this ONCE after importing schema.sql
// Command: node seed.js  (run from the server folder)

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fixmycampus',
  });

  console.log('Connected to database...');

  const hash = await bcrypt.hash('Admin@1234', 10);

  // Super Admin
  await db.execute(
    `INSERT IGNORE INTO Users (name, email, password_hash, role, is_verified)
     VALUES (?, ?, ?, 'superadmin', TRUE)`,
    ['Super Admin', 'superadmin@diu.edu.bd', hash]
  );

  const [superRows] = await db.execute(
    `SELECT user_id FROM Users WHERE email = 'superadmin@diu.edu.bd'`
  );
  const superId = superRows[0].user_id;
  await db.execute(
    `INSERT IGNORE INTO Anonymous_ID (anon_id, user_id) VALUES ('ANON-SUPER1', ?)`,
    [superId]
  );

  // SE Dept Admin
  await db.execute(
    `INSERT IGNORE INTO Users (name, email, password_hash, role, department_id, is_verified)
     VALUES (?, ?, ?, 'admin', 1, TRUE)`,
    ['SE Admin', 'se.admin@diu.edu.bd', hash]
  );

  const [adminRows] = await db.execute(
    `SELECT user_id FROM Users WHERE email = 'se.admin@diu.edu.bd'`
  );
  const adminId = adminRows[0].user_id;
  await db.execute(
    `INSERT IGNORE INTO Anonymous_ID (anon_id, user_id) VALUES ('ANON-SEADM1', ?)`,
    [adminId]
  );
  await db.execute(
    `INSERT IGNORE INTO Admin_Assignments (admin_id, department_id) VALUES (?, 1)`,
    [adminId]
  );

  await db.end();

  console.log('\n✅ Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin  → superadmin@diu.edu.bd  / Admin@1234');
  console.log('SE Admin     → se.admin@diu.edu.bd    / Admin@1234');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
