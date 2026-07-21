import cron from 'node-cron';
import User from '../models/User.js';

/**
 * Initialize all cron jobs for the application.
 */
export const initCronJobs = () => {
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

  console.log('🕒 Cron jobs initialized.');
};
