import { NavLink } from 'react-router-dom'
  import {
    IconDashboard, IconProducts, IconCategories, IconOrders,
    IconUsers, IconReviews, IconCoupons, IconInventory,
    IconHeroSlide, IconCombo, IconTrending, IconConcern,IconEssentials ,
    IconBlog, IconSettings, IconClose,IconMail, IconWallet, IconHomeContent
  } from '../AdminIcons'

  const MAIN_NAV = [
    { to: '/admin/dashboard',  label: 'Dashboard',   icon: IconDashboard, end: true },
    { to: '/admin/products',   label: 'Products',    icon: IconProducts },
    { to: '/admin/categories', label: 'Categories',  icon: IconCategories },
    { to: '/admin/orders',     label: 'Orders',      icon: IconOrders },
    { to: '/admin/admin-orders', label: '📦 Admin Orders', icon: IconOrders },
    { to: '/admin/users',      label: 'Users',       icon: IconUsers },
    { to: '/admin/vendors',    label: 'Vendors',     icon: IconInventory },
    { to: '/admin/finance',    label: 'Amount',      icon: IconWallet },
     { to: '/admin/contacts',   label: 'Contact Messages', icon: IconMail },
    { to: '/admin/reviews',    label: 'Reviews',     icon: IconReviews },
    { to: '/admin/coupons',    label: 'Coupons',     icon: IconCoupons },
    { to: '/admin/inventory',  label: 'Inventory',   icon: IconInventory },
  ]

  const STOREFRONT_NAV = [
    { to: '/admin/hero-slides',     label: 'Hero Slides',       icon: IconHeroSlide },
    { to: '/admin/combos',          label: 'Combo Offers',      icon: IconCombo },
    { to: '/admin/trending',        label: 'Trending Products', icon: IconTrending },
    { to: '/admin/shop-by-concern', label: 'Shop by Concern',   icon: IconConcern },
    { to: '/admin/daily-essentials', label: 'Daily Essentials', icon: IconEssentials },
    { to: '/admin/blog',            label: 'Blog',              icon: IconBlog },
    { to: '/admin/home-content',    label: 'Home Content',      icon: IconHomeContent },
  ]

  const ACCOUNT_NAV = [
    { to: '/admin/settings', label: 'Settings', icon: IconSettings },
  ]

  function NavGroup({ label, items, onClose }) {
    return (
      <>
        <div className="adm-nav-section-label">{label}</div>
        <ul>
          {items.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to} end={end}
                className={({ isActive }) => `adm-nav-link${isActive ? ' active' : ''}`}
                onClick={onClose}
              >
                <span className="adm-nav-icon"><Icon /></span>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </>
    )
  }

  export default function Sidebar({ open, onClose }) {
    return (
      <>
        <aside className={`adm-sidebar${open ? ' open' : ''}`}>
          <div className="adm-sidebar-brand">
            <div className="adm-login-logo">A</div>
            <div className="adm-sidebar-brand-text">
              <strong>Amrita Ayurveda</strong>
              <span>ADMIN PANEL</span>
            </div>
            <button type="button" className="adm-hamburger"
              style={{ marginLeft: 'auto', display: open ? 'inline-flex' : undefined, color: '#fff' }}
              onClick={onClose} aria-label="Close menu">
              <IconClose />
            </button>
          </div>

          <nav className="adm-nav">
            <NavGroup label="Main"       items={MAIN_NAV}       onClose={onClose} />
            <NavGroup label="Storefront" items={STOREFRONT_NAV} onClose={onClose} />
            <NavGroup label="Account"    items={ACCOUNT_NAV}    onClose={onClose} />
          </nav>

          <div className="adm-sidebar-footer">
            Amrita Ayurveda Admin<br />v1.0 &middot; Phase 3
          </div>
        </aside>
        <div className={`adm-sidebar-overlay${open ? ' open' : ''}`} onClick={onClose} />
      </>
    )
  }
  