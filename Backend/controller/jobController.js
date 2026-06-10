import Job from '../models/Job.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { updateUserStats, getGasConsumption } from '../utils/rankHandler.js';

const JOB_STATUSES = new Set(['accepted', 'completed', 'cancelled']);
const PROGRESS_STAGES = new Set(['AWAITING_START', 'IN_PROGRESS', 'SUBMITTED', 'REVISING', 'COMPLETED']);

const normalizePositiveAmount = (value, max = 10000000) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > max) return null;
  return Math.round(amount * 100) / 100;
};

// Helper to handle monthly gas refill
const checkAndRefillGas = async (user) => {
  const now = new Date();
  const lastRefill = user.lastGasRefill || new Date(0);
  
  // If month or year changed since last refill, reset gas to 100
  if (now.getMonth() !== lastRefill.getMonth() || now.getFullYear() !== lastRefill.getFullYear()) {
    user.gas = 100;
    user.lastGasRefill = now;
    await user.save();
    return true;
  }
  return false;
};

// Create Job
export const createJob = async (req, res) => {
  try {
    const { freelancerId, title, description, budget, location } = req.body;
    const employerId = req.user.id;
    const safeBudget = normalizePositiveAmount(budget);
    const safeTitle = String(title || '').trim();
    const safeDescription = String(description || '').trim();

    if (employerId === freelancerId) {
      return res.status(400).json({ message: "ไม่สามารถจ้างตนเองได้" });
    }

    // ⛽ GAS CHECK: Check and Deduct Gas based on Freelancer's Rank
    if (!freelancerId) {
      return res.status(400).json({ message: 'freelancerId is required' });
    }
    if (!safeTitle || !safeDescription) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    if (!safeBudget) {
      return res.status(400).json({ message: 'Budget must be a positive amount' });
    }

    const employer = await User.findById(employerId);
    if (!employer) return res.status(404).json({ message: "ไม่พบผู้จ้างงาน" });

    // Auto-refill if monthly period passed (Retention mechanic)
    await checkAndRefillGas(employer);

    const freelancer = await User.findById(freelancerId);
    if (!freelancer) return res.status(404).json({ message: "ไม่พบฟรีแลนซ์" });

    // Gas Cost is based on the FREELANCER's rank
    const gasCost = getGasConsumption(freelancer.rank);
    
    if (employer.gas < gasCost) {
      return res.status(400).json({ 
        message: `Gas ของคุณไม่พอสำหรับการจ้างงานนี้ (ต้องการ ${gasCost}% สำหรับฟรีแลนซ์แรงค์ ${freelancer.rank}, มีอยู่ ${employer.gas}%) กรุณาเติม Gas เพื่อดำเนินการต่อ` 
      });
    }

    // 🔒 ATOMIC TRANSACTION: Check balance, deduct coins, and deduct gas
    const updatedEmployer = await User.findOneAndUpdate(
      { _id: employerId, coinBalance: { $gte: safeBudget }, gas: { $gte: gasCost } },
      { $inc: { coinBalance: -safeBudget, gas: -gasCost } },
      { new: true }
    );

    if (!updatedEmployer) {
      return res.status(400).json({ message: "ยอดเงินคงเหลือไม่พอสำหรับการจ้างงานนี้ กรุณาเติม Coin" });
    }

    const newJob = new Job({
      employer: employerId,
      freelancer: freelancerId,
      title: safeTitle,
      description: safeDescription,
      budget: safeBudget,
      escrowAmount: safeBudget,
      paymentStatus: 'escrow_held',
      location
    });

    try {
      await newJob.save();

      // Create Payment Transaction log
      const tx = new Transaction({
        user: employerId,
        type: 'PAY_JOB',
        amount: safeBudget,
        status: 'completed',
        reference: newJob._id
      });
      await tx.save();
    } catch (saveErr) {
      await User.findByIdAndUpdate(
        employerId,
        { $inc: { coinBalance: safeBudget, gas: gasCost } }
      );
      throw saveErr;
    }

    // Notify freelancer
    try {
      const employer = await User.findById(employerId).select('name profileImage');
      const note = new Notification({
        recipient: freelancerId,
        sender: employerId,
        type: 'job',
        referenceId: newJob._id,
        text: `${employer.name} ส่งคำขอจ้างงานใหม่ถึงคุณ: "${title}"`,
        link: '/jobs'
      });
      await note.save();

      const io = req.app.get('io');
      if (io) {
        // Notify freelancer about new notification
        io.to(freelancerId.toString()).emit('new_notification', {
          ...note._doc,
          sender: { name: employer.name, profileImage: employer.profileImage }
        });

        // ⚡ Notify employer about updated balance (Coins & Gas)
        io.to(employerId.toString()).emit('balance_update', {
          coinBalance: updatedEmployer.coinBalance,
          gasBalance: updatedEmployer.gas,
          gas: updatedEmployer.gas,
          title: 'จ้างงานสำเร็จ!',
          message: `ยอดเหรียญและพลังงานถูกหักสำหรับการจ้างงาน: "${title}"`,
          type: 'deduct'
        });
      }
    } catch (err) { console.error("Job Notification Error:", err); }

    res.status(201).json(newJob);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get My Sent Jobs
export const getMySentJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user.id })
      .populate('freelancer', 'name profileImage email profession')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get My Received Jobs
