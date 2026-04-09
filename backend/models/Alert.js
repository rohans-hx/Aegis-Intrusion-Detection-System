const mongoose = require('mongoose');

const ATTACK_TYPES = [
  'Port Scan', 'SQL Injection', 'Brute Force',
  'DDoS', 'Malware', 'XSS', 'MITM', 'Ransomware'
];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES   = ['Open', 'Investigating', 'Resolved', 'False Positive'];

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  attackType: {
    type: String,
    required: true,
    enum: ATTACK_TYPES,
  },
  severity: {
    type: String,
    required: true,
    enum: SEVERITIES,
  },
  status: {
    type: String,
    default: 'Open',
    enum: STATUSES,
  },
  sourceIP: {
    type: String,
    required: true,
  },
  targetIP: {
    type: String,
    required: true,
  },
  sourceCountry: {
    type: String,
    default: 'Unknown',
  },
  targetPort: {
    type: Number,
  },
  threatScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  details: {
    type: String,
  },
  payload: {
    type: String,
  },
  resolvedAt: {
    type: Date,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

alertSchema.index({ createdAt: -1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ attackType: 1 });
alertSchema.index({ status: 1 });

module.exports = mongoose.model('Alert', alertSchema);
