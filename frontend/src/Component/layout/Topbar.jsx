import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { IconMenu, IconChevronDown, IconLogout } from '../AdminIcons'

const PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/categories': 'Categories',
  '/admin/orders': 'Orders',
  '/admin/users': 'Users',
  '/admin/reviews': 'Reviews',
  '/admin/coupons': 'Coupons',
  '/admin/inventory': 'Inventory',
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'A'
}

export default function Topbar({ title, onMenuClick }) {
  const { admin, logout } = useAdminAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  const resolvedTitle = title || PAGE_TITLES[window.location.pathname] || 'Admin'

  return (
    <header className="adm-topbar">
      <div className="adm-topbar-left">
        <button type="button" className="adm-hamburger" onClick={onMenuClick} aria-label="Open menu">
          <IconMenu />
        </button>
        <span className="adm-topbar-logo">Amrita<span>.</span></span>
        <span className="adm-topbar-divider" />
        <h1 className="adm-page-title">{resolvedTitle}</h1>
      </div>

      <div className="adm-topbar-right">
        <div className="adm-dropdown-wrap" ref={dropdownRef}>
          <button
            type="button"
            className="adm-admin-chip"
            onClick={() => setDropdownOpen((v) => !v)}
          >
            <span className="adm-avatar">{getInitials(admin?.name)}</span>
            <span className="adm-admin-chip-text">
              <strong>{admin?.name || 'Admin'}</strong>
              <span>{admin?.role || 'admin'}</span>
            </span>
            <IconChevronDown />
          </button>

          {dropdownOpen && (
            <div className="adm-dropdown">
              <button type="button" className="adm-dropdown-danger" onClick={handleLogout}>
                <IconLogout /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}