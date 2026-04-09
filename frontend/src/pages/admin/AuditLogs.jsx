import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';

const ACTION_COLORS = {
  LOGIN: '#10b981', LOGOUT: '#64748b', LOGIN_FAILED: '#ef4444',
  REGISTER: '#3b82f6', CREATE_USER: '#8b5cf6', UPDATE_USER: '#f59e0b',
  DELETE_USER: '#ef4444', SIMULATE_ATTACK: '#f97316',
  CREATE_RULE: '#22d3ee', UPDATE_RULE: '#f59e0b', ENABLE_RULE: '#10b981',
  DISABLE_RULE: '#64748b', SYSTEM_INIT: '#3b82f6',
};

export default function AuditLogs() {
  const [logs, setLogs]     = useState([]);
  const [loading, setLoad]  = useState(true);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);
  const [filter, setFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      const params = { page, limit: 25 };
      if (filter) params.action = filter;
      const { data } = await api.get('/logs', { params });
      setLogs(data.data);
      setTotal(data.total);
      setPages(data.pages);
    } catch { /* silent */ } finally { setLoad(false); }
  }, [page, filter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const actions = [...new Set(Object.keys(ACTION_COLORS))];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Audit <span className="grad-text">Logs</span></h1>
        <p className="page-sub">{total} audit entries recorded</p>
      </div>

      <div className="filters-row">
        <select className="filter-select" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          {actions.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? <TableSkeleton /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Resource</th><th>Details</th><th>IP Address</th><th>Status</th></tr></thead>
            <tbody>
              {logs.length ? logs.map((l) => (
                <tr key={l._id}>
                  <td className="mono">{new Date(l.createdAt).toLocaleString()}</td>
                  <td style={{ fontWeight: 500 }}>{l.userName || '—'}</td>
                  <td>
                    <span style={{
                      background: `${ACTION_COLORS[l.action] || '#64748b'}18`,
                      color: ACTION_COLORS[l.action] || '#64748b',
                      padding: '.15rem .5rem', borderRadius: 6, fontSize: '.72rem', fontWeight: 600,
                    }}>
                      {l.action?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="mono">{l.resource}</td>
                  <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '.82rem', color: '#94a3b8' }}>
                    {l.details || '—'}
                  </td>
                  <td className="mono">{l.ipAddress}</td>
                  <td>
                    <span className={`badge ${l.success ? 'badge-resolved' : 'badge-critical'}`}>
                      {l.success ? 'OK' : 'FAIL'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="empty-state">No logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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

function TableSkeleton() {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{['','','','','','',''].map((_, i) => <th key={i}><div className="skeleton" style={{ height: 12, width: 60 }} /></th>)}</tr></thead>
        <tbody>{[1,2,3,4,5,6].map((r) => <tr key={r}>{[...Array(7)].map((_, c) => <td key={c}><div className="skeleton" style={{ height: 14 }} /></td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
