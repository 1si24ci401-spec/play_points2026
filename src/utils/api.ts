import { projectId, publicAnonKey } from '../../utils/supabase/info';

// Use Supabase cloud functions (they should be deployed)
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-549f93eb`;

interface ApiOptions {
  method?: string;
  body?: any;
  token?: string | null;
}

async function apiCall(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, token } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || publicAnonKey}`,
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

export const api = {
  // Auth
  signup: (email: string, password: string, fullName: string, username: string, role?: string) =>
    apiCall('/signup', { method: 'POST', body: { email, password, fullName, username, role } }),

  getProfile: (token: string) =>
    apiCall('/profile', { token }),

  getUsers: (token: string) =>
    apiCall('/users', { token }),

  // Products
  getProducts: () =>
    apiCall('/products'),

  createProduct: (token: string, product: any) =>
    apiCall('/products', { method: 'POST', body: product, token }),

  updateProduct: (token: string, productId: string, product: any) =>
    apiCall(`/products/${productId}`, { method: 'PUT', body: product, token }),

  deleteProduct: (token: string, productId: string) =>
    apiCall(`/products/${productId}`, { method: 'DELETE', token }),

  // Cart
  getCart: (token: string) =>
    apiCall('/cart', { token }),

  updateCart: (token: string, items: any[]) =>
    apiCall('/cart', { method: 'POST', body: { items }, token }),

  // Coupons
  getCoupons: (token: string) =>
    apiCall('/coupons', { token }),

  validateCoupon: (token: string, code: string) =>
    apiCall('/coupons/validate', { method: 'POST', body: { code }, token }),

  createCoupon: (token: string, coupon: any) =>
    apiCall('/coupons', { method: 'POST', body: coupon, token }),

  updateCoupon: (token: string, code: string, updates: any) =>
    apiCall(`/coupons/${code}`, { method: 'PUT', body: updates, token }),

  deleteCoupon: (token: string, code: string) =>
    apiCall(`/coupons/${code}`, { method: 'DELETE', token }),

  // Orders
  createOrder: (token: string, order: any) =>
    apiCall('/orders', { method: 'POST', body: order, token }),

  getOrders: (token: string) =>
    apiCall('/orders', { token }),

  updateOrder: (token: string, orderId: string, updates: any) =>
    apiCall(`/orders/${orderId}`, { method: 'PUT', body: updates, token }),

  cancelOrder: (token: string, orderId: string) =>
    apiCall(`/orders/${orderId}/cancel`, { method: 'POST', token }),

  resendOrderEmail: (token: string, orderId: string) =>
    apiCall(`/orders/${orderId}/resend-email`, { method: 'POST', token }),

  // Offers
  getOffers: () =>
    apiCall('/offers'),

  updateOffers: (token: string, offers: any[]) =>
    apiCall('/offers', { method: 'POST', body: { offers }, token }),
  sendPush: (token: string, payload: any) =>
    apiCall('/send-push', { method: 'POST', body: payload, token }),
  sendPersonalizedPush: (token: string, payload: any) =>
    apiCall('/send-push-personalized', { method: 'POST', body: payload, token }),
  previewPersonalizedPush: (token: string, userId: string) =>
    apiCall(`/preview-personalized?userId=${encodeURIComponent(userId)}`, { token }),
  getNotificationEvents: (token: string) =>
    apiCall('/notification-events', { token }),

  // User In-App Notifications
  sendUserNotification: (token: string, userId: string, message: string) =>
    apiCall(`/users/${userId}/notify`, { method: 'POST', body: { message }, token }),

  getUserNotifications: (token: string) =>
    apiCall('/notifications', { token }),

  markNotificationRead: (token: string, notificationId: string) =>
    apiCall(`/notifications/${notificationId}/read`, { method: 'POST', token }),

  chat: (token: string, messages: any[], model?: string) =>
    apiCall('/chat', { method: 'POST', body: { messages, model }, token }),

  // Points System
  getPointsSettings: () =>
    apiCall('/points-settings'),

  updatePointsSettings: (token: string, pointPrice: number) =>
    apiCall('/points-settings', { method: 'POST', body: { pointPrice }, token }),

  updateUserPoints: (token: string, userId: string, points: number) =>
    apiCall(`/users/${userId}/points`, { method: 'PUT', body: { points }, token }),

  updateUserTier: (token: string, userId: string, tier: 'normal' | 'premium') =>
    apiCall(`/users/${userId}/tier`, { method: 'PUT', body: { tier }, token }),
};
