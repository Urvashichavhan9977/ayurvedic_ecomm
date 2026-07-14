// Customer-facing contacts API used by the storefront Contact page
import { apiPost } from './client'

export const contactsApi = {
  // POST /api/v1/contact/  (backend: contactRoutes.js -> router.post('/'))
  send: (form) => apiPost('/contact', form),
}
