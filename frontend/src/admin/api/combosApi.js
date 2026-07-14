import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client'

export const combosApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== null && v !== '')).toString()
    return apiGet(`/combos/admin/all${q ? `?${q}` : ''}`)
  },
  create: (payload) => apiPost('/combos', payload),
  update: (id, payload) => apiPut(`/combos/${id}`, payload),
  remove: (id) => apiDelete(`/combos/${id}`),
  toggleStatus: (id) => apiPatch(`/combos/${id}/toggle`),
}

export const fetchActiveCombos = () => apiGet('/combos')