import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LoginPage from '@/pages/Login';
import NotFoundPage from '@/pages/NotFound';

// One chunk per page: recharts, the booking detail view etc. only load when visited.
const DashboardPage = lazy(() => import('@/pages/Dashboard'));
const BookingsPage = lazy(() => import('@/pages/Bookings'));
const AnalyticsPage = lazy(() => import('@/pages/Analytics'));
const SchedulersPage = lazy(() => import('@/pages/Schedulers'));
const PrioritiesPage = lazy(() => import('@/pages/Priorities'));
const VendorsPage = lazy(() => import('@/pages/Vendors'));
const TransportConfigPage = lazy(() => import('@/pages/TransportConfig'));
const AirportsPage = lazy(() => import('@/pages/Airports'));
const FleetPage = lazy(() => import('@/pages/Fleet'));
const DriversPage = lazy(() => import('@/pages/Drivers'));
const PartnersPage = lazy(() => import('@/pages/Partners'));
const HotelsPage = lazy(() => import('@/pages/Hotels'));
const FleetRequestsPage = lazy(() => import('@/pages/FleetRequests'));
const JourneysPage = lazy(() => import('@/pages/Journeys'));
const SettingsPage = lazy(() => import('@/pages/Settings'));

function PageFallback() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading page">
      <div className="h-8 w-56 skeleton rounded-lg" />
      <div className="h-4 w-80 skeleton rounded" />
      <div className="h-64 skeleton rounded-2xl" />
    </div>
  );
}

function AppLayout() {
  const { pathname } = useLocation();
  return (
    <Layout>
      <ErrorBoundary resetKey={pathname}>
        <Suspense fallback={<PageFallback />}>
          <div key={pathname} className="page-enter">
            <Outlet />
          </div>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

// Page loads are gated by the server (no session cookie -> /login); a rejected API call
// sends the browser back to /login via the axios interceptor in lib/api.ts.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/priorities" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/schedulers" element={<SchedulersPage />} />
        <Route path="/priorities" element={<PrioritiesPage />} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/transport-config" element={<TransportConfigPage />} />
        <Route path="/airports" element={<AirportsPage />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/fleet-requests" element={<FleetRequestsPage />} />
        <Route path="/journeys" element={<JourneysPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
