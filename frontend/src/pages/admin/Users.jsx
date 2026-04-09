import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ROLES   = ['admin', 'analyst', 'viewer'];
const R_CLASS = { admin: 'role-admin', analyst: 'role-analyst', viewer: 'role-viewer' };

export default function Users() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoad]  = useState(true);
  const [modal, setModal]   = useState(null); // null | 'add' | user obj
  const [form, setForm]     = useState({ name: '', email: '', password: '', role: 'viewer' });

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.data);
    } catch { /* silent */ } finally { setLoad(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openAdd = () => { setForm({ name: '', email: '', password: '', role: 'viewer' }); setModal('add'); };
  const openEdit = (u) => { setForm({ name: u.name, email: u.email, password: '', role: u.role }); setModal(u); };
  const close = () => setModal(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await api.post('/users', form);
        toast.success('User created');
      } else {
        const body = { name: form.name, role: form.role };
        await api.put(`/users/${modal._id}`, body);
        toast.success('User updated');
      }
      close(); fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const toggleActive = async (u) => {
    try {
      await api.put(`/users/${u._id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? 'User disabled' : 'User enabled');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const deleteUser = async (u) => {
    if (!confirm(`Delete user "${u.name}"?`)) return;
    try {
      await api.delete(`/users/${u._id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">User <span className="grad-text">Management</span></h1>
          <p className="page-sub">{users.length} registered users</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add User</button>
      </div>

      {loading ? <TableSkeleton /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td className="mono">{u.email}</td>
                  <td><span className={`role-pill ${R_CLASS[u.role]}`}>{u.role}</span></td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-resolved' : 'badge-fp'}`}>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="mono">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '—'}</td>
                  <td style={{ display: 'flex', gap: '.35rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(u)}>
                      {u.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-hdr">
              <h3 className="modal-ttl">{modal === 'add' ? 'Create User' : 'Edit User'}</h3>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                {modal === 'add' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={close}>Cancel</button>
                <button type="submit" className="btn btn-primary">{modal === 'add' ? 'Create' : 'Save Changes'}</button>
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
        <thead><tr>{['','','','','',''].map((_, i) => <th key={i}><div className="skeleton" style={{ height: 12, width: 60 }} /></th>)}</tr></thead>
        <tbody>{[1,2,3,4].map((r) => <tr key={r}>{[...Array(6)].map((_, c) => <td key={c}><div className="skeleton" style={{ height: 14 }} /></td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
