import { apiPost, apiGet } from './client'
import { normalizeProduct } from './productsApi'

// Customer-facing order + payment API.
// COD orders are created directly. Online payments go through Razorpay:
// 1) createRazorpayOrder -> gets a Razorpay order + the public key
// 2) Razorpay Checkout widget opens in the browser
// 3) verifyPayment -> backend checks the signature and creates the real Order

export const ordersApi = {
  // Cash on Delivery — creates the order immediately.
  createCodOrder: (payload) => apiPost('/orders', payload),

  // Step 1 of online payment — server computes the real amount and asks
  // Razorpay for an order id.
  createRazorpayOrder: (payload) => apiPost('/orders/razorpay/create-order', payload),

  // Step 3 of online payment — verifies razorpay_signature server-side,
  // then creates the paid Order.
  verifyPayment: (payload) => apiPost('/orders/razorpay/verify', payload),

  // Logged-in customer's own orders.
  myOrders: () => apiGet('/orders/my'),

  // A single one of the logged-in customer's own orders (by Mongo _id or
  // human orderId like AYU123456) — used by the Track Order page, includes
  // each item's real tracking status (vendorItemStatus for vendor-sold
  // products, orderStatus for the overall order), plus a "Continue
  // Shopping" recommendedProducts list (same category first, then Best
  // Sellers, then latest products) normalized for ProductCard.
  getByOrderId: async (orderId) => {
    const res = await apiGet(`/orders/my/${orderId}`)
    return {
      ...res,
      recommendedProducts: (res.recommendedProducts || []).map(normalizeProduct),
    }
  },
}