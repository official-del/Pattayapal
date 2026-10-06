import cron from 'node-cron';
import User from '../models/User.js';
import Quest from '../models/Quest.js';
import Notification from '../models/Notification.js';

/**
 * Initialize all cron jobs for the application.
 */
export const initCronJobs = (io) => {
  // Monthly Gas Refill
  // Runs at 00:00 (midnight) on the 1st of every month
  cron.schedule('0 0 1 * *', async () => {
    console.log('🔄 [CRON] Running Monthly Gas Refill...');
    try {
      const result = await User.updateMany(
        {},
        {
          $set: { 
            gas: 100, 
            lastGasRefill: new Date() 
          }
        }
      );
      console.log(`✅ [CRON] Monthly Gas Refill completed. Updated ${result.modifiedCount} users.`);
    } catch (error) {
      console.error('❌ [CRON] Error during Monthly Gas Refill:', error.message);
    }
  });

  // Daily Expiring Quests Notification
  // Runs at 08:00 AM every day
  cron.schedule('0 8 * * *', async () => {
    console.log('🔄 [CRON] Checking for expiring quests...');
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find users with active quests expiring in the next 24 hours
      const users = await User.find({
        'activeQuests.deadline': { $gte: now, $lte: in24Hours }
      }).populate('activeQuests.questId');

      const adminUser = await User.findOne({ role: 'admin' }).select('_id').lean();
      if (!adminUser) return;

      let notifiedCount = 0;
      const notificationsToInsert = [];

      for (const user of users) {
        for (const aq of user.activeQuests) {
          if (aq.deadline && aq.deadline >= now && aq.deadline <= in24Hours && aq.questId) {
            notificationsToInsert.push({
              recipient: user._id,
              sender: adminUser._id,
              type: 'quest',
              text: `⏰ เควส "${aq.questId.title}" ใกล้หมดเวลาแล้ว! (เหลือเวลาไม่ถึง 24 ชั่วโมง)`,
              link: '/dashboard/quests'
            });

            if (io) {
              io.to(user._id.toString()).emit('new_notification', { type: 'quest' });
              io.to(user._id.toString()).emit('quest_expiring', {
                questId: aq.questId._id,
                title: aq.questId.title
              });
            }
            notifiedCount++;
          }
        }
      }

      if (notificationsToInsert.length > 0) {
        await Notification.insertMany(notificationsToInsert);
      }

      console.log(`✅ [CRON] Expiring Quests check completed. Notified ${notifiedCount} users.`);
    } catch (error) {
      console.error('❌ [CRON] Error during Expiring Quests check:', error.message);
    }
  });

  console.log('🕒 Cron jobs initialized.');
};
