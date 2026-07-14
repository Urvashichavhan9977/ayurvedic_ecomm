import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client'

export const categoriesApi = {
  // GET /api/v1/categories/admin/all -> { success, categories }
  list: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    return apiGet(`/categories/admin/all${q ? `?${q}` : ''}`)
  },
  create: (payload) => apiPost('/categories', payload),
  update: (id, payload) => apiPut(`/categories/${id}`, payload),
  remove: (id) => apiDelete(`/categories/${id}`),
  toggleStatus: (id) => apiPatch(`/categories/${id}/toggle`),
}