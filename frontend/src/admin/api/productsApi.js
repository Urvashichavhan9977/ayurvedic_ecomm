import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client'

// NOTE: `list` / `getBySlug` / `normalizeProduct` below hit the PUBLIC storefront
// routes and are used by other admin screens (Combos, Trending, Shop by Concern)
// to populate product pickers with the normalized shape. Do not change their
// signature — only the new `*Admin` methods below were added for the
// Products management screen (list/create/edit/delete with full fields).

function starsFromRating(avg = 0) {
  const rounded = Math.round(avg || 0)
  return '★★★★★☆☆☆☆☆'.slice(5 - rounded, 10 - rounded)
}

export function normalizeProduct(p) {
  if (!p) return null
  const categoryObj = p.category && typeof p.category === 'object' ? p.category : null
  return {
    id: p._id,
    _id: p._id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    oldPrice: p.oldPrice || null,
    img: (p.images && p.images[0]) || '',
    images: p.images || [],
    desc: p.shortDescription || '',
    description: p.description || '',
    category: categoryObj ? categoryObj.slug : (p.category || ''),
    categoryName: categoryObj ? categoryObj.name : '',
    badge: p.badge || null,
    badgeType: p.badgeType || 'red',
    stock: p.stock ?? 0,
    sku: p.sku || '',
    ingredients: p.ingredients || [],
    benefits: p.benefits || [],
    rating: p.ratingsAverage ? starsFromRating(p.ratingsAverage) : '★★★★☆',
    reviews: p.ratingsQuantity ? `${p.ratingsQuantity} reviews` : '',
    ratingsAverage: p.ratingsAverage || 0,
    ratingsQuantity: p.ratingsQuantity || 0,
    isFeatured: !!p.isFeatured,
    isBestSeller: !!p.isBestSeller,
    isNewArrival: !!p.isNewArrival,
    isTrending: !!p.isTrending,
  }
}

export const productsApi = {
  // ─── Public/storefront (used by product pickers on other admin pages) ───
  // GET /api/v1/products -> { success, count, total, page, pages, products }
  list: async (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    const res = await apiGet(`/products${query ? `?${query}` : ''}`)
    return { ...res, products: (res.products || []).map(normalizeProduct) }
  },

  // GET /api/v1/products/:slug -> { success, product }
  getBySlug: async (slug) => {
    const res = await apiGet(`/products/${slug}`)
    return normalizeProduct(res.product)
  },

  // ─── Admin (used by the Products management page) ───
  // GET /api/v1/products/admin/all -> { success, count, total, page, pages, products }
  // params: category, search, isActive, isFeatured, isBestSeller, isNewArrival,
  //         isTrending, minPrice, maxPrice, sort, page, limit
  listAdmin: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    return apiGet(`/products/admin/all${query ? `?${query}` : ''}`)
  },

  // GET /api/v1/products/admin/:id -> { success, product }
  getByIdAdmin: (id) => apiGet(`/products/admin/${id}`),

  create: (payload) => apiPost('/products', payload),
  update: (id, payload) => apiPut(`/products/${id}`, payload),
  remove: (id) => apiDelete(`/products/${id}`),

  // PATCH /api/v1/products/:id/stock  body: { mode: 'set'|'increment'|'decrement', quantity }
  updateStock: (id, payload) => apiPatch(`/products/${id}/stock`, payload),
}