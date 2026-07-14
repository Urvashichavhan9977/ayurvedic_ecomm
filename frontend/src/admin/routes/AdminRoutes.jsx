import { Routes, Route, Navigate } from 'react-router-dom'
  import { AdminAuthProvider } from '../context/AdminAuthContext'
  import { ToastProvider } from '../components/Toast'
  import ProtectedAdminRoute from '../components/ProtectedAdminRoute'
  import AdminLayout from '../components/layout/AdminLayout'
  import AdminLoginPage from '../pages/AdminLoginPage'
  import DashboardPage from '../pages/DashboardPage'
  import ProductsPage from '../pages/ProductsPage'
  import CategoriesPage from '../pages/CategoriesPage'
  import OrdersPage from '../pages/OrdersPage'
  import AdminOrdersPage from '../pages/AdminOrdersPage'
  import UsersPage from '../pages/UsersPage'
  import ReviewsPage from '../pages/ReviewsPage'
  import CouponsPage from '../pages/CouponsPage'
  import InventoryPage from '../pages/InventoryPage'
  import CombosPage from '../pages/CombosPage'
  import HeroSlidesPage from '../pages/HeroSlidesPage'
  import InstagramPage from '../pages/InstagramPage'
  import TrendingProductsPage from '../pages/TrendingProductsPage'
  import ShopByConcernPage from '../pages/ShopByConcernPage'
  import DailyEssentialsPage from '../pages/DailyEssentialsPage'
  import SettingsPage from '../pages/SettingsPage'
  import VendorsPage from '../pages/VendorsPage'
  import FinancePage from '../pages/FinancePage'
  import BlogPostsPage from '../pages/BlogPostsPage'
  import HomeContentPage from '../pages/HomeContentPage'
  
import ContactsPages from '../pages/ContactsPages'
  import '../styles/admin.css'
  

  export default function AdminRoutes() {
    return (
      <AdminAuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="login" element={<AdminLoginPage />} />
            <Route element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"       element={<DashboardPage />} />

              {/* Main */}
              <Route path="products"        element={<ProductsPage />} />
              <Route path="categories"      element={<CategoriesPage />} />
              <Route path="reviews"         element={<ReviewsPage />} />
              <Route path="coupons"         element={<CouponsPage />} />
              <Route path="inventory"       element={<InventoryPage />} />
              <Route path="orders"          element={<OrdersPage />} />
              <Route path="admin-orders"    element={<AdminOrdersPage />} />
              <Route path="users"           element={<UsersPage />} />
              <Route path="vendors"         element={<VendorsPage />} />
              <Route path="finance"         element={<FinancePage />} />

<Route path="contacts" element={<ContactsPages />} />
              {/* Storefront */}
              <Route path="hero-slides"     element={<HeroSlidesPage />} />
              <Route path="instagram" element={<InstagramPage />} />
              <Route path="combos"          element={<CombosPage />} />
              <Route path="trending"        element={<TrendingProductsPage />} />
              <Route path="shop-by-concern" element={<ShopByConcernPage />} />
              <Route path="daily-essentials" element={<DailyEssentialsPage />} />
              <Route path="blog" element={<BlogPostsPage />} />
              <Route path="home-content" element={<HomeContentPage />} />

              {/* Account */}
              <Route path="settings"        element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AdminAuthProvider>
    )
  }
  