export const getMyReceivedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ freelancer: req.user.id })
      .populate('employer', 'name profileImage email')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Job Status
export const updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body; // 'accepted', 'completed', 'cancelled'

    if (!JOB_STATUSES.has(status)) {
      return res.status(400).json({ message: 'Invalid job status' });
    }

    let job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "ไม่พบงานนี้" });

    // 🛡️ SECURITY CHECK: Authorization
    if (job.status === 'completed' || job.status === 'cancelled') {
      return res.status(400).json({ message: 'This job has already been closed' });
    }

    if (status === 'accepted' && job.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์รับงานนี้ (เฉพาะ Freelancer)" });
    }
    if ((status === 'completed' || status === 'cancelled') && job.employer.toString() !== req.user.id) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์เปลี่ยนสถานะนี้ (เฉพาะผู้จ้างงาน)" });
    }

    // 🔒 Release Escrow to Freelancer if Job is Completed
    if (status === 'completed' && job.paymentStatus === 'escrow_held') {
      const io = req.app.get('io');
      const claimedJob = await Job.findOneAndUpdate(
        { _id: job._id, paymentStatus: 'escrow_held', status: { $nin: ['completed', 'cancelled'] } },
        { $set: { paymentStatus: 'releasing' } },
        { new: true }
      );
      if (!claimedJob) {
        return res.status(409).json({ message: 'This job payment has already been processed' });
      }
      job = claimedJob;
      
      // Atomic increment freelancer balance
      const updatedFreelancer = await User.findByIdAndUpdate(
        job.freelancer,
        { $inc: { coinBalance: job.budget, totalEarnings: job.budget } },
        { new: true }
      );

      if (!updatedFreelancer) {
        await Job.findByIdAndUpdate(job._id, { $set: { paymentStatus: 'escrow_held' } });
        return res.status(404).json({ message: 'Freelancer not found' });
      }
      try {
        await Transaction.create({
          user: job.freelancer,
          type: 'EARN_JOB',
          amount: job.budget,
          status: 'completed',
          reference: job._id
        });
      } catch (txErr) {
        await User.findByIdAndUpdate(
          job.freelancer,
          { $inc: { coinBalance: -job.budget, totalEarnings: -job.budget } }
        );
        await Job.findByIdAndUpdate(job._id, { $set: { paymentStatus: 'escrow_held' } });
        throw txErr;
      }

      job.paymentStatus = 'released';
      job.status = 'completed';

      // Update social stats/ranking
      await updateUserStats(job.freelancer, 'REVENUE', { amount: job.budget }, io);
      await updateUserStats(job.freelancer, 'COMPLETION', {}, io);

      // ⚡ Notify freelancer about updated balance (Earnings)
      if (io && updatedFreelancer) {
        io.to(job.freelancer.toString()).emit('balance_update', {
          coinBalance: updatedFreelancer.coinBalance,
          title: 'ได้รับเงินจากงาน!',
          message: `คุณได้รับ ${job.budget} Coins จากงาน: "${job.title}"`,
          type: 'topup'
        });
      }
    }

    // 💸 Refund if cancelled (only if not already paid out)
    else if (status === 'cancelled' && job.paymentStatus === 'escrow_held') {
      const claimedJob = await Job.findOneAndUpdate(
        { _id: job._id, paymentStatus: 'escrow_held', status: { $nin: ['completed', 'cancelled'] } },
        { $set: { paymentStatus: 'refunding' } },
        { new: true }
      );
      if (!claimedJob) {
        return res.status(409).json({ message: 'This job payment has already been processed' });
      }
      job = claimedJob;

      const updatedEmployer = await User.findByIdAndUpdate(
        job.employer,
        { $inc: { coinBalance: job.budget } },
        { new: true }
      );

      if (!updatedEmployer) {
        await Job.findByIdAndUpdate(job._id, { $set: { paymentStatus: 'escrow_held' } });
        return res.status(404).json({ message: 'Employer not found' });
      }
      try {
        await Transaction.create({
          user: job.employer,
          type: 'REFUND',
          amount: job.budget,
          status: 'completed',
          reference: job._id
        });
      } catch (txErr) {
        await User.findByIdAndUpdate(
          job.employer,
          { $inc: { coinBalance: -job.budget } }
        );
        await Job.findByIdAndUpdate(job._id, { $set: { paymentStatus: 'escrow_held' } });
        throw txErr;
      }
      job.paymentStatus = 'refunded';
      job.status = 'cancelled';

      // ⚡ Notify employer about updated balance (Refund)
      const io = req.app.get('io');
      if (io && updatedEmployer) {
        io.to(job.employer.toString()).emit('balance_update', {
          coinBalance: updatedEmployer.coinBalance,
          title: 'ได้รับเงินคืน!',
          message: `คุณได้รับเงินคืน ${job.budget} Coins จากการยกเลิกงาน: "${job.title}"`,
          type: 'topup'
        });
      }
    } 
    else {
      job.status = status;
      if (status === 'accepted' && job.progressStage === 'AWAITING_START') {
        job.progressStage = 'IN_PROGRESS';
      }
    }

    await job.save();

    // Notify other party
    try {
      const myId = req.user.id;
      const targetId = (job.employer.toString() === myId) ? job.freelancer : job.employer;
      const actor = await User.findById(req.user.id).select('name profileImage');

      const statusTexts = {
        accepted: 'ได้รับงานของคุณแล้ว และเริ่มดำเนินการ',
        completed: 'ยืนยันมอบงานเสร็จสิ้นและโอนเงินให้คุณแล้ว',
        cancelled: 'ได้ยกเลิกงานจ้างชิ้นนี้'
      };

      const note = new Notification({
        recipient: targetId,
        sender: myId,
        type: 'job',
        referenceId: job._id,
        text: `${actor.name} ${statusTexts[status] || 'อัปเดตสถานะงาน'}: "${job.title}"`,
        link: '/jobs'
      });
      await note.save();

      const io = req.app.get('io');
      if (io) {
        io.to(targetId.toString()).emit('new_notification', {
          ...note._doc,
          sender: { name: actor.name, profileImage: actor.profileImage }
        });
      }
    } catch (err) { console.error("Update Job Notification Error:", err); }

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Job Progress
export const updateJobProgress = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { progressStage } = req.body;

    if (!PROGRESS_STAGES.has(progressStage)) {
      return res.status(400).json({ message: 'Invalid progress stage' });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "ไม่พบงานนี้" });

    const requesterId = req.user.id;
    const isFreelancer = job.freelancer.toString() === requesterId;
    const isEmployer = job.employer.toString() === requesterId;

    if (!isFreelancer && !isEmployer) {
      return res.status(403).json({ message: 'You do not have access to this job' });
    }
    if (job.status !== 'accepted') {
      return res.status(400).json({ message: 'Progress can only be updated after the job is accepted' });
    }
    if ((progressStage === 'SUBMITTED' || progressStage === 'IN_PROGRESS') && !isFreelancer) {
      return res.status(403).json({ message: 'Only the freelancer can submit or update active work progress' });
    }
    if ((progressStage === 'REVISING' || progressStage === 'COMPLETED') && !isEmployer) {
      return res.status(403).json({ message: 'Only the employer can request revision or confirm progress completion' });
    }

    job.progressStage = progressStage;
    await job.save();

    // Notify employer
    try {
      if (job.status === 'accepted') {
        const actor = await User.findById(job.freelancer).select('name profileImage');
        
        let notificationText = `${actor.name} อัปเดตความคืบหน้างานเป็น: "${progressStage}"`;
        if (progressStage === 'SUBMITTED') {
          notificationText = `${actor.name} ได้ส่งมอบงานชิ้นสุดท้ายให้คุณแล้ว! โปรดตรวจสอบและยืนยันการรับงานเพื่อโอนเงิน 🚀`;
        } else if (progressStage === 'REVISING') {
          notificationText = `${actor.name} กำลังแก้ไขงานตามที่ได้รับแจ้ง...`;
        }

        const note = new Notification({
          recipient: job.employer,
          sender: job.freelancer,
          type: 'job',
          referenceId: job._id,
          text: notificationText,
          link: '/jobs'
        });
        await note.save();

        const io = req.app.get('io');
        if (io) {
          io.to(job.employer.toString()).emit('new_notification', {
            ...note._doc,
            sender: { name: actor.name, profileImage: actor.profileImage }
          });
        }
      }
    } catch (err) { console.error("Update Progress Notification Error:", err); }

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
