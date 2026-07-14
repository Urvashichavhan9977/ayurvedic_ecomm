import { apiGet, apiPost, apiPut, apiDelete } from './client'

// Customer-facing review API.
// Maps to backend/src/routes/reviewRoutes.js (public + logged-in-user routes only).

export const reviewsApi = {
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

  // DELETE /reviews/:id
  remove: (id) => apiDelete(`/reviews/${id}`),
}