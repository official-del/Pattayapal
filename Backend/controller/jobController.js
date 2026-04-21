import Job from '../models/Job.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { updateUserStats } from '../utils/rankHandler.js';

// Create Job
export const createJob = async (req, res) => {
  try {
    const { freelancerId, title, description, budget, location } = req.body;
    const employerId = req.user.id;

    if (employerId === freelancerId) {
      return res.status(400).json({ message: "ไม่สามารถจ้างตนเองได้" });
    }

    // 🔒 ATOMIC TRANSACTION: Check balance and deduct in one step to prevent race conditions
    const updatedEmployer = await User.findOneAndUpdate(
      { _id: employerId, coinBalance: { $gte: budget } },
      { $inc: { coinBalance: -budget } },
      { new: true }
    );

    if (!updatedEmployer) {
      return res.status(400).json({ message: "ยอดเงินคงเหลือไม่พอสำหรับการจ้างงานนี้ กรุณาเติม Coin" });
    }

    const newJob = new Job({
      employer: employerId,
      freelancer: freelancerId,
      title,
      description,
      budget,
      escrowAmount: budget,
      paymentStatus: 'escrow_held',
      location
    });

    await newJob.save();

    // Create Payment Transaction log
    const tx = new Transaction({
      user: employerId,
      type: 'PAY_JOB',
      amount: budget,
      status: 'completed',
      reference: newJob._id
    });
    await tx.save();

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
        io.to(freelancerId.toString()).emit('new_notification', {
          ...note._doc,
          sender: { name: employer.name, profileImage: employer.profileImage }
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

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "ไม่พบงานนี้" });

    // 🛡️ SECURITY CHECK: Authorization
    if (status === 'accepted' && job.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์รับงานนี้ (เฉพาะ Freelancer)" });
    }
    if ((status === 'completed' || status === 'cancelled') && job.employer.toString() !== req.user.id) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์เปลี่ยนสถานะนี้ (เฉพาะผู้จ้างงาน)" });
    }

    // 🔒 Release Escrow to Freelancer if Job is Completed
    if (status === 'completed' && job.paymentStatus === 'escrow_held') {
      const io = req.app.get('io');
      
      // Atomic increment freelancer balance
      const updatedFreelancer = await User.findByIdAndUpdate(
        job.freelancer,
        { $inc: { coinBalance: job.budget, totalEarnings: job.budget } },
        { new: true }
      );

      if (updatedFreelancer) {
        // Create Earning Transaction log
        const earnTx = new Transaction({
          user: job.freelancer,
          type: 'EARN_JOB',
          amount: job.budget,
          status: 'completed',
          reference: job._id
        });
        await earnTx.save();
      }

      job.paymentStatus = 'released';
      job.status = 'completed';

      // Update social stats/ranking
      await updateUserStats(job.freelancer, 'REVENUE', { amount: job.budget }, io);
      await updateUserStats(job.freelancer, 'COMPLETION', {}, io);
    }

    // 💸 Refund if cancelled (only if not already paid out)
    else if (status === 'cancelled' && job.paymentStatus === 'escrow_held') {
      const updatedEmployer = await User.findByIdAndUpdate(
        job.employer,
        { $inc: { coinBalance: job.budget } },
        { new: true }
      );

      if (updatedEmployer) {
        const refundTx = new Transaction({
          user: job.employer,
          type: 'REFUND',
          amount: job.budget,
          status: 'completed',
          reference: job._id
        });
        await refundTx.save();
      }
      job.paymentStatus = 'refunded';
      job.status = 'cancelled';
    } 
    else {
      job.status = status;
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

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "ไม่พบงานนี้" });

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
