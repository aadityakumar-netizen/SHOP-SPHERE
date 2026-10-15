import api from './api';

export const authService = {
  /**
   * Register a new customer
   * @param {Object} credentials - { name, email, password }
   */
  async register(credentials) {
    const response = await api.post('/auth/register', credentials);
    return response.data;
  },

  /**
   * Login user with email and password
   * @param {Object} credentials - { email, password }
   */
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Get current authenticated user profile
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default authService;
