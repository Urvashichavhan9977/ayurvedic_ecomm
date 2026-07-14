import { apiGet, apiPost } from './client'

// Maps 1:1 to backend/src/routes/adminAuthRoutes.js
export const adminAuthApi = {
  login: (email, password) => apiPost('/admin/auth/login', { email, password }),
  logout: () => apiPost('/admin/auth/logout'),
  me: () => apiGet('/admin/auth/me'),
  forgotPassword: (email) => apiPost('/admin/auth/forgot-password', { email }),
}
