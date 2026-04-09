const Device = require('../models/Device');
const axios = require('axios');

const IP_RANGES = [
  '192.168.1.1',
  '192.168.1.10',
  '192.168.1.20',
  '192.168.1.50',
  '192.168.1.100',
  '192.168.1.110',
  '192.168.1.120',
  '192.168.1.130',
  '192.168.1.150',
  '192.168.1.200',
  '10.0.0.1',
  '10.0.0.10',
  '10.0.0.50',
  '10.0.0.100',
  '10.0.1.1',
];

const VENDORS = {
  'Cisco': ['router', 'switch', 'firewall'],
  'Dell': ['server', 'workstation'],
  'HP': ['server', 'printer'],
  'Lenovo': ['workstation'],
  'Apple': ['workstation', 'server'],
  'ASUS': ['router', 'workstation'],
  'TP-Link': ['router', 'iot'],
  'Raspberry': ['iot', 'server'],
};

const OS_LIST = ['Windows Server 2019', 'Ubuntu 22.04', 'CentOS 8', 'Windows 11', 'macOS Ventura', 'Debian 11', 'FreeBSD 13'];

const PORTS = [
  { port: 22, service: 'SSH' },
  { port: 80, service: 'HTTP' },
  { port: 443, service: 'HTTPS' },
  { port: 3389, service: 'RDP' },
  { port: 21, service: 'FTP' },
  { port: 3306, service: 'MySQL' },
  { port: 5432, service: 'PostgreSQL' },
  { port: 6379, service: 'Redis' },
];

const guessVendor = (ip) => {
  const vendors = Object.keys(VENDORS);
  const vendor = vendors[Math.floor(Math.random() * vendors.length)];
  const types = VENDORS[vendor];
  return { vendor, deviceType: types[Math.floor(Math.random() * types.length)] };
};

const generatePorts = () => {
  const numPorts = Math.floor(Math.random() * 5) + 1;
  const shuffled = [...PORTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numPorts).map(p => ({ port: p.port, service: p.service }));
};

exports.discoverDevices = async (req, res, next) => {
  try {
    const simulated = IP_RANGES.filter(() => Math.random() > 0.3);
    const results = [];

    for (const ip of simulated) {
      const existing = await Device.findOne({ ip });
      
      if (existing) {
        existing.lastSeen = new Date();
        existing.status = Math.random() > 0.1 ? 'online' : 'suspect';
        await existing.save();
        results.push(existing);
      } else {
        const { vendor, deviceType } = guessVendor(ip);
        const hostname = `device-${ip.split('.').pop()}`;
        
        const device = await Device.create({
          ip,
          mac: `00:1B:${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
          hostname,
          vendor,
          deviceType,
          status: Math.random() > 0.1 ? 'online' : 'suspect',
          openPorts: generatePorts(),
          os: OS_LIST[Math.floor(Math.random() * OS_LIST.length)],
          location: `Subnet ${ip.split('.').slice(0, 2).join('.')}.0/24`,
        });
        results.push(device);
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('device-discovered', { count: results.length });
    }

    res.json({ success: true, message: `Discovered ${results.length} devices`, data: results });
  } catch (error) {
    next(error);
  }
};

exports.getDevices = async (req, res, next) => {
  try {
    const { status, deviceType, search } = req.query;
    const filter = { isActive: true };
    
    if (status) filter.status = status;
    if (deviceType) filter.deviceType = deviceType;
    if (search) {
      filter.$or = [
        { ip: { $regex: search, $options: 'i' } },
        { hostname: { $regex: search, $options: 'i' } },
        { vendor: { $regex: search, $options: 'i' } },
      ];
    }

    const devices = await Device.find(filter).sort({ lastSeen: -1 });

    const stats = {
      total: devices.length,
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      suspect: devices.filter(d => d.status === 'suspect').length,
      byType: {},
    };

    devices.forEach(d => {
      stats.byType[d.deviceType] = (stats.byType[d.deviceType] || 0) + 1;
    });

    res.json({ success: true, data: devices, stats });
  } catch (error) {
    next(error);
  }
};

exports.getDeviceById = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    res.json({ success: true, data: device });
  } catch (error) {
    next(error);
  }
};

exports.updateDevice = async (req, res, next) => {
  try {
    const { status, deviceType, location, notes } = req.body;
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { status, deviceType, location, notes },
      { new: true }
    );
    
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('device-updated', device);
    }

    res.json({ success: true, data: device });
  } catch (error) {
    next(error);
  }
};

exports.deleteDevice = async (req, res, next) => {
  try {
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    res.json({ success: true, message: 'Device removed' });
  } catch (error) {
    next(error);
  }
};

exports.getDeviceStats = async (req, res, next) => {
  try {
    const stats = await Device.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byType = await Device.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } },
    ]);

    const byVendor = await Device.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$vendor', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const recentActivity = await Device.find({ isActive: true })
      .sort({ lastSeen: -1 })
      .limit(10)
      .select('ip hostname status lastSeen');

    res.json({
      success: true,
      data: {
        statusCounts: stats,
        byType,
        byVendor,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};