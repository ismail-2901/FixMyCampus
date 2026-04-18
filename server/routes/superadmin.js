const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/superAdminController');

router.use(authenticate, requireRole('superadmin'));
router.get('/users',               ctrl.getAllUsers);
router.patch('/users/:id/ban',     ctrl.banUser);
router.delete('/users/:id',        ctrl.deleteUser);
router.post('/admins',             ctrl.createAdmin);
router.get('/stats',               ctrl.getStats);
router.patch('/reports/:id/approve', ctrl.approveReport);
router.get('/reports',             ctrl.getAllReports);
module.exports = router;
