import { apiGet, apiPost, apiPut } from './client'

export const vendorAuthApi = {
  register: (payload) => apiPost('/vendor/auth/register', payload),
  login: (email, password) => apiPost('/vendor/auth/login', { email, password }),
  logout: () => apiPost('/vendor/auth/logout'),
  me: () => apiGet('/vendor/auth/me'),
  updateProfile: (payload) => apiPut('/vendor/auth/profile', payload),
  changePassword: (currentPassword, newPassword) =>
    apiPut('/vendor/auth/change-password', { currentPassword, newPassword }),
}
