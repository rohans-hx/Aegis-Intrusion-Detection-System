import { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const SEV_COLORS    = { Low: '#10b981', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' };
const ATTACK_COLORS = ['#3b82f6', '#8b5cf6', '#22d3ee', '#f59e0b', '#10b981', '#f97316', '#ef4444', '#ec4899'];

export default function Analytics() {
  const [data, setData]     = useState(null);
  const [days, setDays]     = useState(7);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoad(true);
      try {
        const { data: res } = await api.get(`/analytics?days=${days}`);
        setData(res.data);
      } catch { /* silent */ } finally { setLoad(false); }
    };
    fetch();
  }, [days]);

  if (loading) return <AnalyticsSkeleton />;

  const trendData = data?.timelineTrend?.map((d) => ({
    date: `${d._id.month}/${d._id.day}`,
    total: d.total, critical: d.critical, high: d.high, medium: d.medium, low: d.low,
  })) || [];

  const attackData  = data?.attackTypeBreakdown?.map((a) => ({ name: a._id, count: a.count, score: Math.round(a.avgThreatScore) })) || [];
  const statusData  = data?.statusDistribution?.map((s) => ({ name: s._id, value: s.count })) || [];
  const topIPs      = data?.topSourceIPs || [];

  const radarData = attackData.map((a) => ({ attack: a.name, score: a.score }));

  const statusColors = { Open: '#3b82f6', Investigating: '#f59e0b', Resolved: '#10b981', 'False Positive': '#64748b' };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Threat <span className="grad-text">Analytics</span></h1>
          <p className="page-sub">Deep-dive intelligence and trend analysis</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {[7, 14, 30].map((d) => (
            <button key={d} className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setDays(d)}>
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Avg threat score */}
      <div className="card" style={{ marginBottom: '1.25rem', background: 'linear-gradient(135deg, rgba(59,130,246,.08), rgba(139,92,246,.08))', borderColor: 'rgba(59,130,246,.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem' }}>📊</div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>
              {Math.round(data?.avgThreatScore || 0)}
              <span style={{ fontSize: '.9rem', color: '#94a3b8', fontWeight: 400 }}> / 100</span>
            </div>
            <div style={{ fontSize: '.85rem', color: '#94a3b8' }}>Average Threat Score (last {days} days)</div>
          </div>
        </div>
      </div>

      {/* Row 1: Trend + Radar */}
      <div className="charts-row-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Alert Timeline</span></div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="aTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 13 }} />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="url(#aTotal)" strokeWidth={2} />
              <Area type="monotone" dataKey="critical" stroke="#ef4444" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Threat Score by Attack</span></div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="attack" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fill: '#475569', fontSize: 10 }} />
              <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Attack types bar + Status pie */}
      <div className="charts-row-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Attacks by Type</span></div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={attackData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 13 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {attackData.map((_, i) => <Cell key={i} fill={ATTACK_COLORS[i % ATTACK_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Status Distribution</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={4}>
                {statusData.map((s) => <Cell key={s.name} fill={statusColors[s.name] || '#64748b'} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '.85rem', flexWrap: 'wrap' }}>
            {statusData.map((s) => (
              <span key={s.name} style={{ fontSize: '.72rem', color: statusColors[s.name], display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColors[s.name], display: 'inline-block' }} />
                {s.name} ({s.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Top IPs table */}
      <div className="card">
        <div className="card-header"><span className="card-title">Top Attacking IPs</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>IP Address</th><th>Country</th><th>Attack Count</th><th>Threat Level</th></tr></thead>
            <tbody>
              {topIPs.map((ip, i) => (
                <tr key={ip._id}>
                  <td className="mono">{i + 1}</td>
                  <td className="mono">{ip._id}</td>
                  <td>{ip.country || 'Unknown'}</td>
                  <td style={{ fontWeight: 600 }}>{ip.count}</td>
                  <td>
                    <div className="score-bar">
                      <span className="score-num" style={{ color: ip.count > 10 ? '#ef4444' : ip.count > 5 ? '#f97316' : '#f59e0b' }}>{ip.count}</span>
                      <div className="score-track"><div className="score-fill" style={{ width: `${Math.min(ip.count * 8, 100)}%`, background: ip.count > 10 ? '#ef4444' : '#f97316' }} /></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div>
      <div style={{ height: 36, width: 260, marginBottom: 8 }} className="skeleton" />
      <div style={{ height: 16, width: 340, marginBottom: 24 }} className="skeleton" />
      <div className="skeleton" style={{ height: 80, marginBottom: 16 }} />
      <div className="charts-row-2">{[1,2].map((i) => <div key={i} className="skeleton" style={{ height: 320 }} />)}</div>
    </div>
  );
}
