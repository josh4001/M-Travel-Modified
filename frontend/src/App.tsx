import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { FloatingAiAssistant } from '@/components/ai/FloatingAiAssistant';
import { setUser } from '@/store/slices/authSlice';
import { api } from '@/lib/api';
import type { RootState } from '@/store';

import Landing from '@/pages/Landing';
import Services from '@/pages/Services';
import Catalogue from '@/pages/Catalogue';
import Team from '@/pages/Team';
import Contact from '@/pages/Contact';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Search from '@/pages/Search';
import VehicleDetail from '@/pages/VehicleDetail';
import MyBookings from '@/pages/dashboard/MyBookings';
import TouristDashboard from '@/pages/dashboard/TouristDashboard';
import OwnerDashboard from '@/pages/dashboard/OwnerDashboard';
import AdminDashboard from '@/pages/dashboard/AdminDashboard';
import WalletPage from '@/pages/dashboard/WalletPage';
import HolidaysAndTours from '@/pages/HolidaysAndTours';
import NotFound from '@/pages/NotFound';
import UberLocationPrompt from '@/components/common/UberLocationPrompt';

/** Ensures every route transition and refresh starts at the very top (0, 0) */
function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [pathname, search]);

  return null;
}

/** Smart Role Redirect based on authenticated user's RBAC role */
function RoleDashboard() {
  const user = useSelector((s: RootState) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  const role = user.role?.toUpperCase();
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return <Navigate to="/dashboard/admin" replace />;
  if (role === 'VEHICLE_OWNER' || role === 'OWNER' || role === 'HOST' || role === 'FLEET_HOST') return <Navigate to="/dashboard/owner" replace />;
  return <Navigate to="/dashboard/tourist" replace />;
}

/** Protects Fleet Market / Catalogue from Fleet Host personas */
function NonHostRoute({ children }: { children: JSX.Element }) {
  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role?.toUpperCase();
  if (role === 'VEHICLE_OWNER' || role === 'OWNER' || role === 'HOST' || role === 'FLEET_HOST') {
    return <Navigate to="/dashboard/owner" replace />;
  }
  return children;
}

export default function App() {
  const dispatch = useDispatch();

  // Restore session on load if user exists in local cache
  useEffect(() => {
    // 1. Instant local rehydration (0ms paint on refresh)
    const cached = localStorage.getItem('mt_user');
    if (cached) {
      try {
        dispatch(setUser(JSON.parse(cached)));
      } catch {}
    }

    const token = localStorage.getItem('mt_access_token');
    if (!token) return;

    // 2. Background verification (non-blocking, fast 2s timeout)
    api.get('/users/me', { timeout: 2000 })
      .then(({ data }) => {
        if (data) dispatch(setUser(data));
      })
      .catch(() => {
        // Backend offline or timeout; session safely remains on cached user
      });
  }, [dispatch]);

  return (
    <div className="flex min-h-screen flex-col relative">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* PUBLIC ROUTES (Fleet Hosts redirected to host portal) */}
          <Route path="/" element={<Landing />} />
          <Route path="/catalogue" element={<NonHostRoute><Catalogue /></NonHostRoute>} />
          <Route path="/holidays-and-tours" element={<NonHostRoute><HolidaysAndTours /></NonHostRoute>} />
          <Route path="/services" element={<Services />} />
          <Route path="/team" element={<Team />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<NonHostRoute><Search /></NonHostRoute>} />
          <Route path="/vehicles/:id" element={<NonHostRoute><VehicleDetail /></NonHostRoute>} />

          {/* SMART ROLE REDIRECT */}
          <Route path="/dashboard" element={<ProtectedRoute><RoleDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/holidays-and-tours" element={<NonHostRoute><HolidaysAndTours /></NonHostRoute>} />

          {/* RBAC-PROTECTED ROLE DASHBOARDS */}
          <Route
            path="/dashboard/tourist"
            element={
              <ProtectedRoute allowedRoles={['TOURIST', 'CUSTOMER', 'ADMIN']}>
                <TouristDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/owner"
            element={
              <ProtectedRoute allowedRoles={['VEHICLE_OWNER', 'OWNER', 'HOST', 'FLEET_HOST', 'ADMIN']}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* SHARED PROTECTED DASHBOARD PAGES */}
          <Route path="/dashboard/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/dashboard/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route
            path="/dashboard/wallet"
            element={
              <ProtectedRoute allowedRoles={['TOURIST', 'CUSTOMER', 'VEHICLE_OWNER', 'ADMIN', 'SUPER_ADMIN']}>
                <WalletPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      {/* GLOBAL UBER-STYLE LOCATION PERMISSION PROMPT */}
      <UberLocationPrompt />
      {/* GLOBAL AI SAFARI ASSISTANT WIDGET */}
      <FloatingAiAssistant />
    </div>
  );
}
