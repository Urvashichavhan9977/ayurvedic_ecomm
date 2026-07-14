import { apiGet } from './client'

// Storefront: only active posts, sorted by admin-defined order
export const fetchBlogPosts = () => apiGet('/blog')