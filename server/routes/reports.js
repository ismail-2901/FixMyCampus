const router = require('express').Router();
const ctrl   = require('../controllers/reportsController');
const cc     = require('../controllers/commentsController');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/categories',  authenticate, ctrl.getCategories);
router.get('/departments', ctrl.getDepartments);
router.get('/',            authenticate, ctrl.getReports);
router.post('/',           authenticate, upload.array('attachments',5), ctrl.createReport);
router.get('/:id',         authenticate, ctrl.getReport);
router.patch('/:id/status',          authenticate, requireRole('admin','superadmin'), ctrl.updateStatus);
router.post('/:id/respond',          authenticate, requireRole('admin','superadmin'), upload.single('attachment'), ctrl.respondToReport);
router.post('/:id/ask-closure',      authenticate, requireRole('admin','superadmin'), ctrl.askClosure);
router.post('/:id/confirm-closure',  authenticate, ctrl.confirmClosure);
router.post('/:reportId/react',      authenticate, cc.reactToReport);
module.exports = router;
