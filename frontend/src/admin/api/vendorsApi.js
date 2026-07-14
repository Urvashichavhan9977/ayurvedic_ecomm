import { apiGet, apiPatch } from './client'

function toQuery(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.set(k, v)
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export const vendorsApi = {
  list: (params) => apiGet(`/admin/vendors${toQuery(params)}`),
  get: (id) => apiGet(`/admin/vendors/${id}`),
  approve: (id) => apiPatch(`/admin/vendors/${id}/approve`),
  reject: (id, reason) => apiPatch(`/admin/vendors/${id}/reject`, { reason }),
  suspend: (id) => apiPatch(`/admin/vendors/${id}/suspend`),
  reactivate: (id) => apiPatch(`/admin/vendors/${id}/reactivate`),

  listPendingProducts: (params) => apiGet(`/admin/vendors/products/pending${toQuery(params)}`),
  approveProduct: (id) => apiPatch(`/admin/vendors/products/${id}/approve`),
  rejectProduct: (id, reason) => apiPatch(`/admin/vendors/products/${id}/reject`, { reason }),

  // Platform-wide Amount dashboard: own product sales vs vendor product
  // sales, with the vendor's 5% share broken out from the platform's share.
  financeSummary: () => apiGet('/admin/vendors/finance/summary'),
}
