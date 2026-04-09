import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import {
  HiOutlineComputerDesktop, HiOutlineServer, HiOutlineCube,
  HiOutlineGlobeAlt, HiOutlineShieldExclamation, HiOutlineMagnifyingGlass,
  HiOutlineArrowPath, HiOutlineWrenchScrewdriver,
} from 'react-icons/hi2';

const DEVICE_ICONS = {
  server: HiOutlineServer,
  workstation: HiOutlineComputerDesktop,
  router: HiOutlineGlobeAlt,
  firewall: HiOutlineShieldExclamation,
  iot: HiOutlineCube,
  unknown: HiOutlineComputerDesktop,
};

const STATUS_COLORS = {
  online: 'var(--emerald)',
  offline: 'var(--txt-3)',
  suspect: 'var(--orange)',
};

export default function NetworkDiscovery() {
  const { socket } = useSocket();
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filters, setFilters] = useState({ status: '', type: '', search: '' });

  const fetchDevices = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('deviceType', filters.type);
      if (filters.search) params.append('search', filters.search);

      const { data } = await api.get(`/devices?${params}`);
      setDevices(data.data);
      setStats(data.stats);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (!socket) return;
    socket.on('device-discovered', ({ count }) => {
      toast.success(`Discovered ${count} new devices`);
      fetchDevices();
    });
    socket.on('device-updated', (device) => {
      setDevices(prev => prev.map(d => d._id === device._id ? device : d));
    });
    return () => {
      socket.off('device-discovered');
      socket.off('device-updated');
    };
  }, [socket, fetchDevices]);

  const handleScan = async () => {
    setScanning(true);
    try {
      await api.get('/devices/discover');
      toast.success('Network scan initiated');
      setTimeout(() => fetchDevices(), 2000);
    } catch (e) {
      toast.error('Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleUpdateStatus = async (device, newStatus) => {
    try {
      await api.put(`/devices/${device._id}`, { status: newStatus });
      toast.success('Device status updated');
      fetchDevices();
    } catch (e) {
      toast.error('Update failed');
    }
  };

  const filteredDevices = devices.filter(d => {
    if (filters.status && d.status !== filters.status) return false;
    if (filters.type && d.deviceType !== filters.type) return false;
    return true;
  });

  if (loading) return <DiscoverySkeleton />;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Network <span className="grad-text">Discovery</span></h1>
          <p className="page-sub">{devices.length} devices discovered on the network</p>
        </div>
        <button className="btn btn-primary" onClick={handleScan} disabled={scanning}>
          <HiOutlineMagnifyingGlass size={16} />
          {scanning ? 'Scanning...' : 'Scan Network'}
        </button>
      </div>

      {stats && (
        <div className="stats-strip">
          <StatBox label="Total Devices" value={stats.total} color="var(--blue)" />
          <StatBox label="Online" value={stats.online} color="var(--emerald)" />
          <StatBox label="Suspect" value={stats.suspect} color="var(--orange)" />
          <StatBox label="Offline" value={stats.offline} color="var(--txt-2)" />
        </div>
      )}

      <div className="filters-row">
        <select className="filter-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="suspect">Suspect</option>
        </select>
        <select className="filter-select" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="server">Server</option>
          <option value="workstation">Workstation</option>
          <option value="router">Router</option>
          <option value="firewall">Firewall</option>
          <option value="iot">IoT</option>
        </select>
        <input
          className="filter-search"
          placeholder="Search IP, hostname..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="devices-grid">
        {filteredDevices.map((device) => {
          const Icon = DEVICE_ICONS[device.deviceType] || DEVICE_ICONS.unknown;
          return (
            <div key={device._id} className="device-card">
              <div className="device-header">
                <div className="device-icon" style={{ background: `rgba(59,130,246,.12)` }}>
                  <Icon size={24} color="var(--blue)" />
                </div>
                <div className="device-status" style={{ background: STATUS_COLORS[device.status] }} />
              </div>
              <div className="device-info">
                <div className="device-ip mono">{device.ip}</div>
                <div className="device-hostname">{device.hostname}</div>
                <div className="device-meta">
                  <span className="device-vendor">{device.vendor}</span>
                  <span className="device-type">{device.deviceType}</span>
                </div>
              </div>
              <div className="device-ports">
                {device.openPorts?.slice(0, 4).map((p, i) => (
                  <span key={i} className="port-badge">{p.port}/{p.service}</span>
                ))}
              </div>
              <div className="device-footer">
                <span className="device-last-seen">Last seen: {new Date(device.lastSeen).toLocaleTimeString()}</span>
                <div className="device-actions">
                  <select
                    className="device-status-select"
                    value={device.status}
                    onChange={(e) => handleUpdateStatus(device, e.target.value)}
                  >
                    <option value="online">Online</option>
                    <option value="suspect">Suspect</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!filteredDevices.length && (
        <div className="empty-state">
          <div className="empty-icon">🌐</div>
          <p>No devices found. Click "Scan Network" to discover devices.</p>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-info">
        <div className="stat-val" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function DiscoverySkeleton() {
  return (
    <div>
      <div className="page-header">
        <div style={{ height: 28, width: 200 }} className="skeleton" />
        <div style={{ height: 16, width: 300, marginTop: 8 }} className="skeleton" />
      </div>
      <div className="stats-strip">
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
      </div>
    </div>
  );
}