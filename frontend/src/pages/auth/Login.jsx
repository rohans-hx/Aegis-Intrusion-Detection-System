import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('All fields required');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}`);
      navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-outer">
      {/* Left panel — decorative */}
      <div className="auth-left">
        <div className="auth-vis-grid" />
        <div className="auth-vis-content">
          <div className="auth-vis-icon">🛡️</div>
          <h2 className="auth-vis-heading grad-text">AEGIS IDS</h2>
          <p className="auth-vis-text">
            Advanced Guard &amp; Intrusion Detection System.<br />
            Monitor, detect, and respond to cyber threats in real time.
          </p>
          <div className="auth-stat-chips">
            <div className="auth-chip"><span className="chip-dot" /> Real-time threat detection</div>
            <div className="auth-chip"><span className="chip-dot" /> 8 attack vector coverage</div>
            <div className="auth-chip"><span className="chip-dot" /> ML-powered anomaly analysis</div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
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

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to access the threat monitoring dashboard</p>

          <form onSubmit={submit}>
            <div className="auth-fields">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  id="login-email"
                  className="form-input"
                  type="email" name="email" placeholder="analyst@aegis.com"
                  value={form.email} onChange={handle} autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  id="login-password"
                  className="form-input"
                  type="password" name="password" placeholder="••••••••"
                  value={form.password} onChange={handle}
                />
              </div>
            </div>
            <button id="login-submit" className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account? <Link to="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
