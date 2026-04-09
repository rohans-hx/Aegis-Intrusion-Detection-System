const Log = require('../models/Log');

// @route GET /api/logs
exports.getLogs = async (req, res, next) => {
  try {
    const { action, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;

    const total = await Log.countDocuments(filter);
    const logs  = await Log.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('user', 'name email');

    res.json({
      success: true,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
