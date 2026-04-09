const express = require('express');
const router  = express.Router();
const { getLogs } = require('../controllers/logController');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/', authorize('admin'), getLogs);

module.exports = router;
