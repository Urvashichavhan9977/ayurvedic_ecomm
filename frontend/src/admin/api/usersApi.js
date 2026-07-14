import { apiGet, apiPatch } from './client'

const toQuery = (params = {}) =>
  new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString()

// Every call here maps to a route in backend/src/routes/userRoutes.js.
export const usersApi = {
  // GET /api/v1/users/admin/all -> { success, count, total, page, pages, users }
  // params: search, isActive, isVerified, sort, page, limit
  list: (params = {}) => {
    const query = toQuery(params)
    return apiGet(`/users/admin/all${query ? `?${query}` : ''}`)
  },

  // GET /api/v1/users/admin/:id -> { success, user, orders, orderCount, totalSpent }
  get: (id) => apiGet(`/users/admin/${id}`),

  // PATCH /api/v1/users/:id/status -> { success, user }
  // body: { isActive } (omit to toggle the current value)
  updateStatus: (id, isActive) => apiPatch(`/users/${id}/status`, { isActive }),

  // GET /api/v1/users/admin/stats -> { success, totalUsers, activeUsers,
  //   inactiveUsers, verifiedUsers, newUsersThisMonth, recentUsers }
  stats: () => apiGet('/users/admin/stats'),
}
