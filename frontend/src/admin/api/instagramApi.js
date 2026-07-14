import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client'
  export const instagramApi = {
    list: () => apiGet('/instagram/admin/all'),
    create: (payload) => apiPost('/instagram', payload),
    update: (id, payload) => apiPut(`/instagram/${id}`, payload),
    remove: (id) => apiDelete(`/instagram/${id}`),
    toggleStatus: (id) => apiPatch(`/instagram/${id}/toggle`),
  }
  export const fetchActiveInstagramPosts = () => apiGet('/instagram')