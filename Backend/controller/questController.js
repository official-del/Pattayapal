import Quest from '../models/Quest.js';
import User from '../models/User.js';
import Work from '../models/Work.js';
import Transaction from '../models/Transaction.js';

// ── GET All Active Quests ─────────────────────────────────────────────────────
export const getActiveQuests = async (req, res) => {
  try {
    const now = new Date();
    const quests = await Quest.find({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    })
      .populate('createdBy', 'name username profileImage rank')
      .sort('-createdAt');
    res.json(quests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── CREATE Quest ──────────────────────────────────────────────────────────────
export const createQuest = async (req, res) => {
  try {
    const { title, description, taskType, rewardType, coinReward, xpReward, requiredRank, maxParticipants, durationDays, expiresAt } = req.body;
    const userId = req.user.id || req.user._id;

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'แอดมินเท่านั้นที่สามารถสร้างเควสได้' });
    }

    // Enforce Reward Logic
    let finalCoin = Number(coinReward) || 0;
    let finalXp   = Number(xpReward)   || 0;
    if (rewardType === 'COIN') finalXp = 0;
    if (rewardType === 'XP')   finalCoin = 0;

    if (finalCoin <= 0 && finalXp <= 0) {
      return res.status(400).json({ message: 'กรุณาระบุรางวัล (Coin หรือ XP) อย่างน้อย 1 รายการ' });
    }

    const quest = new Quest({
      title: title?.trim(),
      description: description?.trim(),
      taskType: taskType || 'MANUAL',
      rewardType,
      coinReward: finalCoin,
      xpReward:   finalXp,
      requiredRank: requiredRank || 'All',
      maxParticipants: Number(maxParticipants) || 0,
      durationDays: Number(durationDays) || 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: userId,
    });

    await quest.save();
    await quest.populate('createdBy', 'name username profileImage rank');
    res.status(201).json(quest);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── ACCEPT Quest ──────────────────────────────────────────────────────────────
export const acceptQuest = async (req, res) => {
  try {
    const { questId } = req.params;
    const userId = req.user.id || req.user._id;

    const [quest, user] = await Promise.all([
      Quest.findById(questId),
      User.findById(userId),
    ]);

    if (!quest) return res.status(404).json({ message: 'ไม่พบเควสนี้' });
    if (!user)  return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'แอดมินไม่สามารถรับเควสได้' });
    }

    if (!quest.isActive) {
      return res.status(400).json({ message: 'เควสนี้ปิดรับแล้ว' });
    }

    // Check expiry
    if (quest.expiresAt && new Date() > quest.expiresAt) {
      return res.status(400).json({ message: 'เควสนี้หมดอายุแล้ว' });
    }

    // Check Participant Limit
    if (quest.maxParticipants > 0 && quest.participantCount >= quest.maxParticipants) {
      return res.status(400).json({ message: 'เควสนี้มีคนรับครบจำนวนแล้ว' });
    }

    // Check if already claimed
    const alreadyClaimed = user.claimedQuests?.some(q => q.questId === questId.toString());
    if (alreadyClaimed) return res.status(400).json({ message: 'คุณเคยรับรางวัลจากเควสนี้ไปแล้ว' });

    // Check if already accepted
    const alreadyAccepted = user.activeQuests?.some(q => q.questId.toString() === questId.toString());
    if (alreadyAccepted) return res.status(400).json({ message: 'คุณรับเควสนี้ไปแล้ว' });

    // Check Rank Requirement
    const rankHierarchy = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Conqueror'];
    if (quest.requiredRank !== 'All') {
      const userRankIndex = rankHierarchy.indexOf(user.rank || 'Bronze');
      const reqRankIndex  = rankHierarchy.indexOf(quest.requiredRank);
      if (userRankIndex < reqRankIndex) {
        return res.status(403).json({ message: `ต้องมีแรงค์ ${quest.requiredRank} ขึ้นไปเพื่อรับเควสนี้` });
      }
    }

    // Add to activeQuests
    const deadline = quest.durationDays > 0 ? new Date(Date.now() + quest.durationDays * 24 * 60 * 60 * 1000) : null;
    const acceptedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        'activeQuests.questId': { $ne: quest._id },
        'claimedQuests.questId': { $ne: quest._id.toString() }
      },
      {
        $push: {
          activeQuests: {
            questId: quest._id,
            acceptedAt: new Date(),
            deadline
          }
        }
      },
      { new: true }
    );
    if (!acceptedUser) {
      return res.status(409).json({ message: 'Quest has already been accepted or claimed' });
    }

    const questFilter = {
      _id: quest._id,
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
    };
    if (quest.maxParticipants > 0) {
      questFilter.participantCount = { $lt: quest.maxParticipants };
    }

    const acceptedQuest = await Quest.findOneAndUpdate(
      questFilter,
      { $inc: { participantCount: 1 } },
      { new: true }
    );
    if (!acceptedQuest) {
      await User.findByIdAndUpdate(userId, { $pull: { activeQuests: { questId: quest._id } } });
      return res.status(409).json({ message: 'Quest is no longer available' });
    }

    return res.json({ message: 'Quest accepted successfully', deadline });
    
    if (!user.activeQuests) user.activeQuests = [];
    user.activeQuests.push({
      questId: quest._id,
      acceptedAt: new Date(),
      deadline
    });

    await user.save();

    // Increment Participant Count
    quest.participantCount += 1;
    await quest.save();

    res.json({ message: 'รับเควสสำเร็จ!', deadline });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── CLAIM Quest ───────────────────────────────────────────────────────────────
