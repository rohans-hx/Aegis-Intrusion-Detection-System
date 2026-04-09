import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { WidgetProvider } from './context/WidgetContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './layouts/Layout';
import RealTimeAlerts from './components/common/RealTimeAlerts';

import Login  from './pages/auth/Login';
import Signup from './pages/auth/Signup';

import AdminDashboard  from './pages/admin/AdminDashboard';
import Users           from './pages/admin/Users';
import Rules           from './pages/admin/Rules';
import AuditLogs       from './pages/admin/AuditLogs';
import Settings         from './pages/admin/Settings';

import AnalystDashboard from './pages/analyst/AnalystDashboard';
import Alerts           from './pages/analyst/Alerts';
import NetworkMap       from './pages/analyst/NetworkMap';
import Analytics        from './pages/analyst/Analytics';
import NetworkDiscovery from './pages/analyst/NetworkDiscovery';

export default function App() {
  return (
    <AuthProvider>
      <WidgetProvider>
        <SocketProvider>
          <RealTimeAlerts />
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                style: { background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '10px', fontSize: '.85rem' },
                success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
                error:   { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
              }}
            />
            <Routes>
            {/* Public */}
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/"       element={<Navigate to="/login" replace />} />

            {/* Admin-only */}
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route element={<Layout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users"     element={<Users />} />
                <Route path="/admin/rules"     element={<Rules />} />
                <Route path="/admin/logs"      element={<AuditLogs />} />
                <Route path="/admin/settings"  element={<Settings />} />
              </Route>
            </Route>

            {/* All authenticated users */}
            <Route element={<ProtectedRoute roles={['admin','analyst','viewer']} />}>
              <Route element={<Layout />}>
                <Route path="/dashboard"   element={<AnalystDashboard />} />
                <Route path="/alerts"      element={<Alerts />} />
                <Route path="/network-map" element={<NetworkMap />} />
                <Route path="/network-discovery" element={<NetworkDiscovery />} />
                <Route path="/analytics"   element={<Analytics />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
        </SocketProvider>
      </WidgetProvider>
    </AuthProvider>
  );
}
