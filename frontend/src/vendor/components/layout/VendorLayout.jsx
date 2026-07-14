import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useVendorAuth } from '../../context/VendorAuthContext'
import '../../styles/vendor.css'

const NAV = [
  { to: '/vendor/dashboard', label: 'Dashboard', end: true },
  { to: '/vendor/products', label: 'My Products' },
  { to: '/vendor/orders', label: '📦 My Orders' },
  { to: '/vendor/amount', label: 'Amount' },
  { to: '/vendor/profile', label: 'Shop Profile' },
]

const PAGE_TITLES = {
  '/vendor/dashboard': 'Dashboard',
  '/vendor/products': 'My Products',
  '/vendor/orders': 'Orders',
  '/vendor/amount': 'Amount',
  '/vendor/profile': 'Shop Profile',
}

const STATUS_LABEL = {
  approved: 'Approved',
  pending: 'Pending Review',
  rejected: 'Rejected',
  suspended: 'Suspended',
}

export default function VendorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { vendor, logout } = useVendorAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const title = PAGE_TITLES[location.pathname] || 'Vendor Panel'

  const handleLogout = async () => {
    await logout()
    navigate('/vendor/login', { replace: true })
  }

  return (
    <div className="vnd-root">
      <div className="vnd-shell">
        <aside className={`vnd-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="vnd-sidebar-brand">
            <div className="vnd-brand-mark">A</div>
            <div>
              <strong>Amrita Ayurveda</strong>
              <span>VENDOR PANEL</span>
            </div>
          </div>

          <nav className="vnd-nav">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `vnd-nav-link${isActive ? ' active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                {label}
              </NavLink>
            ))}
            <button
              type="button"
              className="vnd-nav-link"
              style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </nav>

          <div className="vnd-sidebar-footer">
            {vendor?.shopName}<br />Amrita Ayurveda Marketplace
          </div>
        </aside>

        <div
          className={`vnd-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        <div className="vnd-main">
          <div className="vnd-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                className="vnd-hamburger"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                ☰
              </button>
              <h1>{title}</h1>
            </div>
            {vendor?.vendorStatus && (
              <span className={`vnd-topbar-status vnd-badge vnd-badge-${vendor.vendorStatus}`}>
                {STATUS_LABEL[vendor.vendorStatus] || vendor.vendorStatus}
              </span>
            )}
          </div>
          <div className="vnd-content">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
