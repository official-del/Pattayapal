import User from '../models/User.js';
import Work from '../models/Work.js';
import Notification from '../models/Notification.js';
import Job from '../models/Job.js';

// GET Public Profile
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email -friendRequests')
      .populate('friends', 'name username profileImage _id');

    if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้งานนี้' });

    const worksWithComments = await Work.find({
      'comments.userId': user._id
    })
      .select('title _id mainImage type videoUrl comments')
      .limit(20);

    const recentComments = [];
    worksWithComments.forEach(work => {
      work.comments
        .filter(c => c.userId?.toString() === user._id.toString())
        .forEach(c => {
          recentComments.push({
            _id: c._id,
            text: c.text,
            createdAt: c.createdAt,
            work: {
              _id: work._id,
              title: work.title,
              mainImage: work.mainImage
            }
          });
        });
    });

    recentComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      user,
      recentComments: recentComments.slice(0, 10),
      friendsCount: user.friends?.length || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET Friend Request Status
const getFriendStatus = async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    const targetId = req.params.id;

    const isFriend = me.friends.some(f => f.toString() === targetId);
    if (isFriend) return res.json({ status: 'friends' });

    const target = await User.findById(targetId);
    const requestFromMe = target?.friendRequests?.find(
      r => r.from.toString() === req.user.id && r.status === 'pending'
    );
    if (requestFromMe) return res.json({ status: 'pending_sent' });

    const requestToMe = me.friendRequests?.find(
      r => r.from.toString() === targetId && r.status === 'pending'
    );
    if (requestToMe) return res.json({ status: 'pending_received', requestId: requestToMe._id });

    return res.json({ status: 'none' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST Send Friend Request
const sendFriendRequest = async (req, res) => {
  try {
    const { id: targetId } = req.params;
    const myId = req.user.id;

    if (targetId === myId) {
      return res.status(400).json({ message: 'ไม่สามารถเพิ่มตัวเองเป็นเพื่อนได้' });
    }

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });

    const me = await User.findById(myId);

    if (me.friends.includes(targetId)) {
      return res.status(400).json({ message: 'เป็นเพื่อนกันแล้ว' });
    }

    const alreadySent = target.friendRequests?.some(
      r => r.from.toString() === myId && r.status === 'pending'
    );
    if (alreadySent) {
      return res.status(400).json({ message: 'ส่งคำขอเพื่อนไปแล้ว' });
    }

    target.friendRequests.push({ from: myId, status: 'pending' });
    await target.save();

    // Notify recipient
    try {
      const note = new Notification({
        recipient: targetId,
        sender: myId,
        type: 'friend_request',
        referenceId: me._id,
        text: `${me.name} ส่งคำขอเป็นเพื่อนถึงคุณ`,
        link: `/profile/${myId}`
      });
      await note.save();

      const io = req.app.get('io');
      if (io) {
        io.to(targetId.toString()).emit('new_notification', {
          ...note._doc,
          sender: { name: me.name, profileImage: me.profileImage }
        });
      }
    } catch (err) { console.error("Friend Request Notification Error:", err); }

    res.status(200).json({ message: 'ส่งคำขอเพื่อนสำเร็จ', status: 'pending_sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Respond to Friend Request
const respondFriendRequest = async (req, res) => {
  try {
    const { action } = req.body;
    const requesterId = req.params.id;
    const myId = req.user.id;

    const me = await User.findById(myId);
    const request = me.friendRequests.find(
      r => r.from.toString() === requesterId && r.status === 'pending'
    );

    if (!request) return res.status(404).json({ message: 'ไม่พบคำขอเพื่อน' });

    if (action === 'accept') {
      request.status = 'accepted';
      me.friends.push(requesterId);
      await me.save();

      const requester = await User.findById(requesterId);
      requester.friends.push(myId);
      await requester.save();

      res.json({ message: 'ยืนยันเพื่อนสำเร็จ', status: 'friends' });
    } else if (action === 'reject') {
      request.status = 'rejected';
      await me.save();
      res.json({ message: 'ปฏิเสธคำขอเพื่อนแล้ว', status: 'none' });
    } else {
      res.status(400).json({ message: 'action ไม่ถูกต้อง' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove Friend
const removeFriend = async (req, res) => {
  try {
    const { id: friendId } = req.params;
    const myId = req.user.id;

    await User.findByIdAndUpdate(myId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: myId } });

    res.json({ message: 'ยกเลิกเพื่อนสำเร็จ', status: 'none' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cancel Sent Request
const cancelFriendRequest = async (req, res) => {
  try {
    const { id: targetId } = req.params;
    const myId = req.user.id;

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });

    target.friendRequests = target.friendRequests.filter(
      r => !(r.from.toString() === myId && r.status === 'pending')
    );
    await target.save();

    res.json({ message: 'ยกเลิกคำขอเพื่อนสำเร็จ', status: 'none' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Profile
const updateProfile = async (req, res) => {
  try {
    const { 
      bio, name, profession, isAvailableForHire, serviceTags, servicePackages,
      phone, address, birthday, gender, username, experience, skills 
    } = req.body;
    
    const updateData = { bio };
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (profession) updateData.profession = profession;
    if (typeof isAvailableForHire !== 'undefined') updateData.isAvailableForHire = isAvailableForHire;
    if (serviceTags) updateData.serviceTags = serviceTags;
    if (servicePackages) updateData.servicePackages = servicePackages;
    if (experience) updateData.experience = experience;
    if (skills) updateData.skills = skills;
    
    // [NEW] Fields
    if (typeof phone !== 'undefined') updateData.phone = phone;
    if (typeof address !== 'undefined') updateData.address = address;
    if (typeof birthday !== 'undefined') updateData.birthday = birthday;
    if (typeof gender !== 'undefined') updateData.gender = gender;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');
    res.json({ message: 'อัปเดตโปรไฟล์สำเร็จ', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Pending Requests
const getMyFriendRequests = async (req, res) => {
  try {
    const me = await User.findById(req.user.id)
      .populate({
        path: 'friendRequests.from',
        select: 'name profileImage _id'
      });
    
    const pendingRequests = me.friendRequests.filter(r => r.status === 'pending');
    res.json(pendingRequests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Search Users
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    // 🛡️ Discovery Base: Exclude Admin/Client
    let queryObj = { 
      _id: { $ne: req.user.id },
      role: { $nin: ['admin', 'client'] }
    };
    
    // 🔎 If searching, add criteria to existing queryObj
    if (q && q.trim().length >= 1) {
      const regex = new RegExp(q, 'i');
      queryObj.$or = [
        { name: regex },
        { profession: regex },
        { "skills.name": regex },
        { serviceTags: regex }
      ];
    }

    const users = await User.find(queryObj)
      .select('name profileImage _id role profession isAvailableForHire skills rank')
      .limit(20);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Dashboard Summary
const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const works = await Work.find({ createdBy: userId }).select('views');
    const worksCount = works.length;
    const totalViews = works.reduce((acc, work) => acc + (work.views || 0), 0);

    const incomingJobsCount = await Job.countDocuments({ freelancer: userId });
    const notificationsCount = await Notification.countDocuments({ recipient: userId, isRead: false });

    // Client specific stats
    const jobsPostedCount = await Job.countDocuments({ employer: userId });
    const activeHiresCount = await Job.countDocuments({ employer: userId, status: 'accepted' });
    const completedHires = await Job.find({ employer: userId, status: 'completed' });
    const totalBudgetSpent = completedHires.reduce((acc, job) => acc + (job.budget || 0), 0);

    res.json({
      role: user.role,
      profession: user.profession,
      totalWorks: worksCount,
      totalViews,
      totalEarnings: user.totalEarnings || 0,
      points: user.points || 0,
      friendsCount: user.friends?.length || 0,
      incomingJobsCount,
      notificationsCount,
      jobsPostedCount,
      activeHiresCount,
      totalBudgetSpent,
      coinBalance: user.coinBalance || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin Stats
const getAdminStats = async (req, res) => {
  try {
    const topByWorks = await Work.aggregate([
      { $group: { _id: "$createdBy", worksCount: { $sum: 1 } } },
      { $sort: { worksCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          name: "$user.name",
          profileImage: "$user.profileImage",
          rank: "$user.rank",
          points: "$user.points",
          worksCount: 1
        }
      }
    ]);

    const topByFriends = await User.find({ profession: { $ne: 'General' } })
      .select('name profileImage friends')
      .sort({ "friends.length": -1 })
      .limit(5)
      .lean();
    
    const formattedTopByFriends = topByFriends.map(fs => ({
      _id: fs._id,
      name: fs.name,
      profileImage: fs.profileImage,
      friendsCount: fs.friends?.length || 0
    })).sort((a,b) => b.friendsCount - a.friendsCount);

    const growthStats = await User.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 }
    ]);

    const formattedGrowth = growthStats.map(s => ({
      name: `${s._id.month}/${s._id.year}`,
      users: s.count
    }));

    res.json({
      topByWorks,
      topByFriends: formattedTopByFriends,
      growthStats: formattedGrowth
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const { category } = req.query; // 'points' | 'earnings'
    let sortQuery = { points: -1, totalEarnings: -1, name: 1 };
    
    if (category === 'earnings') sortQuery = { totalEarnings: -1, points: -1, name: 1 };
    if (category === 'views') sortQuery = { totalViews: -1, points: -1, name: 1 };
    
    // ✅ Filter for everyone who has a professional role (Master Division)
    const users = await User.find({ 
      profession: { $in: ['Photographer', 'Editor', 'Videographer', 'Director'] } 
    })
      .select('name profileImage rank points totalEarnings profession totalViews')
      .sort(sortQuery)
      .limit(50);
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get My Rank Progress
const getRankProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('points rank totalEarnings');
    if (!user) return res.status(404).json({ message: "User not found" });

    // Calculate next tier info
    const { RANK_TIERS } = await import('../utils/rankHandler.js');
    const tiers = Object.values(RANK_TIERS);
    
    // Robust search for rank
    let currentIndex = tiers.findIndex(t => t.name.toLowerCase() === (user.rank || 'Bronze').toLowerCase());
    if (currentIndex === -1) currentIndex = 0; // Fallback to Bronze
    
    const nextTier = tiers[currentIndex + 1] || null;

    res.json({
      currentPoints: user.points || 0,
      currentRank: user.rank || 'Bronze',
      totalEarnings: user.totalEarnings || 0,
      nextRank: nextTier ? nextTier.name : 'Master Rank',
      pointsToNext: nextTier ? Math.max(0, nextTier.min - user.points) : 0,
       progress: nextTier 
        ? Math.min(100, (user.points / nextTier.min) * 100) 
        : 100
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Online Users
const getOnlineUsers = async (req, res) => {
  try {
    const onlineUsers = await User.find({ isOnline: true })
      .select('_id')
      .lean();
    res.json(onlineUsers.map(u => String(u._id)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Get All Users with Stats
const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find({})
      .select('name email profileImage role profession rank points totalEarnings coinBalance createdAt isOnline')
      .lean();

    // Aggregate views per user from Works
    const viewsAgg = await Work.aggregate([
      { $group: { _id: '$createdBy', totalViews: { $sum: '$views' }, worksCount: { $sum: 1 } } }
    ]);
    const viewsMap = {};
    viewsAgg.forEach(a => { viewsMap[String(a._id)] = { totalViews: a.totalViews, worksCount: a.worksCount }; });

    const result = users.map(u => ({
      ...u,
      totalViews: viewsMap[String(u._id)]?.totalViews || 0,
      worksCount: viewsMap[String(u._id)]?.worksCount || 0,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export {
  getPublicProfile,
  getFriendStatus,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  cancelFriendRequest,
  updateProfile,
  getMyFriendRequests,
  searchUsers,
  getDashboardSummary,
  getAdminStats,
  getAllUsersAdmin,
  getOnlineUsers,
  getLeaderboard,
  getRankProgress
};
