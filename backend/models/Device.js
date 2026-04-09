const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true },
  mac: String,
  hostname: String,
  vendor: String,
  deviceType: { type: String, enum: ['server', 'workstation', 'router', 'firewall', 'iot', 'unknown'], default: 'unknown' },
  status: { type: String, enum: ['online', 'offline', 'suspect'], default: 'online' },
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  openPorts: [{ port: Number, service: String }],
  os: String,
  location: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);