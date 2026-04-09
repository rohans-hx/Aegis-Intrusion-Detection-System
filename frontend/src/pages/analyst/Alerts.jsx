import { useState, useCallback, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const SEV         = ['Low', 'Medium', 'High', 'Critical'];
const TYPES       = ['Port Scan', 'SQL Injection', 'Brute Force', 'DDoS', 'Malware', 'XSS', 'MITM', 'Ransomware'];
const STATUS_LIST = ['Open', 'Investigating', 'Resolved', 'False Positive'];
const SEV_COLORS  = { Low: '#10b981', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' };
const STX_CLASS   = { Open: 'badge-open', Investigating: 'badge-investigating', Resolved: 'badge-resolved', 'False Positive': 'badge-fp' };

export default function Alerts() {
  const { user } = useAuth();
  const canAct   = user?.role === 'admin' || user?.role === 'analyst';

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoad]  = useState(true);
  const [total, setTotal]   = useState(0);
  const [pages, setPages]   = useState(1);
  const [page, setPage]     = useState(1);
  const [filters, setFilters] = useState({ severity: '', attackType: '', status: '', search: '' });

  const fetchAlerts = useCallback(async () => {
    try {
      const params = { page, limit: 15 };
      if (filters.severity)   params.severity   = filters.severity;
      if (filters.attackType) params.attackType = filters.attackType;
      if (filters.status)     params.status     = filters.status;
      if (filters.search)     params.search     = filters.search;
      const { data } = await api.get('/alerts', { params });
      setAlerts(data.data);
      setTotal(data.total);
      setPages(data.pages);
    } catch { /* silent */ } finally { setLoad(false); }
  }, [page, filters]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const changeStatus = async (id, status) => {
    try {
      await api.patch(`/alerts/${id}/status`, { status });
      toast.success(`Status → ${status}`);
      fetchAlerts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleFilter = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Alerts & <span className="grad-text">Logs</span></h1>
        <p className="page-sub">{total} total alerts detected</p>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <input className="filter-search" name="search" placeholder="Search IP, title, type…"
          value={filters.search} onChange={handleFilter} />
        <select className="filter-select" name="severity" value={filters.severity} onChange={handleFilter}>
          <option value="">All Severity</option>
          {SEV.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="filter-select" name="attackType" value={filters.attackType} onChange={handleFilter}>
          <option value="">All Types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="filter-select" name="status" value={filters.status} onChange={handleFilter}>
          <option value="">All Status</option>
          {STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th><th>Title</th><th>Source IP</th><th>Target</th>
                <th>Type</th><th>Severity</th><th>Score</th><th>Status</th>
                {canAct && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {alerts.length ? alerts.map((a) => (
                <tr key={a._id}>
                  <td className="mono">{new Date(a.createdAt).toLocaleString()}</td>
                  <td style={{ fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</td>
                  <td className="mono">{a.sourceIP}</td>
                  <td className="mono">{a.targetIP}:{a.targetPort}</td>
                  <td>{a.attackType}</td>
                  <td><span className={`badge badge-${a.severity.toLowerCase()}`}>{a.severity}</span></td>
                  <td>
                    <div className="score-bar">
                      <span className="score-num" style={{ color: scoreColor(a.threatScore) }}>{a.threatScore}</span>
                      <div className="score-track"><div className="score-fill" style={{ width: `${a.threatScore}%`, background: scoreColor(a.threatScore) }} /></div>
                    </div>
                  </td>
                  <td><span className={`badge ${STX_CLASS[a.status] || ''}`}>{a.status}</span></td>
                  {canAct && (
                    <td>
                      <select className="filter-select" value={a.status} onChange={(e) => changeStatus(a._id, e.target.value)}
                        style={{ padding: '.3rem .5rem', fontSize: '.76rem' }}>
                        {STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  )}
                </tr>
              )) : (
                <tr><td colSpan={canAct ? 9 : 8} className="empty-state">No alerts found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="page-btn" disabled={page >= pages} onClick={() => setPage(page + 1)}>›</button>
        </div>
      )}
    </div>
  );
}

function scoreColor(s) {
  if (s >= 80) return '#ef4444';
  if (s >= 60) return '#f97316';
  if (s >= 35) return '#f59e0b';
  return '#10b981';
}

function TableSkeleton() {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{['','','','','','','',''].map((_, i) => <th key={i}><div className="skeleton" style={{ height: 12, width: 60 }} /></th>)}</tr></thead>
        <tbody>{[1,2,3,4,5,6].map((r) => <tr key={r}>{[...Array(8)].map((_, c) => <td key={c}><div className="skeleton" style={{ height: 14 }} /></td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
