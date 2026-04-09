import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Signup() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('All fields are required');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.user, data.token);
      toast.success('Account created!');
      navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-outer">
      <div className="auth-left">
        <div className="auth-vis-grid" />
        <div className="auth-vis-content">
          <div className="auth-vis-icon">🛡️</div>
          <h2 className="auth-vis-heading grad-text">Join AEGIS</h2>
          <p className="auth-vis-text">
            Create your secure account to start monitoring network threats and responding to incidents.
          </p>
          <div className="auth-stat-chips">
            <div className="auth-chip"><span className="chip-dot" /> Role-based access control</div>
            <div className="auth-chip"><span className="chip-dot" /> Encrypted communications</div>
            <div className="auth-chip"><span className="chip-dot" /> SOC-ready dashboards</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-box">
          <div className="auth-logo">
            <div className="auth-logo-icon">🛡️</div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>
                <span className="grad-text">AEGIS</span> IDS
              </h2>
            </div>
          </div>

          <h1 className="auth-title">Create account</h1>
          <p className="auth-sub">Set up your AEGIS credentials to get started</p>

          <form onSubmit={submit}>
            <div className="auth-fields">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" name="name" placeholder="John Doe"
                  value={form.name} onChange={handle} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" name="email" placeholder="john@aegis.com"
                  value={form.email} onChange={handle} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" name="password" placeholder="Min 6 characters"
                  value={form.password} onChange={handle} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" name="role" value={form.role} onChange={handle}>
                  <option value="viewer">Viewer</option>
                  <option value="analyst">Analyst</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
