import { apiGet } from './client'

// Storefront: only active essentials, sorted by admin-defined order,
// each with its linked products already populated by the backend
// (see backend/src/routes/essentialRoutes.js -> GET /essentials).
export const fetchActiveEssentials = () => apiGet('/essentials')
