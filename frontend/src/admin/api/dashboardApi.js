import { apiGet } from './client'

/**
 * The dashboard has no single "stats" endpoint on the backend yet, so it
 * composes its numbers from the existing resource APIs. Every call here
 * maps to a route that already exists in backend/src/routes.
 */
export const dashboardApi = {
  // GET /api/v1/inventory/overview -> { totalProducts, totalUnits, totalStockValue, outOfStockCount, lowStockCount }
  inventoryOverview: () => apiGet('/inventory/overview'),

  // GET /api/v1/inventory/by-category -> [{ categoryId, categoryName, productCount, totalUnits, totalStockValue }]
  stockByCategory: () => apiGet('/inventory/by-category'),

  // GET /api/v1/products/admin/low-stock?threshold=10
  lowStockProducts: (threshold = 10) => apiGet(`/products/admin/low-stock?threshold=${threshold}`),

  // GET /api/v1/categories/admin/all -> { count, categories }
  categoriesCount: () => apiGet('/categories/admin/all'),

  // GET /api/v1/reviews/admin/all?isApproved=false&limit=1 -> { total }
  pendingReviewsCount: () => apiGet('/reviews/admin/all?isApproved=false&limit=1'),

  // GET /api/v1/reviews/admin/all?limit=5&sort handled server-side by -createdAt default
  recentReviews: () => apiGet('/reviews/admin/all?limit=5'),

  // GET /api/v1/coupons/admin/all?isActive=true&limit=1 -> { total }
  activeCouponsCount: () => apiGet('/coupons/admin/all?isActive=true&limit=1'),

  // GET /api/v1/coupons/admin/all?limit=1 -> { total }
  totalCouponsCount: () => apiGet('/coupons/admin/all?limit=1'),

  // GET /api/v1/orders/admin/stats -> { totalOrders, totalRevenue, pendingOrders,
  //   ordersByStatus, revenueLast7Days, recentOrders } (Phase 3 Part 3)
  orderStats: () => apiGet('/orders/admin/stats'),

  // GET /api/v1/users/admin/stats -> { totalUsers, activeUsers, inactiveUsers,
  //   newUsersThisMonth, recentUsers } (Phase 3 Part 3)
  userStats: () => apiGet('/users/admin/stats'),
}
