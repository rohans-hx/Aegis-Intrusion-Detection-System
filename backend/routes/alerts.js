const express = require('express');
const router  = express.Router();
const {
  getAlerts, getAlertById, simulateAttack,
  updateAlertStatus, deleteAlert, getStats,
} = require('../controllers/alertController');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/stats',          authorize('admin', 'analyst', 'viewer'), getStats);
router.get('/',               authorize('admin', 'analyst', 'viewer'), getAlerts);
router.get('/:id',            authorize('admin', 'analyst', 'viewer'), getAlertById);
router.post('/simulate',      authorize('admin', 'analyst'),           simulateAttack);
router.patch('/:id/status',   authorize('admin', 'analyst'),           updateAlertStatus);
router.delete('/:id',         authorize('admin'),                      deleteAlert);

module.exports = router;
