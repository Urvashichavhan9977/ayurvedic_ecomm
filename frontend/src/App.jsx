import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ScrollToTop from './Component/ScrollToTop.jsx'
import CustomerApp from './CustomerApp.jsx'
import AdminRoutes from './admin/routes/AdminRoutes.jsx'
import VendorRoutes from './vendor/routes/VendorRoutes.jsx'


// Top-level router: the customer storefront (CustomerApp — unchanged,
// unmodified) is mounted at "/*", the admin panel at "/admin/*", and the
// new vendor (seller) panel at "/vendor/*" — each with its own layout
// and auth, with zero effect on the existing customer/admin UI.
function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/vendor/*" element={<VendorRoutes />} />
        <Route path="/*" element={<CustomerApp />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
