import api from './api';

export const adminService = {
  /**
   * Fetch admin summary dashboard statistics
   */
  async getStats() {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  /**
   * Fetch all orders with customer details
   * @param {Object} params - { orderStatus, paymentStatus, page, limit }
   */
  async getAllOrders(params = {}) {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  /**
   * Update order fulfillment status with state machine validation
   * @param {string} orderId
   * @param {string} status - 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
   */
  async updateOrderStatus(orderId, status) {
    const response = await api.patch(`/admin/orders/${orderId}/status`, { status });
    return response.data;
  },

  /**
   * Create a new product (Admin)
   * @param {Object} productData
   */
  async createProduct(productData) {
    const response = await api.post('/products', productData);
    return response.data;
  },

  /**
   * Update an existing product (Admin)
   * @param {string} productId
   * @param {Object} updateData
   */
  async updateProduct(productId, updateData) {
    const response = await api.patch(`/products/${productId}`, updateData);
    return response.data;
  },

  /**
   * Delete a product (Admin)
   * @param {string} productId
   */
  async deleteProduct(productId) {
    const response = await api.delete(`/products/${productId}`);
    return response.data;
  },
};

export default adminService;
