// middleware/upload.js
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`),
});

const fileFilter = (req, file, cb) => {
  const ok = /jpeg|jpg|png|gif|pdf/.test(path.extname(file.originalname).toLowerCase());
  ok ? cb(null, true) : cb(new Error('Only images and PDFs allowed'));
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
