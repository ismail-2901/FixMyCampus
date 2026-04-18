// server.js - FixMyCampus Main Server Entry Point
require('dotenv').config();
const express  = require('express');
const http     = require('http');
const cors     = require('cors');
const helmet   = require('helmet');
const path     = require('path');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);

// ── Socket.io ──────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }
});

// ── Middleware ─────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// ── Routes ─────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/reports',    require('./routes/reports'));
app.use('/api/comments',   require('./routes/comments'));
app.use('/api/groups',     require('./routes/groups'));
app.use('/api/chatbot',    require('./routes/chatbot'));
app.use('/api/admin',      require('./routes/admin'));
app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/users',      require('./routes/users'));

// ── Sockets ────────────────────────────────────────────

// ── Cron Jobs ──────────────────────────────────────────
require('./services/cronJobs');

// ── Health Check ───────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 FixMyCampus server running at http://localhost:${PORT}`);
  console.log(`📁 Frontend should run at http://localhost:3000\n`);
});
