import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client'

export const blogApi = {
  list: () => apiGet('/blog/admin/all'),
  create: (payload) => apiPost('/blog', payload),
  update: (id, payload) => apiPut(`/blog/${id}`, payload),
  remove: (id) => apiDelete(`/blog/${id}`),
  toggleStatus: (id) => apiPatch(`/blog/${id}/toggle`),
}