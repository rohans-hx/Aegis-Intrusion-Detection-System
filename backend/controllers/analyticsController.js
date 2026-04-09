const Alert = require('../models/Alert');

// @route GET /api/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [timelineTrend, topSourceIPs, attackTypeBreakdown, statusDistribution, avgThreatScore] =
      await Promise.all([
        // Alerts per day
        Alert.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: {
                year:  { $year:  '$createdAt' },
                month: { $month: '$createdAt' },
                day:   { $dayOfMonth: '$createdAt' },
              },
              total:    { $sum: 1 },
              critical: { $sum: { $cond: [{ $eq: ['$severity', 'Critical'] }, 1, 0] } },
              high:     { $sum: { $cond: [{ $eq: ['$severity', 'High'] },     1, 0] } },
              medium:   { $sum: { $cond: [{ $eq: ['$severity', 'Medium'] },   1, 0] } },
              low:      { $sum: { $cond: [{ $eq: ['$severity', 'Low'] },      1, 0] } },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        ]),

        // Top 10 attacking IPs
        Alert.aggregate([
          { $group: { _id: '$sourceIP', count: { $sum: 1 }, country: { $first: '$sourceCountry' } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),

        // Attack type breakdown with avg threat score
        Alert.aggregate([
          {
            $group: {
              _id: '$attackType',
              count:          { $sum: 1 },
              avgThreatScore: { $avg: '$threatScore' },
            },
          },
          { $sort: { count: -1 } },
        ]),

        // Status distribution
        Alert.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),

        // Overall average threat score
        Alert.aggregate([{ $group: { _id: null, avg: { $avg: '$threatScore' } } }]),
      ]);

    res.json({
      success: true,
      data: {
        timelineTrend,
        topSourceIPs,
        attackTypeBreakdown,
        statusDistribution,
        avgThreatScore: avgThreatScore[0]?.avg || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
