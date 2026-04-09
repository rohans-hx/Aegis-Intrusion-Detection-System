import { useState, useEffect } from 'react';
import { useThreatIntel } from '../hooks/useThreatIntel';
import { HiShieldCheck, HiExclamationTriangle, HiXCircle, HiQuestion markCircle } from 'react-icons/hi2';

const reputationConfig = {
  malicious: { icon: HiXCircle, color: '#ef4444', bg: 'rgba(239,68,68,.15)', label: 'Malicious' },
  suspicious: { icon: HiExclamationTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,.15)', label: 'Suspicious' },
  clean: { icon: HiShieldCheck, color: '#10b981', bg: 'rgba(16,185,129,.15)', label: 'Clean' },
};

export default function ThreatIntelBadge({ ip, showDetails = false }) {
  const { lookupIP, loading } = useThreatIntel();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (ip) {
      lookupIP(ip).then(setData);
    }
  }, [ip, lookupIP]);

  if (loading) {
    return (
      <span className="threat-badge loading">
        <span className="spinner" style={{ width: 12, height: 12 }} />
        Checking...
      </span>
    );
  }

  if (!data) return null;

  const config = reputationConfig[data.reputation] || reputationConfig.clean;
  const Icon = config.icon;

  return (
    <div className="threat-intel-wrapper">
      <span 
        className="threat-badge" 
        style={{ background: config.bg, color: config.color }}
      >
        <Icon size={14} />
        {config.label}
        {data.score > 0 && <span className="threat-score">({data.score}%)</span>}
      </span>
      
      {showDetails && data.reputation !== 'clean' && (
        <div className="threat-details">
          {data.country && <span className="detail-item">🌍 {data.country}</span>}
          {data.isp && <span className="detail-item">🏢 {data.isp}</span>}
          {data.threatTypes?.length > 0 && (
            <span className="detail-item">⚠️ {data.threatTypes.join(', ')}</span>
          )}
        </div>
      )}
    </div>
  );
}