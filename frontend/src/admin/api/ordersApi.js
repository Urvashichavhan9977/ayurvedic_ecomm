import { apiGet, apiPatch } from './client'

const toQuery = (params = {}) =>
  new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString()

// Every call here maps to a route in backend/src/routes/orderRoutes.js.
export const ordersApi = {
  // GET /api/v1/orders/admin/all -> { success, count, total, page, pages, orders }
  // params: search, status, paymentMethod, isPaid, dateFrom, dateTo, sort, page, limit
  list: (params = {}) => {
    const query = toQuery(params)
    return apiGet(`/orders/admin/all${query ? `?${query}` : ''}`)
  },

  // GET /api/v1/orders/admin/:id -> { success, order }
  get: (id) => apiGet(`/orders/admin/${id}`),

  // PATCH /api/v1/orders/:id/status -> { success, order }
  // body: { status, note, trackingId, courierName, shippingPartner, estimatedDeliveryDate }
  updateStatus: (id, body) => apiPatch(`/orders/${id}/status`, body),

  // GET /api/v1/orders/admin/stats -> { success, totalOrders, totalRevenue,
  //   totalItemsSold, pendingOrders, ordersByStatus, revenueLast7Days, recentOrders }
  stats: () => apiGet('/orders/admin/stats'),

  // GET /api/v1/orders/admin/owned -> { success, count, total, page, pages, orders }
  // Used by the dedicated "📦 Admin Orders" page — returns only orders/items
  // owned by the platform itself (not marketplace vendors).
  // params: status, page, limit
  listOwned: (params = {}) => {
    const query = toQuery(params)
    return apiGet(`/orders/admin/owned${query ? `?${query}` : ''}`)
  },
}