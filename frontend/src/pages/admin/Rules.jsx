import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ATTACK_TYPES = ['Port Scan', 'SQL Injection', 'Brute Force', 'DDoS', 'Malware', 'XSS', 'MITM', 'Ransomware'];
const SEVS = ['Low', 'Medium', 'High', 'Critical'];

export default function Rules() {
  const [rules, setRules]   = useState([]);
  const [loading, setLoad]  = useState(true);
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState({ name: '', attackType: 'Port Scan', condition: '', threshold: 10, severity: 'Medium', description: '' });

  const fetchRules = useCallback(async () => {
    try {
      const { data } = await api.get('/rules');
      setRules(data.data);
    } catch { /* silent */ } finally { setLoad(false); }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const openAdd = () => { setForm({ name: '', attackType: 'Port Scan', condition: '', threshold: 10, severity: 'Medium', description: '' }); setModal('add'); };
  const openEdit = (r) => { setForm({ name: r.name, attackType: r.attackType, condition: r.condition, threshold: r.threshold, severity: r.severity, description: r.description || '' }); setModal(r); };
  const close = () => setModal(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await api.post('/rules', form);
        toast.success('Rule created');
      } else {
        await api.put(`/rules/${modal._id}`, form);
        toast.success('Rule updated');
      }
      close(); fetchRules();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const toggleRule = async (r) => {
    try {
      await api.patch(`/rules/${r._id}/toggle`);
      toast.success(r.enabled ? 'Rule disabled' : 'Rule enabled');
      fetchRules();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const deleteRule = async (r) => {
    if (!confirm(`Delete rule "${r.name}"?`)) return;
    try {
      await api.delete(`/rules/${r._id}`);
      toast.success('Rule deleted');
      fetchRules();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Detection <span className="grad-text">Rules</span></h1>
          <p className="page-sub">{rules.length} configured rules · {rules.filter((r) => r.enabled).length} active</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Rule</button>
      </div>

      {loading ? <TableSkeleton /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Attack Type</th><th>Severity</th><th>Condition</th><th>Threshold</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r._id} style={{ opacity: r.enabled ? 1 : 0.5 }}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td>{r.attackType}</td>
                  <td><span className={`badge badge-${r.severity.toLowerCase()}`}>{r.severity}</span></td>
                  <td className="mono" style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.condition}</td>
                  <td className="mono">{r.threshold}</td>
                  <td>
                    <label className="toggle">
                      <input type="checkbox" checked={r.enabled} onChange={() => toggleRule(r)} />
                      <span className="toggle-slider" />
                    </label>
                  </td>
                  <td style={{ display: 'flex', gap: '.35rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteRule(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal-box modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-hdr">
              <h3 className="modal-ttl">{modal === 'add' ? 'Create Rule' : 'Edit Rule'}</h3>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Rule Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Attack Type</label>
                    <select className="form-input" value={form.attackType} onChange={(e) => setForm({ ...form, attackType: e.target.value })}>
                      {ATTACK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Severity</label>
                    <select className="form-input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                      {SEVS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Condition</label>
                  <input className="form-input" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} required
                    placeholder="e.g., TCP connections > threshold in 60s" />
                </div>
                <div className="form-group">
                  <label className="form-label">Threshold</label>
                  <input className="form-input" type="number" min="1" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of what this rule detects" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={close}>Cancel</button>
                <button type="submit" className="btn btn-primary">{modal === 'add' ? 'Create Rule' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
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
        <tbody>{[1,2,3,4].map((r) => <tr key={r}>{[...Array(7)].map((_, c) => <td key={c}><div className="skeleton" style={{ height: 14 }} /></td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
