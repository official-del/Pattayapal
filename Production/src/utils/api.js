import axios from 'axios';
import { CONFIG } from './config';

const API = axios.create({
  baseURL: CONFIG.API_URL
});

// ── Auth ──
export const authAPI = {
  login: (email, password) =>
    API.post('/auth/login', { email, password }).then(res => res.data),
  getProfile: (token) =>
    API.get('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data)
};

// ── Works ──
export const worksAPI = {
  getAll:   ()           => API.get('/works').then(res => res.data),
  getById:  (id)         => API.get(`/works/${id}`).then(res => res.data),
  getByUser: (userId)    => API.get(`/works/user/${userId}`).then(res => res.data),
  create:   (data, token) => API.post('/works', data, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data),
  update:   (id, data, token) => API.put(`/works/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data),
  delete:   (id, token) => API.delete(`/works/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data),
  replyComment: (id, commentId, data, token) => API.post(`/works/${id}/comment/${commentId}/reply`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data)
};

// ── Categories ──
export const categoriesAPI = {
  getAll:  () => API.get('/categories').then(res => res.data),
  create:  (data, token) => API.post('/categories', data, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data),
  update:  (id, data, token) => API.put(`/categories/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data),
  delete:  (id, token) => API.delete(`/categories/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data)
};

// ── Users / Profile / Friends ──
export const usersAPI = {
  getPublicProfile: (id) =>
    API.get(`/users/${id}/public`).then(res => res.data),

  getFriendStatus: (id, token) =>
    API.get(`/users/${id}/friend-status`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  sendFriendRequest: (id, token) =>
    API.post(`/users/${id}/friend-request`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  respondFriendRequest: (id, action, token) =>
    API.put(`/users/${id}/friend-request`, { action }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  cancelFriendRequest: (id, token) =>
    API.delete(`/users/${id}/friend-request`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  removeFriend: (id, token) =>
    API.delete(`/users/${id}/friend`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  updateProfile: (data, token) =>
    API.patch('/users/me/profile', data, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  getMyFriendRequests: (token) =>
    API.get('/users/me/friend-requests', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  searchUsers: (query, token) =>
    API.get(`/users/search?q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  getDashboardSummary: (token) =>
    API.get('/users/me/dashboard-summary', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  getAdminStats: (token) =>
    API.get('/users/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  getOnlineUsers: (token) =>
    API.get('/users/online', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  updateProfileImage: (formData, token) =>
    API.patch('/users/profile-image', formData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    }).then(res => res.data),

  updateCoverImage: (formData, token) =>
    API.patch('/users/cover-image', formData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    }).then(res => res.data),

  deleteProfileImage: (token) =>
    API.delete('/users/profile-image', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  deleteCoverImage: (token) =>
    API.delete('/users/cover-image', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  getLeaderboard: (category) =>
    API.get(`/users/leaderboard?category=${category}`).then(res => res.data),

  getRankProgress: (token) =>
    API.get('/users/me/rank-progress', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  getAllUsersAdmin: (token) =>
    API.get('/users/admin/all', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data)
};

// ── Chat ──
export const chatAPI = {
  getOrCreateConversation: (receiverId, token) =>
    API.post('/chat/conversation', { receiverId }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  getMyConversations: (token, filter = null) =>
    API.get(`/chat/conversations${filter ? `?filter=${filter}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  getMessages: (conversationId, token) =>
    API.get(`/chat/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  sendMessage: (data, token) =>
    API.post('/chat/message', data, {
      headers: { 
        Authorization: `Bearer ${token}`
      }
    }).then(res => res.data),

  markAsRead: (conversationId, token) =>
    API.patch(`/chat/${conversationId}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  toggleArchive: (conversationId, archived, token) =>
    API.patch(`/chat/${conversationId}/archive`, { archived }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  createGroup: (data, token) =>
    API.post('/chat/groups', data, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data)
};

// ── Jobs / Hiring ──
export const jobsAPI = {
  create: (data, token) =>
    API.post('/jobs', data, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  getMySentJobs: (token) =>
    API.get('/jobs/sent', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  getMyReceivedJobs: (token) =>
    API.get('/jobs/received', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  updateStatus: (jobId, status, token) =>
    API.patch(`/jobs/${jobId}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  updateProgress: (jobId, progressStage, token) =>
    API.patch(`/jobs/${jobId}/progress`, { progressStage }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data)
};

export const notificationsAPI = {
  getMine: (token) => API.get('/notifications', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data),
  markAllRead: (token) => API.patch('/notifications/read-all', {}, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data),
  markAsRead: (id, token) => API.patch(`/notifications/${id}/read`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data),
  delete: (id, token) => API.delete(`/notifications/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data),
};

export const postsAPI = {
  getAll: () => API.get('/posts').then(res => res.data),
  create: (formData, token) => API.post('/posts', formData, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),
  like: (id, token) => API.post(`/posts/${id}/like`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data),
  comment: (id, text, token) => API.post(`/posts/${id}/comment`, { text }, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data),
  delete: (id, token) => API.delete(`/posts/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data),
  deleteComment: (postId, commentId, token) => API.delete(`/posts/${postId}/comment/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data),
  replyComment: (id, commentId, text, token) => API.post(`/posts/${id}/comment/${commentId}/reply`, { text }, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data)
};

// ── Analytics ──
export const analyticsAPI = {
  getViewTrend: (token) =>
    API.get('/analytics/views', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.data),

  getPlatformBreakdown: (token) =>
    API.get('/analytics/platforms', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.data),

  getProfileAnalytics: (token) =>
    API.get('/analytics/profile', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.data),
};

// ── Wallet / Payments ──
export const walletAPI = {
  topup: (formData, token) =>
    API.post('/wallet/topup', formData, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),

  getTransactions: (token) => 
    API.get('/wallet/transactions', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  // 💸 Freelancer: Request withdrawal
  requestWithdraw: (data, token) =>
    API.post('/wallet/withdraw', data, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  // 🛡️ Admin: Get all withdrawal requests
  getAdminWithdrawals: (token) =>
    API.get('/wallet/admin/withdrawals', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),

  // 🛡️ Admin: Approve or reject a withdrawal
  updateWithdrawalStatus: (id, data, token) => {
    const isFormData = data instanceof FormData;
    return API.patch(`/wallet/admin/withdrawals/${id}`, data, {
      headers: { 
        Authorization: `Bearer ${token}`,
        ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {})
      }
    }).then(res => res.data);
  },
  // 🛡️ Admin: Get security audit logs
  getAuditLogs: (token) =>
    API.get('/wallet/admin/audit-logs', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),
};
