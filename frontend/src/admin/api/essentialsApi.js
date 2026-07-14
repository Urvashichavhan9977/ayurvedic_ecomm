import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client'

export const essentialsApi = {
  list: () => apiGet('/essentials/admin/all'),
  create: (payload) => apiPost('/essentials', payload),
  update: (id, payload) => apiPut(`/essentials/${id}`, payload),
  remove: (id) => apiDelete(`/essentials/${id}`),
  toggleStatus: (id) => apiPatch(`/essentials/${id}/toggle`),
}

export const fetchActiveEssentials = () => apiGet('/essentials')
