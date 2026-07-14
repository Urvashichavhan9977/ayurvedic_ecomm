import { apiGet, apiPatch, apiDelete } from './client'

// Every call here maps to a route in backend/src/routes/contactRoutes.js
export const contactsApi = {
  // GET /api/v1/contact/admin/all -> { success, count, total, page, pages, newCount, contacts }
  // params: search, status ('new' | 'read' | 'resolved'), sort, page, limit
  list: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    return apiGet(`/contact/admin/all${query ? `?${query}` : ''}`)
  },

  // GET /api/v1/contact/admin/:id -> { success, contact }
  get: (id) => apiGet(`/contact/admin/${id}`),

  // PATCH /api/v1/contact/admin/:id/status -> { success, contact }
  updateStatus: (id, status) => apiPatch(`/contact/admin/${id}/status`, { status }),

  // DELETE /api/v1/contact/admin/:id -> { success, message }
  remove: (id) => apiDelete(`/contact/admin/${id}`),
}