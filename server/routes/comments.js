const router = require('express').Router();
const ctrl = require('../controllers/commentsController');
const { authenticate, requireRole } = require('../middleware/auth');
router.get('/:reportId',     authenticate, ctrl.getComments);
router.post('/:reportId',    authenticate, ctrl.addComment);
router.delete('/:commentId', authenticate, requireRole('admin','superadmin'), ctrl.deleteComment);
module.exports = router;
