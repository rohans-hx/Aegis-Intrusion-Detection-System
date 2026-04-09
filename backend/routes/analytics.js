const express = require('express');
const router  = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/', authorize('admin', 'analyst', 'viewer'), getAnalytics);

module.exports = router;
