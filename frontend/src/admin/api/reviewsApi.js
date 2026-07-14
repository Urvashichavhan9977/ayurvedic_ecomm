import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client'

// Review API used by the admin panel.
// Maps to backend/src/routes/reviewRoutes.js — both the admin-only
// moderation routes and the shared/public routes.

export const reviewsApi = {
  // GET /reviews/admin/all -> { reviews, total, page, pages, count }
  // params: isApproved ('true' | 'false'), rating, product, search, page, limit
  list: async (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    return apiGet(`/reviews/admin/all${query ? `?${query}` : ''}`)
  },

  // PATCH /reviews/:id/approve -> { review }
  setApproved: (id, isApproved) => apiPatch(`/reviews/${id}/approve`, { isApproved }),

  // GET /reviews/product/:productId -> { reviews, total, page, pages, ratingBreakdown }
  // params: sort ('newest' | 'oldest' | 'highest' | 'lowest'), page, limit
  getForProduct: async (productId, params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    return apiGet(`/reviews/product/${productId}${query ? `?${query}` : ''}`)
  },

  // GET /reviews/my -> { reviews }
  getMine: () => apiGet('/reviews/my'),

  // POST /reviews/product/:productId -> { review }
  // body: { rating, title, comment, images: string[] (data-URLs or links), order? }
  create: (productId, body) => apiPost(`/reviews/product/${productId}`, body),

  // PUT /reviews/:id -> { review }
  update: (id, body) => apiPut(`/reviews/${id}`, body),

  // DELETE /reviews/:id (owner or admin)
  remove: (id) => apiDelete(`/reviews/${id}`),
}