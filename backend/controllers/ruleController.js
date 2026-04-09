const Rule = require('../models/Rule');
const Log  = require('../models/Log');

// @route GET /api/rules
exports.getRules = async (req, res, next) => {
  try {
    const rules = await Rule.find().sort({ createdAt: -1 }).populate('createdBy', 'name email');
    res.json({ success: true, count: rules.length, data: rules });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/rules
exports.createRule = async (req, res, next) => {
  try {
    const rule = await Rule.create({ ...req.body, createdBy: req.user.id });

    await Log.create({
      user: req.user.id, userName: req.user.name,
      action: 'CREATE_RULE', resource: 'rules',
      details: `Created rule: ${rule.name}`, ipAddress: req.ip || '127.0.0.1',
    });

    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/rules/:id
exports.updateRule = async (req, res, next) => {
  try {
    req.body.updatedAt = new Date();
    const rule = await Rule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });

    await Log.create({
      user: req.user.id, userName: req.user.name,
      action: 'UPDATE_RULE', resource: 'rules',
      details: `Updated rule: ${rule.name}`, ipAddress: req.ip || '127.0.0.1',
    });

    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

// @route PATCH /api/rules/:id/toggle
exports.toggleRule = async (req, res, next) => {
  try {
    const rule = await Rule.findById(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });

    rule.enabled   = !rule.enabled;
    rule.updatedAt = new Date();
    await rule.save();

    await Log.create({
      user: req.user.id, userName: req.user.name,
      action: rule.enabled ? 'ENABLE_RULE' : 'DISABLE_RULE',
      resource: 'rules',
      details: `${rule.enabled ? 'Enabled' : 'Disabled'} rule: ${rule.name}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/rules/:id
exports.deleteRule = async (req, res, next) => {
  try {
    const rule = await Rule.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
    res.json({ success: true, message: 'Rule deleted successfully' });
  } catch (error) {
    next(error);
  }
};
