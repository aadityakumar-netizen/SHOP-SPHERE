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

  /**
   * Report payment failure diagnostics safely to backend for server-side logging
   * @param {Object} failureData
   * @param {string} failureData.orderId
   * @param {string} [failureData.razorpayOrderId]
   * @param {string} [failureData.errorCode]
   * @param {string} [failureData.errorDescription]
   * @param {string} [failureData.errorSource]
   * @param {string} [failureData.errorStep]
   * @param {string} [failureData.errorReason]
   * @param {string} [failureData.razorpayPaymentId]
   */
  async logPaymentFailure(failureData) {
    const response = await api.post('/payments/log-failure', failureData);
    return response.data;
  },
};

export default paymentService;
