import { apiGet } from './client'

// Customer-facing (storefront) product API.
// Maps to the PUBLIC routes only — GET /api/v1/products and GET /api/v1/products/:slug.
// Every product shown here is whatever is currently active in MongoDB (added/edited
// from the Admin Panel) — there is no static/dummy data involved.

function starsFromRating(avg = 0) {
  const rounded = Math.round(avg || 0)
  return '★★★★★☆☆☆☆☆'.slice(5 - rounded, 10 - rounded)
}

export function normalizeProduct(p) {
  if (!p) return null
  const categoryObj = p.category && typeof p.category === 'object' ? p.category : null
  // Multi-vendor: when a product belongs to a vendor, the backend populates
  // `vendor` with { shopName, shopSlug }. Admin/platform products have
  // vendor = null, so this stays undefined for them and no badge renders.
  const vendorObj = p.vendor && typeof p.vendor === 'object' ? p.vendor : null
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
    vendor: vendorObj,
    vendorName: vendorObj ? vendorObj.shopName : '',
    vendorSlug: vendorObj ? vendorObj.shopSlug : '',
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
  // GET /api/v1/products -> { success, count, total, page, pages, products }
  // params: category (slug or id), search, isFeatured, isBestSeller, isNewArrival,
  //         isTrending, minPrice, maxPrice, sort, page, limit
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
}