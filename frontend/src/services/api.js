const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Ошибка ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },

  // Auth
  register(data) { return this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }); },
  login(data) { return this.request('/auth/login', { method: 'POST', body: JSON.stringify(data) }); },
  verifyToken() { return this.request('/auth/verify'); },
  verifyUserPassword(password) { return this.request('/auth/verify-password', { method: 'POST', body: JSON.stringify({ password }) }); },

  // Profiles
  getProfiles() { return this.request('/profiles'); },
  createProfile(data) { return this.request('/profiles', { method: 'POST', body: JSON.stringify(data) }); },
  updateProfile(id, data) { return this.request(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  deleteProfile(id, password) { return this.request(`/profiles/${id}`, { method: 'DELETE', body: JSON.stringify({ password }) }); },
  verifyProfilePassword(id, password) { return this.request(`/profiles/${id}/verify-user-password`, { method: 'POST', body: JSON.stringify({ password }) }); },

  // Transactions
  getTransactions(profileId, filters = {}) {
    const params = new URLSearchParams({ profileId, ...filters });
    return this.request(`/transactions?${params}`);
  },
  createTransaction(data) { return this.request('/transactions', { method: 'POST', body: JSON.stringify(data) }); },
  updateTransaction(id, data) { return this.request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  deleteTransaction(id) { return this.request(`/transactions/${id}`, { method: 'DELETE' }); },
  getTransactionStats(profileId, filters = {}) {
    const params = new URLSearchParams({ profileId, ...filters });
    return this.request(`/transactions/stats?${params}`);
  },

  // Active Tasks
  getActiveTasks(profileId) {
    const params = new URLSearchParams({ profileId });
    return this.request(`/active-tasks?${params}`);
  },
  createActiveTask(data) { return this.request('/active-tasks', { method: 'POST', body: JSON.stringify(data) }); },
  deleteActiveTask(id) { return this.request(`/active-tasks/${id}`, { method: 'DELETE' }); },
  updateActiveTaskDescription(id, description) {
    return this.request(`/active-tasks/${id}`, { method: 'PUT', body: JSON.stringify({ description }) });
  },
  getActiveTaskById(id) {
    return this.request(`/active-tasks/${id}`);
  },

  // Iterations
  getIterations(taskId) { return this.request(`/iterations/task/${taskId}`); },
  createIterationManually(taskId) { return this.request('/iterations', { method: 'POST', body: JSON.stringify({ taskId }) }); },
  updateIteration(id, data) { return this.request(`/iterations/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  deleteIteration(id) { return this.request(`/iterations/${id}`, { method: 'DELETE' }); },
};

export default api;