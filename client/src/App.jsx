import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import NotFound from './pages/NotFound.jsx';
import ServicesIndex from './pages/ServicesIndex.jsx';
import ServiceDetail from './pages/ServiceDetail.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import BookingFlow from './pages/BookingFlow.jsx';
import AdminDashboard from './pages/dashboards/AdminDashboard.jsx';
import AdminBookings from './pages/dashboards/AdminBookings.jsx';
import AdminUsers from './pages/dashboards/AdminUsers.jsx';
import AdminWorkers from './pages/dashboards/AdminWorkers.jsx';
import AdminProducts from './pages/dashboards/AdminProducts.jsx';
import AdminServices from './pages/dashboards/AdminServices.jsx';
import AdminCoupons from './pages/dashboards/AdminCoupons.jsx';
import AdminAuditLogs from './pages/dashboards/AdminAuditLogs.jsx';
import AdminOrders from './pages/dashboards/AdminOrders.jsx';
import AdminFinance from './pages/dashboards/AdminFinance.jsx';
import AdminPayouts from './pages/dashboards/AdminPayouts.jsx';
import AdminSettings from './pages/dashboards/AdminSettings.jsx';
import AdminCategories from './pages/dashboards/AdminCategories.jsx';
import ManagerOrders from './pages/dashboards/ManagerOrders.jsx';
import ManagerWorkers from './pages/dashboards/ManagerWorkers.jsx';
import ManagerDashboard from './pages/dashboards/ManagerDashboard.jsx';
import WorkerDashboard from './pages/dashboards/WorkerDashboard.jsx';
import WorkerJobs from './pages/dashboards/WorkerJobs.jsx';
import WorkerEarnings from './pages/dashboards/WorkerEarnings.jsx';
import WorkerKyc from './pages/dashboards/WorkerKyc.jsx';
import WorkerAvailability from './pages/dashboards/WorkerAvailability.jsx';
import UserDashboard from './pages/dashboards/UserDashboard.jsx';
import UserBookings from './pages/dashboards/UserBookings.jsx';
import UserOrders from './pages/dashboards/UserOrders.jsx';
import UserAddresses from './pages/dashboards/UserAddresses.jsx';
import UserCoupons from './pages/dashboards/UserCoupons.jsx';
import UserOrderDetail from './pages/dashboards/UserOrderDetail.jsx';
import UserSupport from './pages/dashboards/UserSupport.jsx';
import SupportThread from './pages/dashboards/SupportThread.jsx';
import AdminSupport from './pages/dashboards/AdminSupport.jsx';
import AdminWallet from './pages/dashboards/AdminWallet.jsx';
import UserWallet from './pages/dashboards/UserWallet.jsx';
import ProfileEdit from './pages/ProfileEdit.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import Favorites from './pages/Favorites.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleRedirect from './components/RoleRedirect.jsx';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-sand text-ink dark:bg-[#0E0E10] dark:text-paper">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/services" element={<ServicesIndex />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route
            path="/book/:serviceId"
            element={
              <ProtectedRoute>
                <BookingFlow />
              </ProtectedRoute>
            }
          />

          <Route path="/cart" element={<CartPage />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleRedirect />
              </ProtectedRoute>
            }
          />

          <Route element={<ProtectedRoute roles={['admin', 'manager']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/workers" element={<AdminWorkers />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin', 'manager']} />}>
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/services" element={<AdminServices />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            <Route path="/admin/finance" element={<AdminFinance />} />
            <Route path="/admin/payouts" element={<AdminPayouts />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/manager/orders" element={<ManagerOrders />} />
            <Route path="/manager/workers" element={<ManagerWorkers />} />
            <Route path="/admin/support" element={<AdminSupport />} />
            <Route path="/admin/support/:id" element={<SupportThread adminMode />} />
            <Route path="/admin/wallet" element={<AdminWallet />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          </Route>

          <Route element={<ProtectedRoute roles={['worker', 'admin']} />}>
            <Route path="/worker" element={<WorkerDashboard />} />
            <Route path="/worker/jobs" element={<WorkerJobs />} />
            <Route path="/worker/earnings" element={<WorkerEarnings />} />
            <Route path="/worker/kyc" element={<WorkerKyc />} />
            <Route path="/worker/availability" element={<WorkerAvailability />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/me" element={<UserDashboard />} />
            <Route path="/me/bookings" element={<UserBookings />} />
            <Route path="/me/orders" element={<UserOrders />} />
            <Route path="/me/orders/:id" element={<UserOrderDetail />} />
            <Route path="/me/addresses" element={<UserAddresses />} />
            <Route path="/me/coupons" element={<UserCoupons />} />
            <Route path="/me/support" element={<UserSupport />} />
            <Route path="/me/support/:id" element={<SupportThread />} />
            <Route path="/me/wallet" element={<UserWallet />} />
            <Route path="/me/profile-edit" element={<ProfileEdit />} />
          </Route>

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
