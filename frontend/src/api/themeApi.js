import { apiGet } from './client'

// Maps to backend/src/routes/siteSettingsRoutes.js — the public read side.
// The admin panel is the only writer (see admin/api/settingsApi.js).
export const themeApi = {
  get: () => apiGet('/settings/theme'),
}