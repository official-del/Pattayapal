import QuestSubmission from '../models/QuestSubmission.js';
import Quest from '../models/Quest.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

// ── Submit Proof (User) ──
export const submitProof = async (req, res) => {
  try {
    const { questId, proofUrl } = req.body;
    const userId = req.user.id || req.user._id;

    if (!proofUrl) return res.status(400).json({ message: 'กรุณาระบุลิงก์เพื่อเป็นหลักฐาน' });

    const quest = await Quest.findById(questId);
    if (!quest) return res.status(404).json({ message: 'ไม่พบเควสนี้' });

    if (quest.taskType !== 'PROOF_SUBMISSION') {
      return res.status(400).json({ message: 'เควสนี้ไม่ต้องส่งหลักฐาน' });
    }

    // Check if already submitted and pending
    const existing = await QuestSubmission.findOne({ questId, userId, status: 'PENDING' });
    if (existing) {
      return res.status(400).json({ message: 'คุณได้ส่งหลักฐานไปแล้ว และกำลังรอการตรวจสอบ' });
    }

    // Check if already claimed
    const user = await User.findById(userId);
    const alreadyClaimed = user.claimedQuests?.some(q => q.questId === questId.toString());
    if (alreadyClaimed) {
      return res.status(400).json({ message: 'คุณรับรางวัลจากเควสนี้ไปแล้ว' });
    }

    const submission = new QuestSubmission({
      questId,
      userId,
      proofUrl,
    });

    await submission.save();
    res.status(201).json({ message: 'ส่งหลักฐานสำเร็จ! กรุณารอแอดมินตรวจสอบ' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get All Submissions (Admin) ──
export const getAllSubmissions = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    
    const submissions = await QuestSubmission.find(query)
      .populate('userId', 'name username profileImage')
      .populate('questId', 'title coinReward xpReward')
      .sort('-submittedAt');
      
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Review Submission (Admin) ──
export const reviewSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, adminComment } = req.body; // APPROVED or REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
    }

    const submission = await QuestSubmission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: 'ไม่พบข้อมูลการส่งหลักฐาน' });

    if (submission.status !== 'PENDING') {
      return res.status(400).json({ message: 'ข้อมูลนี้ถูกตรวจสอบไปแล้ว' });
    }

    submission.status = status;
    submission.adminComment = adminComment;
    submission.reviewedAt = new Date();
    await submission.save();

    if (status === 'APPROVED') {
      // Grant Rewards
      const quest = await Quest.findById(submission.questId);
      const user = await User.findById(submission.userId);

      if (quest && user) {
        // Double check already claimed
        const alreadyClaimed = user.claimedQuests?.some(q => q.questId === quest._id.toString());
        if (!alreadyClaimed) {
          if (quest.coinReward > 0) {
            user.coinBalance = (user.coinBalance || 0) + quest.coinReward;
            await new Transaction({
              user: user._id,
              type: 'TOPUP',
              amount: quest.coinReward,
              status: 'completed',
              reference: `QUEST_APPROVED: ${quest.title}`,
            }).save();
          }

          if (quest.xpReward > 0) {
            user.points = (user.points || 0) + quest.xpReward;
          }

          if (!user.claimedQuests) user.claimedQuests = [];
          user.claimedQuests.push({ questId: quest._id.toString(), claimedAt: new Date() });
          await user.save();

          quest.currentClaims += 1;
          await quest.save();
        }
      }
    }

    res.json({ message: `ตรวจสอบเรียบร้อย: ${status}` });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
