import api from './api';

export const orderService = {
  /**
   * Validate cart items against live database prices and stock
   * @param {Array<{ productId: string, quantity: number }>} items
   */
  async validateCart(items) {
    const response = await api.post('/orders/validate-cart', { items });
    return response.data;
  },

  /**
   * Create a new pending order
   * @param {Object} orderData - { items: [{ productId, quantity }], shippingAddress }
   */
  async createOrder(orderData) {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  /**
   * Fetch customer's own order history
   */
  async getMyOrders() {
    const response = await api.get('/orders/my');
    return response.data;
  },

  /**
   * Fetch single order details by ID
   * @param {string} orderId
   */
  async getOrderById(orderId) {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  /**
   * Cancel an unpaid order
   * @param {string} orderId
   */
  async cancelOrder(orderId) {
    const response = await api.patch(`/orders/${orderId}/cancel`);
    return response.data;
  },
};

export default orderService;
