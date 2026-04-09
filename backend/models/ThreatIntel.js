const mongoose = require('mongoose');

const threatIntelSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true },
  reputation: { type: String, enum: ['malicious', 'suspicious', 'clean'], default: 'clean' },
  threatTypes: [{ type: String }],
  country: String,
  isp: String,
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  score: { type: Number, default: 0, min: 0, max: 100 },
  description: String,
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ThreatIntel', threatIntelSchema);