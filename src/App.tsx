import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import BookingsPage from '@/pages/Bookings';
import AnalyticsPage from '@/pages/Analytics';
import SchedulersPage from '@/pages/Schedulers';
import PrioritiesPage from '@/pages/Priorities';
import VendorsPage from '@/pages/Vendors';
import TransportConfigPage from '@/pages/TransportConfig';
import AirportsPage from '@/pages/Airports';
import FleetPage from '@/pages/Fleet';
import DriversPage from '@/pages/Drivers';
import PartnersPage from '@/pages/Partners';
import HotelsPage from '@/pages/Hotels';
import FleetRequestsPage from '@/pages/FleetRequests';
import JourneysPage from '@/pages/Journeys';
import SettingsPage from '@/pages/Settings';

function AppLayout() {
  return (
    <Layout>
      <Outlet />
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
        <Route path="/" element={<DashboardPage />} />
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
