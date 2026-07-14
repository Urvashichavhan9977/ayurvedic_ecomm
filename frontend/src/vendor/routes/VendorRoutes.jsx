import { Routes, Route, Navigate } from 'react-router-dom'
import { VendorAuthProvider } from '../context/VendorAuthContext'
import ProtectedVendorRoute from '../components/ProtectedVendorRoute'
import VendorLayout from '../components/layout/VendorLayout'
import VendorLoginPage from '../pages/VendorLoginPage'
import VendorRegisterPage from '../pages/VendorRegisterPage'
import VendorDashboardPage from '../pages/VendorDashboardPage'
import VendorProductsPage from '../pages/VendorProductsPage'
import VendorOrdersPage from '../pages/VendorOrdersPage'
import VendorEarningsPage from '../pages/VendorEarningsPage'
import VendorProfilePage from '../pages/VendorProfilePage'
import '../styles/vendor.css'

export default function VendorRoutes() {
  return (
    <VendorAuthProvider>
      <Routes>
        <Route path="login" element={<VendorLoginPage />} />
        <Route path="register" element={<VendorRegisterPage />} />
        <Route element={<ProtectedVendorRoute><VendorLayout /></ProtectedVendorRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<VendorDashboardPage />} />
          <Route path="products" element={<VendorProductsPage />} />
          <Route path="orders" element={<VendorOrdersPage />} />
          <Route path="amount" element={<VendorEarningsPage />} />
          <Route path="profile" element={<VendorProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </VendorAuthProvider>
  )
}
