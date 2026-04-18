const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
router.post('/register',     ctrl.register);
router.post('/verify-email', ctrl.verifyEmail);
router.post('/login',        ctrl.login);
router.post('/resend-code',  ctrl.resendCode);
router.get('/me',            authenticate, ctrl.getMe);
module.exports = router;
