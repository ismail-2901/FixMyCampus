require('dotenv').config();
const express   = require('express');
const http      = require('http');
const cors      = require('cors');
const helmet    = require('helmet');
const path      = require('path');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const jwt       = require('jsonwebtoken');

const app    = express();
const server = http.createServer(app);

// ── Socket.io ──────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true },
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'fixmycampus_jwt_secret_diu_2024_secure_key');
    socket.userId   = payload.userId || payload.user_id || payload.id;
    socket.userRole = payload.role;
    next();
  } catch { next(new Error('Invalid token')); }
});

io.on('connection', socket => {
  // Personal notification room
  if (socket.userId) socket.join(`user_${socket.userId}`);

  // Group chat rooms
  socket.on('join_group',  groupId => socket.join(`group_${groupId}`));
  socket.on('leave_group', groupId => socket.leave(`group_${groupId}`));

  // Report detail live-refresh room (users watching a specific report)
  socket.on('watch_report',  reportId => socket.join(`report_${reportId}`));
  socket.on('unwatch_report', reportId => socket.leave(`report_${reportId}`));

  socket.on('disconnect', () => {});
});

app.set('io', io);

// ── Middleware ─────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// ── Routes ─────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/reports',       require('./routes/reports'));
app.use('/api/comments',      require('./routes/comments'));
app.use('/api/groups',        require('./routes/groups'));
app.use('/api/chatbot',       require('./routes/chatbot'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/superadmin',    require('./routes/superadmin'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));

require('./services/cronJobs');

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`\n🚀 FixMyCampus v2 running at http://localhost:${PORT}`);
  console.log(`📁 Frontend at http://localhost:3000\n`);
});
