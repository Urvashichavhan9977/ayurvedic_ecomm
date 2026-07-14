import { apiGet, apiPost } from './client'

// Maps 1:1 to backend/src/routes/authRoutes.js
export const authApi = {
  register: (name, email, password, phone) =>
    apiPost('/auth/register', { name, email, password, phone }),
  login: (email, password) => apiPost('/auth/login', { email, password }),
  logout: () => apiPost('/auth/logout'),
  me: () => apiGet('/auth/me'),
  forgotPassword: (email) => apiPost('/auth/forgot-password', { email }),
}