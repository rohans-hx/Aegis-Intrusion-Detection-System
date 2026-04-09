const express = require('express');
const router = express.Router();

let settings = {
  systemName: 'AEGIS IDS',
  retentionDays: 30,
  alertThreshold: 10,
  emailNotifications: true,
  autoBlock: false,
  logLevel: 'info',
};

router.get('/', (req, res) => {
  res.json({ success: true, data: settings });
});

router.put('/', (req, res) => {
  const { systemName, retentionDays, alertThreshold, emailNotifications, autoBlock, logLevel } = req.body;
  
  if (retentionDays && (retentionDays < 1 || retentionDays > 365)) {
    return res.status(400).json({ success: false, message: 'Retention days must be between 1 and 365' });
  }
  if (alertThreshold && (alertThreshold < 1 || alertThreshold > 100)) {
    return res.status(400).json({ success: false, message: 'Alert threshold must be between 1 and 100' });
  }

  settings = {
    ...settings,
    ...(systemName && { systemName }),
    ...(retentionDays && { retentionDays }),
    ...(alertThreshold && { alertThreshold }),
    ...(emailNotifications !== undefined && { emailNotifications }),
    ...(autoBlock !== undefined && { autoBlock }),
    ...(logLevel && { logLevel }),
  };

  res.json({ success: true, message: 'Settings updated successfully', data: settings });
});

module.exports = router;