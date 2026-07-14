import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from './client'

// Every call here maps to a route that already exists in
// backend/src/routes/couponRoutes.js — no new backend work required.
export const couponsApi = {
  // GET /api/v1/coupons/admin/all -> { success, count, total, page, pages, coupons }
  // params: isActive, search, page, limit
  list: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    return apiGet(`/coupons/admin/all${query ? `?${query}` : ''}`)
  },

  // GET /api/v1/coupons/admin/:id -> { success, coupon }
  get: (id) => apiGet(`/coupons/admin/${id}`),

  // POST /api/v1/coupons -> { success, coupon }
  create: (payload) => apiPost('/coupons', payload),

  // PUT /api/v1/coupons/:id -> { success, coupon }
  update: (id, payload) => apiPut(`/coupons/${id}`, payload),

  // DELETE /api/v1/coupons/:id -> { success, message }
  remove: (id) => apiDelete(`/coupons/${id}`),

  // PATCH /api/v1/coupons/:id/toggle -> { success, coupon }
  toggleStatus: (id) => apiPatch(`/coupons/${id}/toggle`),
}
