require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../models/User');
const Alert    = require('../models/Alert');
const Rule     = require('../models/Rule');
const Log      = require('../models/Log');
const { generateAttack } = require('./attackSimulator');

const connect = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');
};

const seed = async () => {
  try {
    await connect();

    // Clear
    await Promise.all([
      User.deleteMany({}), Alert.deleteMany({}),
      Rule.deleteMany({}),  Log.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // ── Users ──────────────────────────────────────
    const admin = await User.create({
      name: 'Admin User', email: 'admin@aegis.com',
      password: 'admin123', role: 'admin',
    });
    const analyst = await User.create({
      name: 'Alex Carter', email: 'analyst@aegis.com',
      password: 'analyst123', role: 'analyst',
    });
    await User.create({
      name: 'Sam Viewer', email: 'viewer@aegis.com',
      password: 'viewer123', role: 'viewer',
    });
    console.log('👥 Users created');

    // ── Detection Rules ───────────────────────────
    const ruleData = [
      { name: 'Port Scan Detection',    attackType: 'Port Scan',      condition: 'TCP connections > threshold in 60s',          threshold: 100,  severity: 'Medium',   description: 'Detects horizontal and vertical port scanning' },
      { name: 'SQL Injection Filter',   attackType: 'SQL Injection',  condition: 'Request payload contains SQL keywords',        threshold: 1,    severity: 'High',     description: 'Blocks SQL injection patterns in HTTP requests' },
      { name: 'Brute Force Blocker',    attackType: 'Brute Force',    condition: 'Failed logins > threshold in 300s',            threshold: 10,   severity: 'High',     description: 'Blocks repeated authentication failures' },
      { name: 'DDoS Rate Limiter',      attackType: 'DDoS',           condition: 'Requests per second > threshold',              threshold: 1000, severity: 'Critical', description: 'Activates traffic shaping on flood detection' },
      { name: 'Malware Signature DB',   attackType: 'Malware',        condition: 'File hash matches known malware signatures',   threshold: 1,    severity: 'Critical', description: 'Compares against YARA rules and threat intel feeds' },
      { name: 'XSS Input Sanitizer',    attackType: 'XSS',            condition: 'Input contains script or event handler tags',  threshold: 1,    severity: 'Medium',   description: 'Sanitizes user input before processing' },
      { name: 'ARP Table Monitor',      attackType: 'MITM',           condition: 'Unexpected ARP reply from unregistered MAC',   threshold: 1,    severity: 'High',     description: 'Monitors ARP table for cache poisoning attempts' },
      { name: 'Ransomware Behaviour',   attackType: 'Ransomware',     condition: 'File modifications > threshold in 60s',        threshold: 500,  severity: 'Critical', description: 'Detects rapid mass file encryption activity' },
    ];
    await Rule.insertMany(ruleData.map((r) => ({ ...r, createdBy: admin._id, enabled: true })));
    console.log('⚙️  Rules created');

    // ── Alerts (70 spread over 10 days) ───────────
    const statuses  = ['Open', 'Open', 'Open', 'Investigating', 'Resolved', 'False Positive'];
    const alertDocs = [];
    for (let i = 0; i < 70; i++) {
      const attack    = generateAttack();
      const daysAgo   = Math.random() * 10;
      const createdAt = new Date(Date.now() - daysAgo * 86400000);
      const status    = statuses[Math.floor(Math.random() * statuses.length)];
      alertDocs.push({
        ...attack,
        status,
        createdAt,
        resolvedAt: status === 'Resolved' ? new Date(createdAt.getTime() + 1800000) : undefined,
      });
    }
    await Alert.insertMany(alertDocs);
    console.log('🚨 70 alerts seeded');

    // ── Audit Logs ────────────────────────────────
    await Log.insertMany([
      { user: admin._id,   userName: 'Admin User',  action: 'LOGIN',         resource: 'auth',   ipAddress: '127.0.0.1' },
      { user: analyst._id, userName: 'Alex Carter', action: 'LOGIN',         resource: 'auth',   ipAddress: '192.168.1.45' },
      { user: admin._id,   userName: 'Admin User',  action: 'CREATE_RULE',   resource: 'rules',  ipAddress: '127.0.0.1', details: 'Seeded 8 default rules' },
      { user: admin._id,   userName: 'Admin User',  action: 'SYSTEM_INIT',   resource: 'system', ipAddress: '127.0.0.1', details: 'AEGIS IDS initialized' },
    ]);
    console.log('📋 Audit logs seeded');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅  AEGIS IDS seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  admin@aegis.com   / admin123   (Admin)');
    console.log('  analyst@aegis.com / analyst123 (Analyst)');
    console.log('  viewer@aegis.com  / viewer123  (Viewer)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
