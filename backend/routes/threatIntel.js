const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { lookupIP, addToBlocklist, removeFromBlocklist, getBlocklist, bulkCheck } = require('../controllers/threatIntelController');

router.get('/lookup/:ip', protect, lookupIP);
router.get('/blocklist', protect, getBlocklist);
router.post('/blocklist', protect, authorize('admin', 'analyst'), addToBlocklist);
router.delete('/blocklist/:ip', protect, authorize('admin', 'analyst'), removeFromBlocklist);
router.post('/bulk-check', protect, bulkCheck);

module.exports = router;