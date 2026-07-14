import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client'
  export const heroSlidesApi = {
    list: () => apiGet('/hero-slides/admin/all'),
    create: (payload) => apiPost('/hero-slides', payload),
    update: (id, payload) => apiPut(`/hero-slides/${id}`, payload),
    remove: (id) => apiDelete(`/hero-slides/${id}`),
    toggleStatus: (id) => apiPatch(`/hero-slides/${id}/toggle`),
  }
  export const fetchActiveSlides = () => apiGet('/hero-slides')
  