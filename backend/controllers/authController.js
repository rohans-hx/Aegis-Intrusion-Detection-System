const User = require('../models/User');
const Log  = require('../models/Log');
const jwt  = require('jsonwebtoken');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const createLog = async (userId, userName, action, resource, ipAddress, success = true, details = '') => {
  try {
    await Log.create({ user: userId, userName, action, resource, ipAddress, success, details });
  } catch (e) {
    console.error('Log error:', e.message);
  }
};

// @route POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const allowedRole = ['admin', 'analyst', 'viewer'].includes(role) ? role : 'viewer';
    const user  = await User.create({ name, email, password, role: allowedRole });
    const token = generateToken(user._id);

    await createLog(user._id, user.name, 'REGISTER', 'auth', req.ip || '127.0.0.1', true);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      await createLog(null, email, 'LOGIN_FAILED', 'auth', req.ip || '127.0.0.1', false, 'Invalid credentials');
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been disabled' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    await createLog(user._id, user.name, 'LOGIN', 'auth', req.ip || '127.0.0.1', true);

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, user });
};

// @route POST /api/auth/logout
exports.logout = async (req, res) => {
  await createLog(req.user.id, req.user.name, 'LOGOUT', 'auth', req.ip || '127.0.0.1', true);
  res.json({ success: true, message: 'Logged out successfully' });
};
