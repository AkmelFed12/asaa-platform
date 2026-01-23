import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (email, password) => apiClient.post('/api/auth/login', { email, password }),
  register: (data) => apiClient.post('/api/auth/register', data),
  logout: () => apiClient.post('/api/auth/logout'),
};

export const userService = {
  getAll: () => apiClient.get('/api/users'),
  getById: (id) => apiClient.get(`/api/users/${id}`),
  create: (data) => apiClient.post('/api/users', data),
  update: (id, data) => apiClient.put(`/api/users/${id}`, data),
  delete: (id) => apiClient.delete(`/api/users/${id}`),
};

export const memberService = {
  getAll: () => apiClient.get('/api/members'),
  getById: (id) => apiClient.get(`/api/members/${id}`),
  add: (data) => apiClient.post('/api/members', data),
  update: (id, data) => apiClient.put(`/api/members/${id}`, data),
  delete: (id) => apiClient.delete(`/api/members/${id}`),
};

export const eventService = {
  getAll: () => apiClient.get('/api/events'),
  getById: (id) => apiClient.get(`/api/events/${id}`),
  create: (data) => apiClient.post('/api/events', data),
  update: (id, data) => apiClient.put(`/api/events/${id}`, data),
  delete: (id) => apiClient.delete(`/api/events/${id}`),
  join: (id, userId) => apiClient.post(`/api/events/${id}/join`, { user_id: userId }),
};

export const delegationService = {
  getAll: () => apiClient.get('/api/delegations'),
  getById: (id) => apiClient.get(`/api/delegations/${id}`),
};

export const roleService = {
  getAll: () => apiClient.get('/api/roles'),
};

export const governanceService = {
  getAll: () => apiClient.get('/api/governance'),
  getById: (id) => apiClient.get(`/api/governance/${id}`),
  update: (id, data) => apiClient.put(`/api/governance/${id}`, data),
  create: (data) => apiClient.post('/api/governance', data),
  delete: (id) => apiClient.delete(`/api/governance/${id}`),
};

export const quizService = {
  getQuestions: () => apiClient.get('/api/quiz/questions'),
  startQuiz: (data) => apiClient.post('/api/quiz/start', data),
  submitQuiz: (data) => apiClient.post('/api/quiz/submit', data),
  getLeaderboard: () => apiClient.get('/api/quiz/leaderboard'),
  getHistory: (userId) => apiClient.get(`/api/quiz/history/${userId}`),
};

export default apiClient;
