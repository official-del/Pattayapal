import User from '../models/User.js';

/**
 * Define Rank Tiers and their point requirements
 */
export const RANK_TIERS = {
  BRONZE: { name: 'Bronze', min: 0 },
  SILVER: { name: 'Silver', min: 1001 },
  GOLD: { name: 'Gold', min: 5001 },
  PLATINUM: { name: 'Platinum', min: 20001 },
  DIAMOND: { name: 'Diamond', min: 100001 },
  CONQUEROR: { name: 'Conqueror', min: 500001 } // Conqueror usually also Top 50, but we'll start with points
};

/**
 * Point Weighting Configuration
 */
export const POINT_WEIGHTS = {
  REVENUE_RATIO: 0.1, // 10 THB = 1 Point (1000 THB = 100 Points)
  LIKE: 10,
  VIEW: 1,
  COMPLETION: 50,
  FIVE_STAR: 100
};

/**
 * Determine rank based on points
 */
export const getRankFromPoints = (points) => {
  if (points >= RANK_TIERS.CONQUEROR.min) return RANK_TIERS.CONQUEROR.name;
  if (points >= RANK_TIERS.DIAMOND.min) return RANK_TIERS.DIAMOND.name;
  if (points >= RANK_TIERS.PLATINUM.min) return RANK_TIERS.PLATINUM.name;
  if (points >= RANK_TIERS.GOLD.min) return RANK_TIERS.GOLD.name;
  if (points >= RANK_TIERS.SILVER.min) return RANK_TIERS.SILVER.name;
  return RANK_TIERS.BRONZE.name;
};

/**
 * Update user points and rank
 * @param {string} userId
 * @param {string} type - 'REVENUE', 'LIKE', 'VIEW', 'COMPLETION', 'REVIEW'
 * @param {object} metadata - e.g., { amount: 5000 } for revenue
 * @param {object} io - Socket.io instance
 */
export const updateUserStats = async (userId, type, metadata = {}, io = null) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    let pointsToAdd = 0;
    let eventLabel = '';

    switch (type) {
      case 'REVENUE':
        const amount = metadata.amount || 0;
        pointsToAdd = Math.floor(amount * POINT_WEIGHTS.REVENUE_RATIO);
        user.totalEarnings += amount;
        eventLabel = `Received payment: ฿${amount.toLocaleString()}`;
        break;
      case 'LIKE':
        pointsToAdd = POINT_WEIGHTS.LIKE;
        eventLabel = 'Someone liked your work';
        break;
      case 'VIEW':
        pointsToAdd = POINT_WEIGHTS.VIEW;
        user.totalViews = (user.totalViews || 0) + 1; // 👁️ Track raw views
        eventLabel = 'Someone viewed your work';
        break;
      case 'COMPLETION':
        pointsToAdd = POINT_WEIGHTS.COMPLETION;
        eventLabel = 'Job completed successfully';
        break;
      case 'REVIEW':
        if (metadata.rating === 5) {
          pointsToAdd = POINT_WEIGHTS.FIVE_STAR;
          eventLabel = 'Received a 5-star review';
        }
        break;
      default:
        break;
    }

    if (pointsToAdd === 0) return;

    user.points += pointsToAdd;
    
    // Recalculate Rank
    const newRank = getRankFromPoints(user.points);
    const rankChanged = user.rank !== newRank;
    const oldRank = user.rank;
    user.rank = newRank;

    await user.save();

    // 📣 Notify via Socket.io for real-time toast
    if (io) {
      io.to(userId.toString()).emit('points_earned', {
        pointsAdded: pointsToAdd,
        totalPoints: user.points,
        label: eventLabel
      });

      if (rankChanged) {
        io.to(userId.toString()).emit('rank_up', {
          oldRank,
          newRank,
          totalPoints: user.points
        });
      }
    }

    // 🔔 Persistent Notification for Rank Increase
    if (rankChanged) {
      try {
        const Notification = (await import('../models/Notification.js')).default;
        
        // Find a system admin or first admin to be the sender
        const systemAdmin = await User.findOne({ role: 'admin' }).select('_id');
        
        const note = new Notification({
          recipient: userId,
          sender: systemAdmin?._id || userId, // Fallback to self-notification if no admin exists
          type: 'rank',
          text: `ยินดีด้วย! คุณเลื่อนขั้นสู่แรงค์ ${newRank} แล้ว! 🏆`,
          link: '/rankings'
        });
        await note.save();
        
        if (io) {
          io.to(userId.toString()).emit('new_notification', note);
        }
      } catch (err) {
        console.error('Rank change notification error:', err);
      }
    }

    return {
      pointsAdded: pointsToAdd,
      currentPoints: user.points,
      currentRank: user.rank,
      rankChanged
    };
  } catch (err) {
    console.error('Error updating user stats:', err);
    return null;
  }
};
