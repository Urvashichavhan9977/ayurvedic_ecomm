import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext(null)

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

// Cart/wishlist are scoped per account so that logging in with a
// different id never shows the previous account's selections. Guests
// (not logged in) get their own shared 'guest' bucket.
function cartKey(userId) {
  return `amrita_cart_${userId || 'guest'}`
}
function wishlistKey(userId) {
  return `amrita_wishlist_${userId || 'guest'}`
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const userId = user?._id || user?.email || null

  const [cart, setCart] = useState(() => readStorage(cartKey(userId), []))
  const [wishlist, setWishlist] = useState(() => readStorage(wishlistKey(userId), []))

  // Tracks which account's data is currently loaded into state, and
  // whether the very next persist-to-localStorage write should be
  // skipped because state was just reloaded for a new account (and
  // hasn't actually changed yet in this render pass).
  const loadedUserRef = useRef(userId)
  const skipPersistRef = useRef({ cart: false, wishlist: false })

  // When the logged-in identity changes (fresh login, logout, or
  // switching to a different account on the same browser), drop
  // whatever is in memory and load that account's own cart/wishlist —
  // fresh/empty if they haven't shopped on this browser before.
  useEffect(() => {
    if (loadedUserRef.current === userId) return
    loadedUserRef.current = userId
    skipPersistRef.current.cart = true
    skipPersistRef.current.wishlist = true
    setCart(readStorage(cartKey(userId), []))
    setWishlist(readStorage(wishlistKey(userId), []))
  }, [userId])

  useEffect(() => {
    if (skipPersistRef.current.cart) {
      skipPersistRef.current.cart = false
      return
    }
    localStorage.setItem(cartKey(userId), JSON.stringify(cart))
  }, [cart, userId])

  useEffect(() => {
    if (skipPersistRef.current.wishlist) {
      skipPersistRef.current.wishlist = false
      return
    }
    localStorage.setItem(wishlistKey(userId), JSON.stringify(wishlist))
  }, [wishlist, userId])

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + qty } : item
        )
      }
      return [...prev, { ...product, qty }]
    })
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const updateQty = (id, qty) => {
    if (qty < 1) return
    setCart(prev => prev.map(item => (item.id === id ? { ...item, qty } : item)))
  }

  const clearCart = () => setCart([])

  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.some(item => item.id === product.id)
      if (exists) return prev.filter(item => item.id !== product.id)
      return [...prev, product]
    })
  }

  const isWished = (id) => wishlist.some(item => item.id === id)

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        toggleWishlist,
        isWished,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
