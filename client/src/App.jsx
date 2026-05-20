import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// Eager — needed for first paint or auth flows
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import NotFound from './pages/NotFound.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleRedirect from './components/RoleRedirect.jsx';

// Lazy — pulled on demand. Each becomes its own JS chunk after vite build.
const ServicesIndex = lazy(() => import('./pages/ServicesIndex.jsx'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail.jsx'));
const ProductsIndex = lazy(() => import('./pages/ProductsIndex.jsx'));
const ProductDetail = lazy(() => import('./pages/ProductDetail.jsx'));
const BookingFlow = lazy(() => import('./pages/BookingFlow.jsx'));
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const Favorites = lazy(() => import('./pages/Favorites.jsx'));
const ProfileEdit = lazy(() => import('./pages/ProfileEdit.jsx'));

// Admin/manager surface
const AdminDashboard = lazy(() => import('./pages/dashboards/AdminDashboard.jsx'));
const AdminBookings = lazy(() => import('./pages/dashboards/AdminBookings.jsx'));
const AdminUsers = lazy(() => import('./pages/dashboards/AdminUsers.jsx'));
const AdminWorkers = lazy(() => import('./pages/dashboards/AdminWorkers.jsx'));
const AdminWorkerDetail = lazy(() => import('./pages/dashboards/AdminWorkerDetail.jsx'));
const AdminProducts = lazy(() => import('./pages/dashboards/AdminProducts.jsx'));
const AdminServices = lazy(() => import('./pages/dashboards/AdminServices.jsx'));
const AdminCoupons = lazy(() => import('./pages/dashboards/AdminCoupons.jsx'));
const AdminAuditLogs = lazy(() => import('./pages/dashboards/AdminAuditLogs.jsx'));
const AdminOrders = lazy(() => import('./pages/dashboards/AdminOrders.jsx'));
const AdminFinance = lazy(() => import('./pages/dashboards/AdminFinance.jsx'));
const AdminPayouts = lazy(() => import('./pages/dashboards/AdminPayouts.jsx'));
const AdminSettings = lazy(() => import('./pages/dashboards/AdminSettings.jsx'));
const AdminCategories = lazy(() => import('./pages/dashboards/AdminCategories.jsx'));
const AdminSupport = lazy(() => import('./pages/dashboards/AdminSupport.jsx'));
const AdminWallet = lazy(() => import('./pages/dashboards/AdminWallet.jsx'));
const ManagerOrders = lazy(() => import('./pages/dashboards/ManagerOrders.jsx'));
const ManagerWorkers = lazy(() => import('./pages/dashboards/ManagerWorkers.jsx'));
const ManagerDashboard = lazy(() => import('./pages/dashboards/ManagerDashboard.jsx'));

// Worker surface
const WorkerDashboard = lazy(() => import('./pages/dashboards/WorkerDashboard.jsx'));
const WorkerJobs = lazy(() => import('./pages/dashboards/WorkerJobs.jsx'));
const WorkerEarnings = lazy(() => import('./pages/dashboards/WorkerEarnings.jsx'));
const WorkerKyc = lazy(() => import('./pages/dashboards/WorkerKyc.jsx'));
const WorkerAvailability = lazy(() => import('./pages/dashboards/WorkerAvailability.jsx'));

// User surface
const UserDashboard = lazy(() => import('./pages/dashboards/UserDashboard.jsx'));
const UserBookings = lazy(() => import('./pages/dashboards/UserBookings.jsx'));
const UserOrders = lazy(() => import('./pages/dashboards/UserOrders.jsx'));
const UserOrderDetail = lazy(() => import('./pages/dashboards/UserOrderDetail.jsx'));
const UserAddresses = lazy(() => import('./pages/dashboards/UserAddresses.jsx'));
const UserCoupons = lazy(() => import('./pages/dashboards/UserCoupons.jsx'));
const UserSupport = lazy(() => import('./pages/dashboards/UserSupport.jsx'));
const UserWallet = lazy(() => import('./pages/dashboards/UserWallet.jsx'));
const UserKyc = lazy(() => import('./pages/dashboards/UserKyc.jsx'));
const SupportThread = lazy(() => import('./pages/dashboards/SupportThread.jsx'));
const TrackBooking = lazy(() => import('./pages/TrackBooking.jsx'));
const WorkerNav = lazy(() => import('./pages/WorkerNav.jsx'));

function PageFallback() {
  return (
    <section className="container-velora py-16">
      <div className="skeleton h-12 w-72" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="skeleton h-32 w-full" />
        <div className="skeleton h-32 w-full" />
      </div>
    </section>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 pt-24">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/services" element={<ServicesIndex />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/products" element={<ProductsIndex />} />
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
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />

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
              <Route path="/admin/workers/:id" element={<AdminWorkerDetail />} />
            </Route>

            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="/admin/categories" element={<AdminCategories />} />
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
              <Route path="/worker/jobs/:bookingId/nav" element={<WorkerNav />} />
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
              <Route path="/me/kyc" element={<UserKyc />} />
              <Route path="/me/profile-edit" element={<ProfileEdit />} />
              <Route path="/track/:bookingId" element={<TrackBooking />} />
            </Route>

            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
