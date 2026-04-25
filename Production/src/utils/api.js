import axios from 'axios';
import { CONFIG } from './config';

const API = axios.create({
  baseURL: CONFIG.API_URL
});

// 🛡️ Centralized Auth Interceptor
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token') || localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['x-auth-token'] = token; // Fallback for stripping proxies
  }
  return config;
});

// ── Auth ──
export const authAPI = {
  login: (email, password) =>
    API.post('/auth/login', { email, password }).then(res => res.data),
  getProfile: () =>
    API.get('/auth/profile').then(res => res.data)
};

// ── Works ──
export const worksAPI = {
  getAll:   ()           => API.get('/works').then(res => res.data),
  getById:  (id)         => API.get(`/works/${id}`).then(res => res.data),
  getByUser: (userId)    => API.get(`/works/user/${userId}`).then(res => res.data),
  create:   (data) => API.post('/works', data).then(res => res.data),
  update:   (id, data) => API.put(`/works/${id}`, data).then(res => res.data),
  delete:   (id) => API.delete(`/works/${id}`).then(res => res.data),
  replyComment: (id, commentId, data) => API.post(`/works/${id}/comment/${commentId}/reply`, data).then(res => res.data)
};

// ── Categories ──
export const categoriesAPI = {
  getAll:  () => API.get('/categories').then(res => res.data),
  create:  (data) => API.post('/categories', data).then(res => res.data),
  update:  (id, data) => API.put(`/categories/${id}`, data).then(res => res.data),
  delete:  (id) => API.delete(`/categories/${id}`).then(res => res.data)
};

// ── Users / Profile / Friends ──
export const usersAPI = {
  getPublicProfile: (id) =>
    API.get(`/users/${id}/public`).then(res => res.data),

  getFriendStatus: (id) =>
    API.get(`/users/${id}/friend-status`).then(res => res.data),

  sendFriendRequest: (id) =>
    API.post(`/users/${id}/friend-request`, {}).then(res => res.data),

  respondFriendRequest: (id, action) =>
    API.put(`/users/${id}/friend-request`, { action }).then(res => res.data),

  cancelFriendRequest: (id) =>
    API.delete(`/users/${id}/friend-request`).then(res => res.data),

  removeFriend: (id) =>
    API.delete(`/users/${id}/friend`).then(res => res.data),

  updateProfile: (data) =>
    API.patch('/users/me/profile', data).then(res => res.data),
  
  changePassword: (data) =>
    API.patch('/users/me/password', data).then(res => res.data),

  getMyFriendRequests: () =>
    API.get('/users/me/friend-requests').then(res => res.data),

  searchUsers: (query) =>
    API.get(`/users/search?q=${encodeURIComponent(query)}`).then(res => res.data),

  getDashboardSummary: () =>
    API.get('/users/me/dashboard-summary').then(res => res.data),

  getAdminStats: () =>
    API.get('/users/admin/stats').then(res => res.data),

  getOnlineUsers: () =>
    API.get('/users/online').then(res => res.data),

  updateProfileImage: (formData) =>
    API.patch('/users/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),

  updateCoverImage: (formData) =>
    API.patch('/users/cover-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),

  deleteProfileImage: () =>
    API.delete('/users/profile-image').then(res => res.data),

  deleteCoverImage: () =>
    API.delete('/users/cover-image').then(res => res.data),

  getLeaderboard: (category) =>
    API.get(`/users/leaderboard?category=${category}`).then(res => res.data),

  getRankProgress: () =>
    API.get('/users/me/rank-progress').then(res => res.data),

  getAllUsersAdmin: () =>
    API.get('/users/admin/all').then(res => res.data)
};

// ── Chat ──
export const chatAPI = {
  getOrCreateConversation: (receiverId) =>
    API.post('/chat/conversation', { receiverId }).then(res => res.data),

  getMyConversations: (filter = null) =>
    API.get(`/chat/conversations${filter ? `?filter=${filter}` : ''}`).then(res => res.data),
    
  getConversation: (conversationId) =>
    API.get(`/chat/${conversationId}`).then(res => res.data),

  getMessages: (conversationId) =>
    API.get(`/chat/${conversationId}/messages`).then(res => res.data),

  sendMessage: (data) =>
    API.post('/chat/message', data).then(res => res.data),

  markAsRead: (conversationId) =>
    API.patch(`/chat/${conversationId}/read`, {}).then(res => res.data),

  toggleArchive: (conversationId, archived) =>
    API.patch(`/chat/${conversationId}/archive`, { archived }).then(res => res.data),

  createGroup: (data) =>
    API.post('/chat/groups', data).then(res => res.data)
};

// ── Jobs / Hiring ──
export const jobsAPI = {
  create: (data) =>
    API.post('/jobs', data).then(res => res.data),

  getMySentJobs: () =>
    API.get('/jobs/sent').then(res => res.data),

  getMyReceivedJobs: () =>
    API.get('/jobs/received').then(res => res.data),

  updateStatus: (jobId, status) =>
    API.patch(`/jobs/${jobId}/status`, { status }).then(res => res.data),

  updateProgress: (jobId, progressStage) =>
    API.patch(`/jobs/${jobId}/progress`, { progressStage }).then(res => res.data)
};

export const notificationsAPI = {
  getMine: () => API.get('/notifications').then(res => res.data),
  markAllRead: () => API.patch('/notifications/read-all', {}).then(res => res.data),
  markAsRead: (id) => API.patch(`/notifications/${id}/read`, {}).then(res => res.data),
  delete: (id) => API.delete(`/notifications/${id}`).then(res => res.data),
  deleteAll: () => API.delete('/notifications/clear-all').then(res => res.data),
};

export const postsAPI = {
  getAll: () => API.get('/posts').then(res => res.data),
  create: (formData) => API.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),
  like: (id) => API.post(`/posts/${id}/like`, {}).then(res => res.data),
  comment: (id, text) => API.post(`/posts/${id}/comment`, { text }).then(res => res.data),
  delete: (id) => API.delete(`/posts/${id}`).then(res => res.data),
  deleteComment: (postId, commentId) => API.delete(`/posts/${postId}/comment/${commentId}`).then(res => res.data),
  replyComment: (id, commentId, text) => API.post(`/posts/${id}/comment/${commentId}/reply`, { text }).then(res => res.data)
};

// ── Analytics ──
export const analyticsAPI = {
  getViewTrend: () =>
    API.get('/analytics/views').then(res => res.data),

  getPlatformBreakdown: () =>
    API.get('/analytics/platforms').then(res => res.data),

  getProfileAnalytics: () =>
    API.get('/analytics/profile').then(res => res.data),
};

// ── Wallet / Payments ──
export const walletAPI = {
  topup: (formData) =>
    API.post('/wallet/topup', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),

  getTransactions: () => 
    API.get('/wallet/transactions').then(res => res.data),

  // 💸 Freelancer: Request withdrawal
  requestWithdraw: (data) =>
    API.post('/wallet/withdraw', data).then(res => res.data),

  // 🛡️ Admin: Get all withdrawal requests
  getAdminWithdrawals: () =>
    API.get('/wallet/admin/withdrawals').then(res => res.data),

  // 🛡️ Admin: Approve or reject a withdrawal
  updateWithdrawalStatus: (id, data) => {
    const isFormData = data instanceof FormData;
    return API.patch(`/wallet/admin/withdrawals/${id}`, data, {
      headers: { 
        ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {})
      }
    }).then(res => res.data);
  },
  // 🛡️ Admin: Get security audit logs
  getAuditLogs: () =>
    API.get('/wallet/admin/audit-logs').then(res => res.data),
};
