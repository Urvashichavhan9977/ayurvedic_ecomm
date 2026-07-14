// Public read side of the admin-managed site settings.
// Maps to backend/src/routes/siteSettingsRoutes.js
import { apiGet } from './client'

export const siteSettingsApi = {
  getContactInfo: () => apiGet('/settings/contact-info'),
  getHomeContent: () => apiGet('/settings/home-content'),
}