export const claimQuest = async (req, res) => {
  try {
    const { questId } = req.params;
    const userId = req.user.id || req.user._id;

    const [quest, user] = await Promise.all([
      Quest.findById(questId),
      User.findById(userId),
    ]);

    if (!quest) return res.status(404).json({ message: 'ไม่พบเควสนี้' });
    if (!user)  return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });

    // Check if it's a limited quest that must be accepted first
    const activeEntry = user.activeQuests?.find(q => q.questId.toString() === questId.toString());
    
    // If the quest has a participant limit or duration, it MUST be in activeQuests
    if ((quest.maxParticipants > 0 || quest.durationDays > 0) && !activeEntry) {
      return res.status(400).json({ message: 'กรุณากดรับเควสก่อนทำภารกิจ' });
    }

    // Check Deadline
    if (activeEntry?.deadline && new Date() > activeEntry.deadline) {
      return res.status(400).json({ message: 'คุณทำเควสไม่ทันตามเวลาที่กำหนด' });
    }

    // Admin cannot claim
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'แอดมินไม่สามารถรับรางวัลจากเควสได้' });
    }

    // ... (rest of the checks)
    if (!quest.isActive) {
      return res.status(400).json({ message: 'เควสนี้ปิดรับแล้ว' });
    }

    // Check expiry (General quest expiry)
    if (quest.expiresAt && new Date() > quest.expiresAt) {
      return res.status(400).json({ message: 'เควสนี้หมดอายุแล้ว' });
    }

    // Check already claimed (DAILY_LOGIN allows once per day)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (quest.taskType === 'DAILY_LOGIN') {
      const claimedToday = user.claimedQuests?.some(
        q => q.questId === questId.toString() && new Date(q.claimedAt) >= todayStart
      );
      if (claimedToday) return res.status(400).json({ message: 'คุณรับรางวัลของวันนี้ไปแล้ว กลับมาอีกครั้งพรุ่งนี้' });
    } else {
      const alreadyClaimed = user.claimedQuests?.some(q => q.questId === questId.toString());
      if (alreadyClaimed) return res.status(400).json({ message: 'คุณรับรางวัลจากเควสนี้ไปแล้ว' });
    }

    // Check Rank Requirement (again just in case they lost rank)
    const rankHierarchy = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Conqueror'];
    if (quest.requiredRank !== 'All') {
      const userRankIndex = rankHierarchy.indexOf(user.rank || 'Bronze');
      const reqRankIndex  = rankHierarchy.indexOf(quest.requiredRank);
      if (userRankIndex < reqRankIndex) {
        return res.status(403).json({ message: `ต้องมีแรงค์ ${quest.requiredRank} ขึ้นไปเพื่อรับรางวัลนี้` });
      }
    }

    // Automated Verification
    if (quest.taskType === 'PROFILE_FULL') {
      const ok = user.bio && user.profileImage?.url && user.coverImage?.url;
      if (!ok) return res.status(400).json({ message: 'กรุณาตั้งค่า Bio, รูปโปรไฟล์ และรูปหน้าปกให้ครบถ้วนก่อนรับรางวัล' });

    } else if (quest.taskType === 'POST_WORK') {
      const count = await Work.countDocuments({ createdBy: user._id });
      if (count <= 0) return res.status(400).json({ message: 'กรุณาอัปโหลดผลงานอย่างน้อย 1 ชิ้นเพื่อสำเร็จเควสนี้' });
    } else if (quest.taskType === 'PROOF_SUBMISSION') {
      const QuestSubmission = (await import('../models/QuestSubmission.js')).default;
      const sub = await QuestSubmission.findOne({ questId: quest._id, userId: user._id, status: 'APPROVED' });
      if (!sub) return res.status(400).json({ message: 'กรุณาส่งหลักฐานและรอการตรวจสอบก่อนรับรางวัล' });
    }

    // Grant rewards atomically so the same quest cannot be claimed twice in parallel.
    const claimedAt = new Date();
    const claimFilter = { _id: userId };
    if (quest.taskType === 'DAILY_LOGIN') {
      claimFilter.claimedQuests = {
        $not: {
          $elemMatch: {
            questId: quest._id.toString(),
            claimedAt: { $gte: todayStart }
          }
        }
      };
    } else {
      claimFilter['claimedQuests.questId'] = { $ne: quest._id.toString() };
    }

    const rewardInc = {};
    if (quest.coinReward > 0) rewardInc.coinBalance = quest.coinReward;
    if (quest.xpReward > 0) rewardInc.points = quest.xpReward;

    const rewardUpdate = {
      $push: { claimedQuests: { questId: quest._id.toString(), claimedAt } }
    };
    if (Object.keys(rewardInc).length > 0) rewardUpdate.$inc = rewardInc;
    if (activeEntry) rewardUpdate.$pull = { activeQuests: { questId: quest._id } };

    const updatedUser = await User.findOneAndUpdate(claimFilter, rewardUpdate, { new: true });
    if (!updatedUser) {
      return res.status(409).json({ message: 'Quest reward has already been claimed' });
    }

    if (quest.coinReward > 0) {
      await Transaction.create({
        user: userId,
        type: 'TOPUP',
        amount: quest.coinReward,
        status: 'completed',
        reference: `QUEST: ${quest.title}`,
      });
    }

    return res.json({
      message: 'Quest reward claimed successfully',
      coinBalance: updatedUser.coinBalance,
      points: updatedUser.points,
    });

    // Grant Rewards
    if (quest.coinReward > 0) {
      user.coinBalance = (user.coinBalance || 0) + quest.coinReward;
      await new Transaction({
        user: userId,
        type: 'TOPUP',
        amount: quest.coinReward,
        status: 'completed',
        reference: `QUEST: ${quest.title}`,
      }).save();
    }

    if (quest.xpReward > 0) {
      user.points = (user.points || 0) + quest.xpReward;
    }

    if (!user.claimedQuests) user.claimedQuests = [];
    user.claimedQuests.push({ questId: quest._id.toString(), claimedAt: new Date() });

    // Remove from activeQuests if it exists
    if (activeEntry) {
      user.activeQuests = user.activeQuests.filter(q => q.questId.toString() !== questId.toString());
    }

    await user.save();

    res.json({
      message: 'รับรางวัลสำเร็จ!',
      coinBalance: user.coinBalance,
      points: user.points,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── UPDATE Quest ──────────────────────────────────────────────────────────────
export const updateQuest = async (req, res) => {
  try {
    const { questId } = req.params;
    const { title, description, taskType, rewardType, coinReward, xpReward, requiredRank, maxParticipants, durationDays, isActive, expiresAt } = req.body;
    const userId = req.user.id || req.user._id;

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'แอดมินเท่านั้นที่สามารถแก้ไขเควสได้' });
    }

    const quest = await Quest.findById(questId);
    if (!quest) return res.status(404).json({ message: 'ไม่พบเควสนี้' });

    const finalRewardType = rewardType || quest.rewardType;
    let finalCoin = coinReward !== undefined ? Number(coinReward) : quest.coinReward;
    let finalXp   = xpReward   !== undefined ? Number(xpReward)   : quest.xpReward;

    if (finalRewardType === 'COIN') finalXp = 0;
    if (finalRewardType === 'XP')   finalCoin = 0;

    quest.title       = title?.trim()       || quest.title;
    quest.description = description?.trim() || quest.description;
    quest.taskType    = taskType    || quest.taskType;
    quest.rewardType  = finalRewardType;
    quest.coinReward  = finalCoin;
    quest.xpReward    = finalXp;
    quest.requiredRank = requiredRank || quest.requiredRank;
    quest.maxParticipants = maxParticipants !== undefined ? Number(maxParticipants) : quest.maxParticipants;
    quest.durationDays    = durationDays !== undefined ? Number(durationDays) : quest.durationDays;
    quest.isActive    = isActive  !== undefined ? isActive          : quest.isActive;
    quest.expiresAt   = expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : quest.expiresAt;

    await quest.save();
    await quest.populate('createdBy', 'name username profileImage rank');
    res.json(quest);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE Quest ──────────────────────────────────────────────────────────────
export const deleteQuest = async (req, res) => {
  try {
    const { questId } = req.params;
    const userId = req.user.id || req.user._id;

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'แอดมินเท่านั้นที่สามารถลบเควสได้' });
    }

    const quest = await Quest.findById(questId);
    if (!quest) return res.status(404).json({ message: 'ไม่พบเควสนี้' });

    // Clean up related submissions
    const QuestSubmission = (await import('../models/QuestSubmission.js')).default;
    await QuestSubmission.deleteMany({ questId });

    await quest.deleteOne();
    res.json({ message: 'ลบเควสสำเร็จ' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
