import api from './api';

export const paymentService = {
  /**
   * Request Razorpay order initialization from backend
   * @param {string} orderId - MongoDB Order ID
   */
  async createRazorpayOrder(orderId) {
    const response = await api.post('/payments/create-order', { orderId });
    return response.data;
  },

  /**
   * Submit payment signature to backend for HMAC-SHA256 cryptographic verification
   * @param {Object} paymentData
   * @param {string} paymentData.orderId
   * @param {string} paymentData.razorpayOrderId
   * @param {string} paymentData.razorpayPaymentId
   * @param {string} paymentData.razorpaySignature
   */
  async verifyPayment(paymentData) {
    const response = await api.post('/payments/verify', paymentData);
    return response.data;
  },
};

export default paymentService;
