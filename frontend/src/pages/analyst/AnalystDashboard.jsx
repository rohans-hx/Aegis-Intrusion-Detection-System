import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { usePolling } from '../../hooks/usePolling';
import { useWidgets } from '../../context/WidgetContext';
import {
  HiOutlineShieldExclamation, HiOutlineExclamationTriangle,
  HiOutlineCheckCircle, HiOutlineBolt, HiOutlineCpuChip,
  HiOutlineArrowPath, HiOutlineChartBar,
} from 'react-icons/hi2';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from 'recharts';
import WidgetCustomizer from '../../components/common/WidgetCustomizer';

const SEV_COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' };

export default function AnalystDashboard() {
  const navigate = useNavigate();
  const { widgets } = useWidgets();
  const [stats, setStats] = useState(null);
  const [analytics, setAna] = useState(null);
  const [loading, setLoad] = useState(true);
  const [showCustomizer, setShowCustomizer] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([
        api.get('/alerts/stats'),
        api.get('/analytics?days=7'),
      ]);
      setStats(s.data.data);
      setAna(a.data.data);
    } catch { /* silent */ } finally { setLoad(false); }
  }, []);

  usePolling(fetchAll, 10000);

  if (loading) return <DashSkeleton />;

  const sevData = stats?.bySeverity?.map((s) => ({ name: s._id, value: s.count })) || [];
  const trendData = analytics?.timelineTrend?.map((d) => ({
    date: `${d._id.month}/${d._id.day}`,
    total: d.total, critical: d.critical, high: d.high,
  })) || [];
  const attackData = stats?.byAttackType?.slice(0, 5).map((a) => ({ name: a._id, count: a.count })) || [];
  const topSources = stats?.recentAlerts?.slice(0, 5).reduce((acc, a) => {
    acc[a.sourceIP] = (acc[a.sourceIP] || 0) + 1;
    return acc;
  }, {});

  const topSourcesData = Object.entries(topSources || {}).map(([ip, count]) => ({ ip, count })).sort((a, b) => b.count - a.count).slice(0, 5);

  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case 'stats':
        return (
          <div className="stats-strip" key="stats">
            <StatCard icon={<HiOutlineShieldExclamation />} bg="rgba(59,130,246,.12)" color="var(--blue)"
              value={stats?.totalAlerts ?? 0} label="Total Alerts" />
            <StatCard icon={<HiOutlineBolt />} bg="rgba(239,68,68,.12)" color="var(--red)"
              value={stats?.openAlerts ?? 0} label="Open Threats" />
            <StatCard icon={<HiOutlineExclamationTriangle />} bg="rgba(249,115,22,.12)" color="var(--orange)"
              value={stats?.criticalAlerts ?? 0} label="Critical" />
            <StatCard icon={<HiOutlineCheckCircle />} bg="rgba(16,185,129,.12)" color="var(--emerald)"
              value={stats?.resolvedToday ?? 0} label="Resolved Today" />
          </div>
        );

      case 'liveFeed':
        return (
          <div className="card" key="liveFeed">
            <div className="card-header">
              <span className="card-title">Recent Alerts</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/alerts')}>View All</button>
            </div>
            <div className="live-feed">
              {stats?.recentAlerts?.length ? stats.recentAlerts.map((a) => (
                <div key={a._id} className={`feed-item ${a.severity}`}>
                  <div className="feed-dot" style={{ background: SEV_COLORS[a.severity] }} />
                  <div>
                    <div className="feed-title">{a.title}</div>
                    <div className="feed-meta">{a.sourceIP} → {a.targetIP} · {a.attackType} · {new Date(a.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>
              )) : <div className="empty-state"><div className="empty-icon">📡</div>No recent alerts</div>}
            </div>
          </div>
        );

      case 'severityChart':
        return (
          <div className="card" key="severityChart">
            <div className="card-header"><span className="card-title">Severity Breakdown</span></div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={sevData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4}>
                  {sevData.map((s) => <Cell key={s.name} fill={SEV_COLORS[s.name] || '#64748b'} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: 4 }}>
              {sevData.map((s) => (
                <span key={s.name} style={{ fontSize: '.72rem', color: SEV_COLORS[s.name], display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: SEV_COLORS[s.name], display: 'inline-block' }} />
                  {s.name} ({s.value})
                </span>
              ))}
            </div>
          </div>
        );

      case 'attackTypeChart':
        return (
          <div className="card" key="attackTypeChart">
            <div className="card-header"><span className="card-title">Top Attack Types</span></div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={attackData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'topSources':
        return (
          <div className="card" key="topSources">
            <div className="card-header"><span className="card-title">Top Source IPs</span></div>
            <div className="top-sources-list">
              {topSourcesData.length ? topSourcesData.map((s, i) => (
                <div key={s.ip} className="top-source-item">
                  <span className="source-rank">#{i + 1}</span>
                  <span className="source-ip mono">{s.ip}</span>
                  <span className="source-count">{s.count} alerts</span>
                </div>
              )) : <div className="empty-state">No data</div>}
            </div>
          </div>
        );

      case 'systemHealth':
        return (
          <div className="card" key="systemHealth">
            <div className="card-header"><span className="card-title">System Health</span></div>
            <div className="health-row">
              <HealthBar label="API Server" pct={98} color="var(--emerald)" />
              <HealthBar label="Database" pct={95} color="var(--emerald)" />
              <HealthBar label="Detection Engine" pct={100} color="var(--emerald)" />
              <HealthBar label="Memory Usage" pct={62} color="var(--blue)" />
              <HealthBar label="CPU Load" pct={35} color="var(--emerald)" />
            </div>
          </div>
        );

      case 'attackSimulator':
        return (
          <div className="card" key="attackSimulator">
            <div className="card-header">
              <span className="card-title">Attack Simulator</span>
            </div>
            <div className="attack-grid">
              {['SQL Injection', 'XSS', 'DDoS', 'Brute Force'].map((type) => (
                <button key={type} className="attack-btn" onClick={() => simulate(type)}>
                  ⚔️ {type}
                </button>
              ))}
            </div>
          </div>
        );

      case 'recentLogs':
        return (
          <div className="card" key="recentLogs">
            <div className="card-header">
              <span className="card-title">Recent Logs</span>
            </div>
            <div className="recent-logs-list">
              {analytics?.recentLogs?.length ? analytics.recentLogs.map((log, i) => (
                <div key={i} className="log-item">
                  <span className="log-action">{log.action}</span>
                  <span className="log-details">{log.details}</span>
                </div>
              )) : <div className="empty-state">No logs available</div>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const simulate = async (type) => {
    try {
      await api.post('/alerts/simulate', { attackType: type });
      toast.success(`${type} attack simulated`);
    } catch (e) { toast.error('Simulation failed'); }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Threat <span className="grad-text">Overview</span></h1>
          <p className="page-sub">Network security intelligence at a glance</p>
        </div>
        <button className="btn btn-ghost" onClick={() => setShowCustomizer(true)}>
          <HiOutlineCpuChip size={16} /> Customize
        </button>
      </div>

      <div className="dashboard-widgets">
        {widgets.map(renderWidget)}
      </div>

      <WidgetCustomizer isOpen={showCustomizer} onClose={() => setShowCustomizer(false)} />
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
      <div className="charts-row-2" style={{ marginTop: 16 }}>
        {[1,2].map((i) => <div key={i} className="skeleton" style={{ height: 310 }} />)}
      </div>
    </div>
  );
}