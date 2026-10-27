import axios from 'axios';

const BASE_URL = '/api';

// ─── Axios Instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
});

// ─── Request Interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ps_token') || localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: handle token expiry ───────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.code;

    // If 401 and token expired — attempt refresh
    if (status === 401 && code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('ps_refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        _handleForcedLogout();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { token: newToken, refreshToken: newRefresh } = res.data;

        localStorage.setItem('ps_token', newToken);
        localStorage.setItem('ps_refresh_token', newRefresh);

        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        _handleForcedLogout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Force logout if refresh fails
function _handleForcedLogout() {
  localStorage.removeItem('ps_token');
  localStorage.removeItem('ps_refresh_token');
  localStorage.removeItem('PANCHSATWA_User');
  localStorage.removeItem('ps_user');
  localStorage.removeItem('PANCHSATWA_LoggedIn');
  // Dispatch event so Zustand store can react
  window.dispatchEvent(new CustomEvent('auth:forced-logout'));
}

// ─── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  checkEmail: (email) => api.post('/auth/check-email', { email })
};

// ─── Products API ─────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  addReview: (id, data) => api.post(`/products/${id}/reviews`, data)
};

// ─── Orders API ───────────────────────────────────────────────────────────────
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my'),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.put(`/orders/${id}/cancel`)
};

// ─── Payment API (Razorpay — legacy) ──────────────────────────────────────────
export const paymentAPI = {
  createOrder: (data) => api.post('/payment/create-order', data),
  verify: (data) => api.post('/payment/verify', data)
};

// ─── YOUPI PG Payment API ─────────────────────────────────────────────────────
export const youpiAPI = {
  // Creates a pending order in MongoDB and a YOUPI payment session.
  // Returns { orderId, youpiPaymentId, checkoutUrl } — redirect to checkoutUrl.
  createSession: (data) => api.post('/payment/youpi/create-session', data),
  // Polls the backend for the current payment/order status.
  // Returns { orderId, paymentStatus, orderStatus, youpiEvent, ... }
  getStatus: (orderId) => api.get(`/payment/youpi/status/${orderId}`),
  // Confirms direct UPI payment or sandbox test order
  confirmDirect: (data) => api.post('/payment/youpi/confirm-direct', data)
};

// ─── Cart API (server-side sync) ──────────────────────────────────────────────
export const cartAPI = {
  get: () => api.get('/cart'),
  sync: (items) => api.post('/cart/sync', { items }),
  clear: () => api.delete('/cart')
};

// ─── Wishlist API ─────────────────────────────────────────────────────────────
export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  toggle: (productId) => api.post(`/wishlist/${productId}`),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
  clear: () => api.delete('/wishlist')
};

// ─── Coupons API ──────────────────────────────────────────────────────────────
export const couponsAPI = {
  validate: (code, orderAmount) => api.post('/coupons/validate', { code, orderAmount }),
  getAll: () => api.get('/coupons'),
  getActive: () => api.get('/coupons/active'),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`)
};

// ─── Upload API (Cloudinary) ──────────────────────────────────────────────────
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteImage: (publicId) => api.delete('/upload/image', { data: { publicId } })
};

// ─── Categories API ───────────────────────────────────────────────────────────
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  delete: (id) => api.delete(`/categories/${id}`)
};

// ─── Custom Hampers API (Boxes & Chocolates) ──────────────────────────────────
export const hamperAPI = {
  getBoxes: () => api.get('/hampers/boxes'),
  createBox: (data) => api.post('/hampers/boxes', data),
  updateBox: (id, data) => api.put(`/hampers/boxes/${id}`, data),
  deleteBox: (id) => api.delete(`/hampers/boxes/${id}`),
  getChocolates: () => api.get('/hampers/chocolates'),
  createChocolate: (data) => api.post('/hampers/chocolates', data),
  updateChocolate: (id, data) => api.put(`/hampers/chocolates/${id}`, data),
  deleteChocolate: (id) => api.delete(`/hampers/chocolates/${id}`)
};

// ─── Admin API ────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getOrders: (params) => api.get('/admin/orders', { params }),
  updateOrder: (id, data) => api.put(`/admin/orders/${id}`, data),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getProducts: (params) => api.get('/admin/products', { params }),
  updateProductStock: (id, stock) => api.put(`/admin/products/${id}/stock`, { stock }),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data) => api.post('/coupons', data),
  updateCoupon: (id, data) => api.put(`/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/coupons/${id}`),
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
  deleteCategory: (id) => api.delete(`/categories/${id}`)
};

// ─── Health ───────────────────────────────────────────────────────────────────
export const healthAPI = {
  check: () => api.get('/health')
};

export default api;

