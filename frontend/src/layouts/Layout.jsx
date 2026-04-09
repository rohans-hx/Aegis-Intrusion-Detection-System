import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Topbar  from '../components/common/Topbar';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect according to role after login
  useEffect(() => {
    if (!user) return;
    const path = window.location.pathname;
    if (path === '/' || path === '/login') {
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="layout-root">
      <Sidebar />
      <div className="layout-main">
        <Topbar />
        <main className="page cyber-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
