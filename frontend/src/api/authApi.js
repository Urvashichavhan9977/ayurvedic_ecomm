import { apiGet, apiPost } from './client'

// Maps 1:1 to backend/src/routes/authRoutes.js.
// POST /auth/login is the single, role-based login — the response
// includes `role` ('user' | 'admin' | 'superadmin') so the caller can
// decide where to redirect.
export const authApi = {
  register: (name, email, password, phone) =>
    apiPost('/auth/register', { name, email, password, phone }),
  login: (email, password) => apiPost('/auth/login', { email, password }),
  logout: () => apiPost('/auth/logout'),
  me: () => apiGet('/auth/me'),
  forgotPassword: (email) => apiPost('/auth/forgot-password', { email }),
  sendOtp: (email) => apiPost('/auth/send-otp', { email }),
  verifyOtp: (email, otp) => apiPost('/auth/verify-otp', { email, otp }),
}
