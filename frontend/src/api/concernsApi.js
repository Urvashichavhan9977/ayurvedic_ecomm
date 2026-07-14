import { apiGet } from './client'

// Storefront: only active concerns, sorted by admin-defined order,
// each with its linked products already populated by the backend
// (see backend/src/routes/concernRoutes.js -> GET /concerns).
export const fetchActiveConcerns = () => apiGet('/concerns')