import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client'

function toQuery(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.set(k, v)
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export const vendorApi = {
  dashboard: () => apiGet('/vendor/dashboard'),
  earnings: (params) => apiGet(`/vendor/earnings${toQuery(params)}`),

  // Public endpoint — used to populate the category dropdown on the
  // product form.
  listCategories: async () => {
    const res = await apiGet('/categories')
    return res.categories || []
  },

  listProducts: (params) => apiGet(`/vendor/products${toQuery(params)}`),
  getProduct: (id) => apiGet(`/vendor/products/${id}`),
  createProduct: (payload) => apiPost('/vendor/products', payload),
  updateProduct: (id, payload) => apiPut(`/vendor/products/${id}`, payload),
  deleteProduct: (id) => apiDelete(`/vendor/products/${id}`),
  updateStock: (id, mode, quantity) => apiPatch(`/vendor/products/${id}/stock`, { mode, quantity }),

  listOrders: (params) => apiGet(`/vendor/orders${toQuery(params)}`),
  // extra can include { trackingNumber, courierName, estimatedDeliveryDate }
  updateOrderItemStatus: (orderId, status, extra = {}) =>
    apiPatch(`/vendor/orders/${orderId}/item-status`, { status, ...extra }),
}
