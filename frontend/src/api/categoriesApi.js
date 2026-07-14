import { apiGet } from './client'

export function normalizeCategory(c) {
  if (!c) return null
  return {
    id: c._id,
    slug: c.slug,
    name: c.name,
    img: c.image || '',
    description: c.description || '',
    count: c.productCount ? `${c.productCount}+` : '0',
  }
}

export const categoriesApi = {
  list: async () => {
    const res = await apiGet('/categories')
    return (res.categories || []).map(normalizeCategory)
  },
}