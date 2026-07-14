import { apiGet } from './client'

// Customer-facing (storefront) Combo Offers API.
// Maps to the PUBLIC route only — GET /api/v1/combos.
// Every combo shown on the homepage is whatever is currently active in
// MongoDB (added/edited/reordered from the Admin Panel's "Combos" page) —
// there is no static/dummy data involved.

function currency(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function normalizeCombo(c) {
  if (!c) return null
  const original = Number(c.originalPrice || 0)
  const comboPrice = Number(c.comboPrice || 0)
  const savePct = original > comboPrice && original > 0
    ? Math.round(((original - comboPrice) / original) * 100)
    : 0

  return {
    id: c._id,
    _id: c._id,
    title: c.title,
    desc: c.description,
    save: savePct > 0 ? `SAVE ${savePct}%` : (c.tag || 'Special Offer'),
    newPrice: currency(comboPrice),
    oldPrice: currency(original),
    img1: (c.product1 && c.product1.images && c.product1.images[0]) || '',
    img2: (c.product2 && c.product2.images && c.product2.images[0]) || '',
  }
}

export const combosApi = {
  // Active combos only, already sorted by `order` on the backend.
  listActive: async () => {
    const data = await apiGet('/combos')
    return (data.combos || []).map(normalizeCombo).filter(Boolean)
  },
}
