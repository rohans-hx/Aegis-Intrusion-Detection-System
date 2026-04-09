const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { discoverDevices, getDevices, getDeviceById, updateDevice, deleteDevice, getDeviceStats } = require('../controllers/deviceController');

router.get('/discover', protect, authorize('admin', 'analyst'), discoverDevices);
router.get('/stats', protect, getDeviceStats);
router.get('/', protect, getDevices);
router.get('/:id', protect, getDeviceById);
router.put('/:id', protect, authorize('admin', 'analyst'), updateDevice);
router.delete('/:id', protect, authorize('admin'), deleteDevice);

module.exports = router;