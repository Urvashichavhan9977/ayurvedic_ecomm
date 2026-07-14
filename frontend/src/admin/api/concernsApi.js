import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client'
  export const concernsApi = {
    list: () => apiGet('/concerns/admin/all'),
    create: (payload) => apiPost('/concerns', payload),
    update: (id, payload) => apiPut(`/concerns/${id}`, payload),
    remove: (id) => apiDelete(`/concerns/${id}`),
    toggleStatus: (id) => apiPatch(`/concerns/${id}/toggle`),
  }
  export const fetchActiveConcerns = () => apiGet('/concerns')
  