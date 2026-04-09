const User = require('../models/User');
const Log  = require('../models/Log');

// @route GET /api/users
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/users
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, password are required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });

    const user = await User.create({ name, email, password, role: role || 'viewer' });

    await Log.create({
      user: req.user.id, userName: req.user.name,
      action: 'CREATE_USER', resource: 'users',
      details: `Created user: ${email} (${role})`, ipAddress: req.ip || '127.0.0.1',
    });

    res.status(201).json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive },
    });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const { name, role, isActive } = req.body;
    const updates = {};
    if (name !== undefined)     updates.name     = name;
    if (role !== undefined)     updates.role     = role;
    if (isActive !== undefined) updates.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await Log.create({
      user: req.user.id, userName: req.user.name,
      action: 'UPDATE_USER', resource: 'users',
      details: `Updated user: ${user.email}`, ipAddress: req.ip || '127.0.0.1',
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await Log.create({
      user: req.user.id, userName: req.user.name,
      action: 'DELETE_USER', resource: 'users',
      details: `Deleted user: ${user.email}`, ipAddress: req.ip || '127.0.0.1',
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
