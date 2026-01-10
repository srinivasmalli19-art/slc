import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('slc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('slc_token');
      localStorage.removeItem('slc_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  guestSession: () => api.post('/auth/guest-session'),
};

// Animals API
export const animalsAPI = {
  create: (data) => api.post('/animals', data),
  getAll: (species) => api.get('/animals', { params: { species } }),
  getById: (id) => api.get(`/animals/${id}`),
  update: (id, data) => api.put(`/animals/${id}`, data),
  delete: (id) => api.delete(`/animals/${id}`),
};

// Vaccinations API
export const vaccinationsAPI = {
  create: (data) => api.post('/vaccinations', data),
  getAll: (animalId) => api.get('/vaccinations', { params: { animal_id: animalId } }),
};

// Deworming API
export const dewormingAPI = {
  create: (data) => api.post('/deworming', data),
  getAll: (animalId) => api.get('/deworming', { params: { animal_id: animalId } }),
};

// Breeding API
export const breedingAPI = {
  create: (data) => api.post('/breeding', data),
  getAll: (animalId) => api.get('/breeding', { params: { animal_id: animalId } }),
};

// Diagnostics API
export const diagnosticsAPI = {
  create: (data) => api.post('/diagnostics', data),
  getAll: (animalId, testCategory) => api.get('/diagnostics', { 
    params: { animal_id: animalId, test_category: testCategory } 
  }),
  getPDF: (id) => api.get(`/reports/diagnostic/${id}/pdf`, { responseType: 'blob' }),
};

// Knowledge Center API
export const knowledgeCenterAPI = {
  getAll: (testCategory, species) => api.get('/knowledge-center', { 
    params: { test_category: testCategory, species } 
  }),
  create: (data) => api.post('/knowledge-center', data),
  update: (id, data) => api.put(`/knowledge-center/${id}`, data),
  delete: (id) => api.delete(`/knowledge-center/${id}`),
};

// Utilities API (Guest access)
export const utilitiesAPI = {
  calculateArea: (data) => api.post('/utilities/area-calculator', data),
  calculateInterest: (data) => api.post('/utilities/interest-calculator', data),
};

// Dashboard API
export const dashboardAPI = {
  getFarmerStats: () => api.get('/dashboard/farmer-stats'),
  getVetStats: () => api.get('/dashboard/vet-stats'),
};

// Admin API
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  updateUserStatus: (userId, isActive) => api.put(`/admin/users/${userId}/status`, null, { params: { is_active: isActive } }),
  getStats: () => api.get('/admin/stats'),
};

export default api;
