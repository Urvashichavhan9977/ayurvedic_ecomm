import { apiGet, apiPatch } from './client'

// Every call here maps to a route that already exists in
// backend/src/routes/inventoryRoutes.js — no new backend work required.
export const inventoryApi = {
  // GET /api/v1/inventory/overview?threshold=10
  overview: (threshold = 10) => apiGet(`/inventory/overview?threshold=${threshold}`),

  // GET /api/v1/inventory -> { success, count, total, page, pages, threshold, products }
  // params: status ('in-stock' | 'low-stock' | 'out-of-stock'), category, search,
  //         threshold, sort, page, limit
  list: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    return apiGet(`/inventory${query ? `?${query}` : ''}`)
  },

  // PATCH /api/v1/inventory/:id -> { success, product }
  // body: { mode: 'set' | 'increment' | 'decrement', quantity }
  adjustStock: (id, body) => apiPatch(`/inventory/${id}`, body),

  // PATCH /api/v1/inventory/bulk-update -> { success, updatedCount, results, errors }
  // body: { updates: [{ productId, mode, quantity }, ...] }
  bulkUpdate: (updates) => apiPatch('/inventory/bulk-update', { updates }),

  // GET /api/v1/inventory/by-category -> { success, count, breakdown }
  byCategory: () => apiGet('/inventory/by-category'),
}
