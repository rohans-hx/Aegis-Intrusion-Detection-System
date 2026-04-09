import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineShieldCheck, HiOutlineChartBarSquare, HiOutlineBell,
  HiOutlineGlobeAlt, HiOutlineChartPie, HiOutlineUsers,
  HiOutlineCog6Tooth, HiOutlineClipboardDocumentList,
  HiOutlineArrowRightOnRectangle, HiOutlineCpuChip,
} from 'react-icons/hi2';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-logo">🛡️</div>
        <div className="brand-text">
          <h2><span>AEGIS</span> IDS</h2>
          <p>INTRUSION DETECTION</p>
        </div>
      </div>

      {/* System status */}
      <div className="sidebar-status">
        <span className="pulse-dot" />
        System Active — Monitoring
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {isAdmin && (
          <>
            <div className="nav-section-label">Admin Control</div>
            <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <HiOutlineChartBarSquare size={18} /> Dashboard
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <HiOutlineUsers size={18} /> User Management
            </NavLink>
            <NavLink to="/admin/rules" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <HiOutlineCog6Tooth size={18} /> Detection Rules
            </NavLink>
            <NavLink to="/admin/logs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <HiOutlineClipboardDocumentList size={18} /> Audit Logs
            </NavLink>
            <NavLink to="/admin/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <HiOutlineCog6Tooth size={18} /> Settings
            </NavLink>
          </>
        )}

        <div className="nav-section-label">Threat Center</div>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <HiOutlineShieldCheck size={18} /> {isAdmin ? 'Analyst View' : 'Dashboard'}
        </NavLink>
        <NavLink to="/alerts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <HiOutlineBell size={18} /> Alerts & Logs
        </NavLink>
        <NavLink to="/network-map" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <HiOutlineGlobeAlt size={18} /> Network Map
        </NavLink>
        <NavLink to="/network-discovery" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <HiOutlineCpuChip size={18} /> Device Discovery
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <HiOutlineChartPie size={18} /> Analytics
        </NavLink>
      </nav>

      {/* Footer / User */}
      <div className="sidebar-footer">
        <div className="avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{user?.name}</div>
          <div className="user-role">{user?.role}</div>
        </div>
        <button className="logout-btn" onClick={logout} title="Logout">
          <HiOutlineArrowRightOnRectangle size={18} />
        </button>
      </div>
    </aside>
  );
}
