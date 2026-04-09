const Alert = require('../models/Alert');
const Log   = require('../models/Log');
const { generateAttack } = require('../utils/attackSimulator');

const emitAlert = (io, alert) => {
  if (io) {
    io.emit('new-alert', alert);
    io.emit('stats-update', { type: 'alert', severity: alert.severity, status: alert.status });
  }
};

// @route GET /api/alerts
exports.getAlerts = async (req, res, next) => {
  try {
    const {
      severity, attackType, status,
      startDate, endDate,
      page = 1, limit = 20, search
    } = req.query;

    const filter = {};
    if (severity)   filter.severity   = severity;
    if (attackType) filter.attackType = attackType;
    if (status)     filter.status     = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate)   filter.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { title:      { $regex: search, $options: 'i' } },
        { sourceIP:   { $regex: search, $options: 'i' } },
        { attackType: { $regex: search, $options: 'i' } },
      ];
    }

    const total  = await Alert.countDocuments(filter);
    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/alerts/stats
exports.getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalAlerts, openAlerts, criticalAlerts, resolvedToday, bySeverity, byAttackType, recentAlerts] =
      await Promise.all([
        Alert.countDocuments(),
        Alert.countDocuments({ status: 'Open' }),
        Alert.countDocuments({ severity: 'Critical', status: { $ne: 'Resolved' } }),
        Alert.countDocuments({ status: 'Resolved', resolvedAt: { $gte: today } }),
        Alert.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
        Alert.aggregate([
          { $group: { _id: '$attackType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Alert.find().sort({ createdAt: -1 }).limit(8),
      ]);

    res.json({
      success: true,
      data: { totalAlerts, openAlerts, criticalAlerts, resolvedToday, bySeverity, byAttackType, recentAlerts },
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/alerts/:id
exports.getAlertById = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/alerts/simulate
exports.simulateAttack = async (req, res, next) => {
  try {
    const { attackType } = req.body;
    const attackData = generateAttack(attackType);
    const alert = await Alert.create(attackData);

    await Log.create({
      user: req.user.id,
      userName: req.user.name,
      action: 'SIMULATE_ATTACK',
      resource: 'alerts',
      details: `Simulated ${attackData.attackType} from ${attackData.sourceIP}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    const io = req.app.get('io');
    emitAlert(io, alert);

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

// @route PATCH /api/alerts/:id/status
exports.updateAlertStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['Open', 'Investigating', 'Resolved', 'False Positive'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const update = { status };
    if (status === 'Resolved') {
      update.resolvedAt = new Date();
      update.resolvedBy = req.user.id;
    }

    const alert = await Alert.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

    const io = req.app.get('io');
    if (io) {
      io.emit('alert-updated', alert);
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/alerts/:id
exports.deleteAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, message: 'Alert deleted successfully' });
  } catch (error) {
    next(error);
  }
};
