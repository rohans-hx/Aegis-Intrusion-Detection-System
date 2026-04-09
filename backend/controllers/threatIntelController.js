const axios = require('axios');
const ThreatIntel = require('../models/ThreatIntel');

const ABUSEIPDB_API_KEY = process.env.ABUSEIPDB_API_KEY;
const ABUSEIPDB_URL = 'https://api.abuseipdb.com/api/v2/check';

const checkExternalApi = async (ip) => {
  if (!ABUSEIPDB_API_KEY) return null;
  
  try {
    const response = await axios.get(ABUSEIPDB_URL, {
      params: { ipAddress: ip, maxAgeInDays: 90 },
      headers: { 'Key': ABUSEIPDB_API_KEY, 'Accept': 'application/json' },
    });
    return response.data.data;
  } catch (error) {
    console.error('AbuseIPDB error:', error.message);
    return null;
  }
};

const determineReputation = (score) => {
  if (score >= 70) return 'malicious';
  if (score >= 30) return 'suspicious';
  return 'clean';
};

const determineThreatTypes = (data) => {
  const types = [];
  if (data.isWhitelisted) return [];
  if (data.totalReports > 0) types.push('reported');
  if (data.isTor) types.push('tor-exit-node');
  if (data.isProxy) types.push('proxy');
  if (data.isVPN) types.push('vpn');
  if (data.abuseConfidenceScore >= 50) types.push('high-confidence');
  return types;
};

exports.lookupIP = async (req, res, next) => {
  try {
    const { ip } = req.params;
    
    if (!ip) {
      return res.status(400).json({ success: false, message: 'IP address is required' });
    }

    let cached = await ThreatIntel.findOne({ ip });
    
    let externalData = null;
    if (!cached || (cached.lastSeen < new Date(Date.now() - 24 * 60 * 60 * 1000))) {
      externalData = await checkExternalApi(ip);
    }

    let result;
    if (cached) {
      if (externalData) {
        cached.score = externalData.abuseConfidenceScore || cached.score;
        cached.reputation = determineReputation(cached.score);
        cached.threatTypes = determineThreatTypes(externalData);
        cached.country = externalData.countryCode;
        cached.isp = externalData.isp;
        cached.lastSeen = new Date();
        await cached.save();
      }
      result = cached;
    } else if (externalData) {
      result = await ThreatIntel.create({
        ip,
        score: externalData.abuseConfidenceScore || 0,
        reputation: determineReputation(externalData.abuseConfidenceScore || 0),
        threatTypes: determineThreatTypes(externalData),
        country: externalData.countryCode,
        isp: externalData.isp,
        description: externalData.domain || externalData.isp,
        addedBy: req.user?.id,
      });
    } else {
      result = await ThreatIntel.create({
        ip,
        score: 0,
        reputation: 'clean',
        addedBy: req.user?.id,
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.addToBlocklist = async (req, res, next) => {
  try {
    const { ip, reason, threatTypes } = req.body;
    
    let existing = await ThreatIntel.findOne({ ip });
    if (existing) {
      existing.reputation = 'malicious';
      existing.score = 100;
      existing.threatTypes = threatTypes || existing.threatTypes;
      existing.description = reason || existing.description;
      existing.lastSeen = new Date();
      await existing.save();
    } else {
      await ThreatIntel.create({
        ip,
        reputation: 'malicious',
        score: 100,
        threatTypes: threatTypes || ['manual-block'],
        description: reason || 'Manually blocked',
        addedBy: req.user?.id,
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('blocklist-updated', { action: 'added', ip });
    }

    res.json({ success: true, message: 'IP added to blocklist' });
  } catch (error) {
    next(error);
  }
};

exports.removeFromBlocklist = async (req, res, next) => {
  try {
    const { ip } = req.params;
    
    const result = await ThreatIntel.findOneAndDelete({ ip });
    if (!result) {
      return res.status(404).json({ success: false, message: 'IP not found in blocklist' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('blocklist-updated', { action: 'removed', ip });
    }

    res.json({ success: true, message: 'IP removed from blocklist' });
  } catch (error) {
    next(error);
  }
};

exports.getBlocklist = async (req, res, next) => {
  try {
    const blocklist = await ThreatIntel.find({ reputation: 'malicious' })
      .sort({ lastSeen: -1 });

    res.json({ success: true, data: blocklist });
  } catch (error) {
    next(error);
  }
};

exports.bulkCheck = async (req, res, next) => {
  try {
    const { ips } = req.body;
    
    if (!Array.isArray(ips) || ips.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of IPs required' });
    }

    const results = await Promise.all(
      ips.slice(0, 50).map(async (ip) => {
        let cached = await ThreatIntel.findOne({ ip });
        if (!cached) {
          cached = await ThreatIntel.create({ ip, score: 0, reputation: 'clean' });
        }
        return cached;
      })
    );

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};