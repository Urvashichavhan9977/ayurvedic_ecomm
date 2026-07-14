import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/categories': 'Categories',
  '/admin/orders': 'Orders',
  '/admin/admin-orders': '📦 Admin Orders',
  '/admin/users': 'Users',
  '/admin/vendors': 'Vendors',
  '/admin/contacts': 'Contact Messages',
  '/admin/reviews': 'Reviews',
  '/admin/coupons': 'Coupons',
  '/admin/inventory': 'Inventory',
  '/admin/instagram': 'Instagram posts',
  '/admin/blog': 'Blog',
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'Admin'

  useEffect(() => {
    const savedTheme = localStorage.getItem('adm_theme') || 'light'
    document.documentElement.setAttribute('data-adm-theme', savedTheme)
  }, [])

  return (
    <div className="adm-root">
      <div className="adm-shell">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="adm-main">
          <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
          <div className="adm-content">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}