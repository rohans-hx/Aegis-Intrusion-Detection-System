const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Rule name is required'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  attackType: {
    type: String,
    required: [true, 'Attack type is required'],
    enum: ['Port Scan', 'SQL Injection', 'Brute Force', 'DDoS', 'Malware', 'XSS', 'MITM', 'Ransomware'],
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
  },
  threshold: {
    type: Number,
    default: 10,
    min: 1,
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  triggerCount: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

module.exports = mongoose.model('Rule', ruleSchema);
