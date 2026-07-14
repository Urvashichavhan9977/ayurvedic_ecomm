import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  FiSearch,
  FiUser,
  FiHeart,
  FiShoppingCart,
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiPackage,
  FiKey,
  FiHome,
  FiBriefcase,
} from 'react-icons/fi'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import BlogDrawer from './BlogDrawer.jsx'
import MegaMenu from './MegaMenu.jsx'
import '../styles/Header.css'

export default function Header() {
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [blogOpen, setBlogOpen] = useState(false)
  const [shopMenuOpen, setShopMenuOpen] = useState(false)     // desktop hover
  const [mobileShopOpen, setMobileShopOpen] = useState(false) // mobile accordion
  const [accountMenuOpen, setAccountMenuOpen] = useState(false) // login/account dropdown
  const { cartCount, wishlist, isWished } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const accountCloseTimer = useRef(null)
  const accountMenuRef = useRef(null)

  const openAccountMenu = () => {
    if (accountCloseTimer.current) clearTimeout(accountCloseTimer.current)
    setAccountMenuOpen(true)
  }

  const scheduleCloseAccountMenu = () => {
    accountCloseTimer.current = setTimeout(() => setAccountMenuOpen(false), 200)
  }

  useEffect(() => () => {
    if (accountCloseTimer.current) clearTimeout(accountCloseTimer.current)
  }, [])

  // Close the account dropdown on outside click (needed for the mobile
  // tap-to-toggle interaction, where there's no mouseleave to rely on).
  useEffect(() => {
    if (!accountMenuOpen) return
    const handleClickOutside = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [accountMenuOpen])

  // Small close-delay so moving the cursor from "Shop" down into the panel
  // never closes the menu mid-way — it only closes if the mouse truly leaves.
  const closeTimer = useRef(null)

  const openShopMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setShopMenuOpen(true)
  }

  const scheduleCloseShopMenu = () => {
    closeTimer.current = setTimeout(() => setShopMenuOpen(false), 200)
  }

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const closeMenu = () => {
    setMenuOpen(false)
    setShopMenuOpen(false)
    setMobileShopOpen(false)
    setAccountMenuOpen(false)
  }

  const goToAccountOption = (path) => {
    setAccountMenuOpen(false)
    closeMenu()
    navigate(path)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`)
      setQuery('')
      closeMenu()
    }
  }

  const openBlog = () => {
    setBlogOpen(true)
    closeMenu()
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo" onClick={closeMenu}>
          Amrita<span>.</span>
        </Link>

        {/* ───────── Desktop nav (hidden on mobile via CSS) ───────── */}
        <nav className="header-nav-wrap">
          <ul className="header-nav">
            <li><NavLink to="/" end onClick={closeMenu}>Home</NavLink></li>

            <li
              className="header-nav-item-mega"
              onMouseEnter={openShopMenu}
              onMouseLeave={scheduleCloseShopMenu}
            >
              <div className="header-shop-trigger">
                <NavLink to="/shop" onClick={closeMenu}>Shop</NavLink>
                <FiChevronDown className="header-shop-caret-icon" />
              </div>
              <div className={`mega-menu-panel ${shopMenuOpen ? 'is-open' : ''}`}>
                <div className="mega-menu-card">
                  <MegaMenu onNavigate={closeMenu} />
                </div>
              </div>
            </li>

            <li><NavLink to="/ingredients" onClick={closeMenu}>Ingredients</NavLink></li>
            <li><NavLink to="/wellness-hub" onClick={closeMenu}>Wellness Hub</NavLink></li>
            <li><NavLink to="/about" onClick={closeMenu}>About</NavLink></li>
            <li><NavLink to="/contact" onClick={closeMenu}>Contact</NavLink></li>
            <li>
              <button type="button" className="header-blog-link" onClick={openBlog}>
                Our Blog
              </button>
            </li>
          </ul>
        </nav>

        {/* ───────── Right-side action group (search, account, wishlist, cart, hamburger) ───────── */}
        <div className="header-right">
          <form className="header-search" onSubmit={handleSearch}>
            <FiSearch className="header-search-icon" />
            <input
              type="text"
              placeholder="Search products…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </form>

          <div
            className="header-account-wrap"
            ref={accountMenuRef}
            onMouseEnter={openAccountMenu}
            onMouseLeave={scheduleCloseAccountMenu}
          >
            <button
              type="button"
              className="header-icon-btn"
              aria-label="Account"
              aria-haspopup="true"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((o) => !o)}
            >
              <FiUser size={17} />
            </button>

            <div className={`header-account-menu ${accountMenuOpen ? 'is-open' : ''}`}>
              <button type="button" onClick={() => goToAccountOption('/login')}>
                <span className="header-account-menu-icon"><FiKey size={15} /></span>
                User Login
              </button>
              <button type="button" onClick={() => goToAccountOption('/vendor/register')}>
                <span className="header-account-menu-icon"><FiBriefcase size={15} /></span>
                Become a Vendor
              </button>
              <button
                type="button"
                onClick={() => goToAccountOption(isAuthenticated ? '/profile' : '/login')}
              >
                <span className="header-account-menu-icon"><FiUser size={15} /></span>
                My Account
              </button>
              <button
                type="button"
                onClick={() => goToAccountOption(isAuthenticated ? '/profile?tab=orders' : '/login')}
              >
                <span className="header-account-menu-icon"><FiPackage size={15} /></span>
                My Orders
              </button>
            </div>
          </div>

          <Link to="/wishlist" className="header-icon-btn header-wishlist-btn" aria-label="Wishlist" onClick={closeMenu}>
            <FiHeart size={17} fill={isWished ? 'currentColor' : 'none'} />
            {wishlist.length > 0 && <span className="header-wishlist-count">{wishlist.length}</span>}
          </Link>

          <Link to="/cart" className="header-icon-btn" aria-label="Cart" onClick={closeMenu}>
            <FiShoppingCart size={17} />
            {cartCount > 0 && <span className="header-cart-count">{cartCount}</span>}
          </Link>

          <button
            className="header-mobile-toggle"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* ───────── Mobile drawer + overlay ───────── */}
      <div className={`header-drawer-overlay ${menuOpen ? 'is-open' : ''}`} onClick={closeMenu} />

      <aside className={`header-drawer ${menuOpen ? 'is-open' : ''}`}>
        <div className="header-drawer-head">
          <Link to="/" className="header-logo" onClick={closeMenu}>
            Amrita<span>.</span>
          </Link>
          <button type="button" className="header-drawer-close" aria-label="Close menu" onClick={closeMenu}>
            <FiX size={20} />
          </button>
        </div>

        <form className="header-search header-search-mobile" onSubmit={handleSearch}>
          <FiSearch className="header-search-icon" />
          <input
            type="text"
            placeholder="Search products…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </form>

        <nav className="header-drawer-nav">
          <NavLink to="/" end onClick={closeMenu}><FiHome size={16} /> Home</NavLink>

          <div className="header-drawer-shop">
            <button
              type="button"
              className="header-drawer-shop-btn"
              onClick={() => setMobileShopOpen((o) => !o)}
              aria-expanded={mobileShopOpen}
            >
              <span>Shop</span>
              <FiChevronRight className={`header-drawer-chevron ${mobileShopOpen ? 'is-open' : ''}`} />
            </button>
            <div className={`header-drawer-shop-panel ${mobileShopOpen ? 'is-open' : ''}`}>
              <MegaMenu onNavigate={closeMenu} />
            </div>
          </div>

          <NavLink to="/ingredients" onClick={closeMenu}>Ingredients</NavLink>
          <NavLink to="/wellness-hub" onClick={closeMenu}>Wellness Hub</NavLink>
          <NavLink to="/about" onClick={closeMenu}>About</NavLink>
          <NavLink to="/contact" onClick={closeMenu}>Contact</NavLink>
          <button type="button" className="header-blog-link" onClick={openBlog}>Our Blog</button>
        </nav>

        <div className="header-drawer-links">
          <Link to="/login" onClick={closeMenu}><FiKey size={15} /> User Login</Link>
          <Link to="/vendor/register" onClick={closeMenu}><FiBriefcase size={15} /> Become a Vendor</Link>
          <Link to={isAuthenticated ? '/profile' : '/login'} onClick={closeMenu}><FiUser size={15} /> My Account</Link>
          <Link to={isAuthenticated ? '/profile?tab=orders' : '/login'} onClick={closeMenu}><FiPackage size={15} /> My Orders</Link>
          <Link to="/wishlist" onClick={closeMenu}><FiHeart size={15} /> Wishlist {wishlist.length > 0 && `(${wishlist.length})`}</Link>
          <Link to="/cart" onClick={closeMenu}><FiShoppingCart size={15} /> Cart {cartCount > 0 && `(${cartCount})`}</Link>
        </div>
      </aside>

      <BlogDrawer open={blogOpen} onClose={() => setBlogOpen(false)} />
    </header>
  )
}
