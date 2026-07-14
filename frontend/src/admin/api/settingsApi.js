import { apiGet, apiPut } from './client'
export const settingsApi = {
  changePassword: (currentPassword, newPassword) =>
    apiPut('/admin/auth/change-password', { currentPassword, newPassword }),

  getSiteTheme: () => apiGet('/settings/theme'),
  setSiteTheme: (theme) => apiPut('/settings/theme', { theme }),

  getContactInfo: () => apiGet('/settings/contact-info'),
  updateContactInfo: (contactInfo) => apiPut('/settings/contact-info', contactInfo),

  getHomeContent: () => apiGet('/settings/home-content'),
  updateHomeContent: (payload) => apiPut('/settings/home-content', payload),
}