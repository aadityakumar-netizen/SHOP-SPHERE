
import api from './api';

const paymentService = {
  async createRazorpayOrder(orderId) {
    const response = await api.post('/payments/create-order', { orderId });
    return response.data;
  },

  async verifyPayment(paymentData) {
    const response = await api.post('/payments/verify', paymentData);
    return response.data;
  },

  async logPaymentFailure(failureData) {
    const response = await api.post('/payments/log-failure', failureData);
    return response.data;
  },

  async completeDemoPayment(orderId, demoPaymentMethod) {
    const response = await api.post('/payments/demo/complete', {
      orderId,
      demoPaymentMethod,
    });
    return response.data;
  },
};

export { paymentService };
export default paymentService;
