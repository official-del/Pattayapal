import Work from '../models/Work.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// GET /api/analytics/views
export const getViewTrend = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = 7;
    const result = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = days - 1; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setDate(end.getDate() - i);
      end.setHours(23, 59, 59, 999);

      const count = await Work.countDocuments({
        createdBy: userId,
        createdAt: { $gte: start, $lte: end },
      });

      result.push({
        name: dayNames[start.getDay()],
        date: start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
        views: count,
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/analytics/platforms
export const getPlatformBreakdown = async (req, res) => {
  try {
    const userId = req.user.id;

    const breakdown = await Work.aggregate([
      { $match: { createdBy: req.user._id || userId } },
      { $unwind: { path: '$technologies', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$technologies',
          value: { $sum: 1 },
        },
      },
      { $sort: { value: -1 } },
      { $limit: 6 },
      {
        $project: {
          _id: 0,
          name: { $ifNull: ['$_id', 'Other'] },
          value: 1,
        },
      },
    ]);

    if (breakdown.length === 0) {
      return res.json([
        { name: 'Facebook', value: 40 },
        { name: 'Instagram', value: 35 },
        { name: 'TikTok', value: 25 },
      ]);
    }

    res.json(breakdown);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/analytics/profile
export const getProfileAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('friends');
    const works = await Work.find({ createdBy: userId }).select('likes views');

    const worksCount = works.length;
    const totalLikes = works.reduce((acc, w) => acc + (w.likes?.length || 0), 0);
    const totalViews = works.reduce((acc, w) => acc + (w.views || 0), 0);
    const friendsCount = user?.friends?.length || 0;
    const unreadNotifs = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.json({
      worksCount,
      totalLikes,
      totalViews,
      friendsCount,
      unreadNotifs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

