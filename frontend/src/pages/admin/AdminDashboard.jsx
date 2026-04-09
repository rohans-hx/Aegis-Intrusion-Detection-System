import { useState, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { usePolling } from '../../hooks/usePolling';
import {
  HiOutlineShieldExclamation, HiOutlineExclamationTriangle,
  HiOutlineCheckCircle, HiOutlineBolt,
} from 'react-icons/hi2';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const SEV_COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' };
const ATTACK_COLORS = ['#3b82f6', '#8b5cf6', '#22d3ee', '#f59e0b', '#10b981', '#f97316', '#ef4444', '#ec4899'];

const ATTACK_TYPES = ['Port Scan', 'SQL Injection', 'Brute Force', 'DDoS', 'Malware', 'XSS', 'MITM', 'Ransomware'];
const ATTACK_ICONS = { 'Port Scan': '🔍', 'SQL Injection': '💉', 'Brute Force': '🔨', DDoS: '🌊', Malware: '🦠', XSS: '📜', MITM: '👁️', Ransomware: '🔒' };

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoad]  = useState(true);
  const [simulating, setSim] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/alerts/stats');
      setStats(data.data);
    } catch { /* silent */ } finally { setLoad(false); }
  }, []);

  usePolling(fetchStats, 8000);

  const simulate = async (type) => {
    setSim(type);
    try {
      const { data } = await api.post('/alerts/simulate', { attackType: type });
      toast.success(`${type} simulated!`);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Simulation failed');
    } finally { setSim(''); }
  };

  if (loading) return <DashSkeleton />;

  const sevData     = stats?.bySeverity?.map((s) => ({ name: s._id, value: s.count })) || [];
  const attackData  = stats?.byAttackType?.map((a) => ({ name: a._id, value: a.count })) || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin <span className="grad-text">Command Center</span></h1>
        <p className="page-sub">Real-time overview of network security posture</p>
      </div>

      {/* Stats strip */}
      <div className="stats-strip">
        <StatCard icon={<HiOutlineShieldExclamation />} bg="rgba(59,130,246,.12)" color="var(--blue)"
          value={stats?.totalAlerts ?? 0} label="Total Alerts" />
        <StatCard icon={<HiOutlineBolt />} bg="rgba(239,68,68,.12)" color="var(--red)"
          value={stats?.openAlerts ?? 0} label="Open Threats" />
        <StatCard icon={<HiOutlineExclamationTriangle />} bg="rgba(249,115,22,.12)" color="var(--orange)"
          value={stats?.criticalAlerts ?? 0} label="Critical Active" />
        <StatCard icon={<HiOutlineCheckCircle />} bg="rgba(16,185,129,.12)" color="var(--emerald)"
          value={stats?.resolvedToday ?? 0} label="Resolved Today" />
      </div>

      {/* Charts row */}
      <div className="charts-row">
        {/* Attack types bar chart */}
        <div className="card">
          <div className="card-header"><span className="card-title">Attacks by Type</span></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={attackData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 13 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {attackData.map((_, i) => <Cell key={i} fill={ATTACK_COLORS[i % ATTACK_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Severity pie */}
        <div className="card">
          <div className="card-header"><span className="card-title">Severity</span></div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={sevData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4}>
                {sevData.map((s) => <Cell key={s.name} fill={SEV_COLORS[s.name] || '#64748b'} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {sevData.map((s) => (
              <span key={s.name} style={{ fontSize: '.72rem', color: SEV_COLORS[s.name], display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: SEV_COLORS[s.name], display: 'inline-block' }} />
                {s.name} ({s.value})
              </span>
            ))}
          </div>
        </div>

        {/* Attack simulator */}
        <div className="card">
          <div className="card-header"><span className="card-title">Attack Simulator</span></div>
          <div className="attack-grid">
            {ATTACK_TYPES.map((t) => (
              <button key={t} className={`attack-btn ${simulating === t ? 'loading' : ''}`} onClick={() => simulate(t)}>
                <span>{ATTACK_ICONS[t]}</span> {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live feed + system health */}
      <div className="charts-row-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Live Threat Feed</span></div>
          <div className="live-feed">
            {stats?.recentAlerts?.length ? stats.recentAlerts.map((a) => (
              <div key={a._id} className={`feed-item ${a.severity}`}>
                <div className="feed-dot" style={{ background: SEV_COLORS[a.severity] }} />
                <div>
                  <div className="feed-title">{a.title}</div>
                  <div className="feed-meta">{a.sourceIP} → {a.targetIP} · {a.attackType} · {new Date(a.createdAt).toLocaleTimeString()}</div>
                </div>
              </div>
            )) : <div className="empty-state"><div className="empty-icon">📡</div>No recent threats</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">System Health</span></div>
          <div className="health-row">
            <HealthBar label="CPU Usage" pct={42} color="var(--emerald)" />
            <HealthBar label="Memory" pct={67} color="var(--blue)" />
            <HealthBar label="Disk I/O" pct={23} color="var(--cyan)" />
            <HealthBar label="Network" pct={81} color="var(--amber)" />
            <HealthBar label="Detection Engine" pct={98} color="var(--violet)" />
            <HealthBar label="DB Connections" pct={35} color="var(--emerald)" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, bg, color, value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg, color }}>{icon}</div>
      <div className="stat-info">
        <div className="stat-val" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function HealthBar({ label, pct, color }) {
  return (
    <div className="health-item">
      <div className="health-label-row">
        <span>{label}</span>
        <span className="health-pct" style={{ color }}>{pct}%</span>
      </div>
      <div className="health-bar-bg">
        <div className="health-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function DashSkeleton() {
  return (
    <div>
      <div style={{ height: 36, width: 260, marginBottom: 8 }} className="skeleton" />
      <div style={{ height: 16, width: 340, marginBottom: 24 }} className="skeleton" />
      <div className="stats-strip">
        {[1,2,3,4].map((i) => <div key={i} className="skeleton" style={{ height: 90 }} />)}
      </div>
      <div className="charts-row" style={{ marginTop: 16 }}>
        {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 320 }} />)}
      </div>
    </div>
  );
}
