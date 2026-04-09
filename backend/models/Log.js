const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  userName: {
    type: String,
    default: 'System',
  },
  action: {
    type: String,
    required: true,
  },
  resource: {
    type: String,
    default: 'system',
  },
  details: {
    type: String,
  },
  ipAddress: {
    type: String,
    default: 'Unknown',
  },
  success: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

logSchema.index({ createdAt: -1 });
logSchema.index({ action: 1 });

module.exports = mongoose.model('Log', logSchema);
