import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for Admin Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle session expiration / 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Packages / Plans API ───────────────────────────────────────────────────
export const packagesApi = {
  getAll: () => api.get('/subscriptions/admin/all-plans'),
  getPublicPlans: () => api.get('/subscriptions/plans'),
  create: (data) => api.post('/subscriptions/admin/plans', data),
  update: (id, data) => api.patch(`/subscriptions/admin/plans/${id}`, data),
  delete: (id) => api.delete(`/subscriptions/admin/plans/${id}`),
};

// ─── Promo Codes API ────────────────────────────────────────────────────────
export const promoCodesApi = {
  getAll: () => api.get('/subscriptions/admin/promo-codes'),
  create: (data) => api.post('/subscriptions/admin/promo-codes', data),
  update: (id, data) => api.patch(`/subscriptions/admin/promo-codes/${id}`, data),
  delete: (id) => api.delete(`/subscriptions/admin/promo-codes/${id}`),
};

// ─── Commission & Wallet API ────────────────────────────────────────────────
export const commissionsApi = {
  getSettings: () => api.get('/subscriptions/admin/commissions/settings'),
  updateSettings: (data) => api.patch('/subscriptions/admin/commissions/settings', data),
  getTransactions: (params) => api.get('/subscriptions/admin/commissions/transactions', { params }),
  getSubscriptions: () => api.get('/subscriptions'),
};

// ─── Ads API ─────────────────────────────────────────────────────────────────
export const adsApi = {
  getAll: (params) => api.get('/ads/admin/all', { params }),
  getById: (id) => api.get(`/ads/${id}`),
  create: (data) => api.post('/ads', data),
  update: (id, data) => api.patch(`/ads/${id}`, data),
  delete: (id) => api.delete(`/ads/${id}`),
  toggleStatus: (id) => api.patch(`/ads/${id}/toggle`),
  uploadMedia: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/ads/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// ─── Support Tickets API ──────────────────────────────────────────────────────
export const supportApi = {
  getAllTickets: (params) => api.get('/support/tickets', { params }),
  getTicketDetails: (id) => api.get(`/support/tickets/${id}`),
  replyToTicket: (id, reply) => api.patch(`/support/tickets/${id}/reply`, { reply }),
  updateTicketStatus: (id, status) => api.patch(`/support/tickets/${id}/status`, { status }),
};

// ─── Chat Support API (Real-time Conversations) ──────────────────────────────
export const chatSupportApi = {
  getConversations: () => api.get('/chat/admin/support/conversations'),
  getMessages: (type, targetId, params) => api.get(`/chat/admin/support/${type}/${targetId}/messages`, { params }),
  sendMessage: (type, targetId, data) => api.post(`/chat/admin/support/${type}/${targetId}/messages`, data),
  markAsRead: (type, targetId) => api.patch(`/chat/admin/support/${type}/${targetId}/read`),
  uploadAttachment: (file) => {
    const formData = new FormData();
    formData.append('attachment', file);
    return api.post('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
