import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL
});

const productPayload = (data) => {
  if (!data.imageFile) return data;

  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'imageFile' && value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  formData.append('image', data.imageFile);
  return formData;
};

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stocksmart_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('stocksmart_token');
      localStorage.removeItem('stocksmart_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// API Service modules
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me')
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getStockOverview: (range) => api.get(`/dashboard/stock-overview?range=${range}`),
  getCategoryDistribution: () => api.get('/dashboard/category-distribution'),
  getRecentTransactions: () => api.get('/dashboard/recent-transactions'),
  getLowStockAlerts: () => api.get('/dashboard/low-stock')
};

export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', productPayload(data)),
  update: (id, data) => api.put(`/products/${id}`, productPayload(data)),
  delete: (id) => api.delete(`/products/${id}`)
};

export const stockService = {
  stockIn: (data) => api.post('/stock/in', data),
  stockOut: (data) => api.post('/stock/out', data),
  getTransactions: (params) => api.get('/stock/transactions', { params })
};

export const supplierService = {
  getAll: () => api.get('/suppliers'),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`)
};

export const categoryService = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

export const reportService = {
  getInventory: () => api.get('/reports/inventory'),
  getLowStock: () => api.get('/reports/low-stock'),
  getStockMovement: (params) => api.get('/reports/stock-movement', { params }),
  getCategories: () => api.get('/reports/categories'),
  getTransactions: (params) => api.get('/reports/transactions', { params })
};

export const aiService = {
  getRecommendations: () => api.get('/ai/recommendations'),
  sendMessage: (message) => api.post('/ai/chat', { message }),
  getReportData: () => api.get('/ai/report-data')
};

export const settingService = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data)
};

export default api;
