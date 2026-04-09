import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    systemName: 'AEGIS IDS',
    retentionDays: 30,
    alertThreshold: 10,
    emailNotifications: true,
    autoBlock: false,
    logLevel: 'info',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">System <span className="grad-text">Settings</span></h1>
          <p className="page-sub">Configure system preferences and behavior</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-section">
          <h3 className="section-title">General</h3>
          <div className="form-group">
            <label className="form-label">System Name</label>
            <input
              className="form-input"
              type="text"
              value={settings.systemName}
              onChange={(e) => handleChange('systemName', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Log Retention (days)</label>
            <input
              className="form-input"
              type="number"
              min="1"
              max="365"
              value={settings.retentionDays}
              onChange={(e) => handleChange('retentionDays', parseInt(e.target.value) || 30)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Log Level</label>
            <select
              className="form-input"
              value={settings.logLevel}
              onChange={(e) => handleChange('logLevel', e.target.value)}
            >
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-title">Alert Configuration</h3>
          <div className="form-group">
            <label className="form-label">Alert Threshold</label>
            <input
              className="form-input"
              type="number"
              min="1"
              max="100"
              value={settings.alertThreshold}
              onChange={(e) => handleChange('alertThreshold', parseInt(e.target.value) || 10)}
            />
            <small className="form-hint">Number of alerts before triggering high-priority notification</small>
          </div>
          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.autoBlock}
                onChange={(e) => handleChange('autoBlock', e.target.checked)}
              />
              <span className="toggle-switch"></span>
              Enable Auto-Block
            </label>
            <small className="form-hint">Automatically block suspicious IPs after threshold</small>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-title">Notifications</h3>
          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleChange('emailNotifications', e.target.checked)}
              />
              <span className="toggle-switch"></span>
              Email Notifications
            </label>
            <small className="form-hint">Receive email alerts for critical security events</small>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-title">System Info</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Version</span>
              <span className="info-value">1.0.0</span>
            </div>
            <div className="info-item">
              <span className="info-label">Environment</span>
              <span className="info-value">Production</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Updated</span>
              <span className="info-value">{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-footer">
        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}