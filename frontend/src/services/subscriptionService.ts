import api from './api';

export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  durationDays: number;
}

export interface CheckoutResponse {
  message: string;
  subscription: {
    plan: string;
    status: 'free' | 'active' | 'cancelled';
    expiresAt?: string;
  };
}

export const subscriptionService = {
  async getPlans(): Promise<Plan[]> {
    const response = await api.get<Plan[]>('/subscriptions/plans');
    return response.data;
  },

  async getRazorpayKey(): Promise<string> {
    const response = await api.get<{ key: string }>('/subscriptions/key');
    return response.data.key;
  },

  async createOrder(planId: string): Promise<{
    id: string;
  amount: number;
  currency: string;
  }> {
    const response = await api.post('/subscriptions/order', { planId });
    return response.data;
  },

  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
    planId: string
  ): Promise<CheckoutResponse> {
    const response = await api.post<CheckoutResponse>('/subscriptions/verify', {
      orderId,
      paymentId,
      signature,
      planId,
    });
    return response.data;
  },

  async cancelSubscription(): Promise<CheckoutResponse> {
    const response = await api.post<CheckoutResponse>('/subscriptions/cancel', {});
    return response.data;
  },
};
