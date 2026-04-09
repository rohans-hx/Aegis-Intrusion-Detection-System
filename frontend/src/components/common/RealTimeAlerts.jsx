import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';

function RealTimeAlertsInner() {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('new-alert', (alert) => {
      const severityIcons = {
        Critical: '🔴',
        High: '🟠',
        Medium: '🟡',
        Low: '🟢',
      };
      const icon = severityIcons[alert.severity] || '⚠️';
      
      toast.custom((t) => (
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>{icon}</span>
          <div>
            <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.875rem' }}>
              New {alert.severity} Alert
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
              {alert.attackType} from {alert.sourceIP}
            </div>
          </div>
        </div>
      ), {
        duration: 5000,
        position: 'top-left',
      });
    });

    socket.on('alert-updated', (alert) => {
      toast.success(`Alert marked as ${alert.status}`, {
        position: 'bottom-right',
        duration: 3000,
      });
    });

    return () => {
      socket.off('new-alert');
      socket.off('alert-updated');
    };
  }, [socket]);

  return null;
}

export default function RealTimeAlerts() {
  return <RealTimeAlertsInner />;
}