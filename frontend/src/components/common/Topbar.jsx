import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TITLES = {
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/users':     'User Management',
  '/admin/rules':     'Detection Rules',
  '/admin/logs':      'Audit Logs',
  '/dashboard':       'Threat Overview',
  '/alerts':          'Alerts & Logs',
  '/network-map':     'Network Map',
  '/analytics':       'Analytics',
};

export default function Topbar() {
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const title = TITLES[location.pathname] || 'AEGIS IDS';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="page-title-sm">{title}</h1>
      </div>
      <div className="topbar-right">
        <span className="topbar-time">
          {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          {' · '}
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </header>
  );
}
