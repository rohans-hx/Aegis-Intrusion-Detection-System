import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import 'leaflet/dist/leaflet.css';

// Dummy geo coords for source countries
const GEO_COORDS = {
  Russia:        [55.75, 37.62],
  China:         [39.91, 116.40],
  USA:           [38.90, -77.04],
  Germany:       [52.52, 13.40],
  Brazil:        [-15.79, -47.88],
  'North Korea': [39.02, 125.75],
  Iran:          [35.70, 51.42],
  India:         [28.61, 77.21],
  Ukraine:       [50.45, 30.52],
  Netherlands:   [52.37, 4.90],
  Unknown:       [0, 0],
};

const SEV_COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' };

export default function NetworkMap() {
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data } = await api.get('/alerts', { params: { limit: 100 } });
        setAlerts(data.data);
      } catch { /* silent */ } finally { setLoad(false); }
    };
    fetchAlerts();
  }, []);

  useEffect(() => {
    if (loading || mapInst.current) return;
    import('leaflet').then((L) => {
      const map = L.map(mapRef.current, {
        center: [30, 10],
        zoom: 2,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap | CartoDB',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Aggregate per country
      const countryMap = {};
      alerts.forEach((a) => {
        const c = a.sourceCountry || 'Unknown';
        if (!countryMap[c]) countryMap[c] = { count: 0, alerts: [], coords: GEO_COORDS[c] || [0, 0] };
        countryMap[c].count++;
        if (countryMap[c].alerts.length < 3) countryMap[c].alerts.push(a);
      });

      Object.entries(countryMap).forEach(([country, info]) => {
        if (!info.coords) return;
        const radius = Math.min(Math.max(info.count * 1.5, 6), 30);
        const color  = info.count > 15 ? '#ef4444' : info.count > 8 ? '#f97316' : info.count > 3 ? '#f59e0b' : '#3b82f6';

        const circle = L.circleMarker(info.coords, {
          radius, color, fillColor: color, fillOpacity: 0.35, weight: 2,
        }).addTo(map);

        const popup = `
          <div style="font-family:Inter,sans-serif;font-size:13px;min-width:190px;">
            <strong style="font-size:14px;">${country}</strong><br/>
            <span style="color:#94a3b8;">${info.count} attack${info.count > 1 ? 's' : ''}</span>
            <hr style="border:none;border-top:1px solid #334155;margin:6px 0"/>
            ${info.alerts.map((a) => `<div style="margin:3px 0;">
              <span style="color:${SEV_COLORS[a.severity]};font-weight:600;font-size:11px;">[${a.severity}]</span>
              ${a.attackType} · <code>${a.sourceIP}</code>
            </div>`).join('')}
          </div>
        `;
        circle.bindPopup(popup, { className: 'dark-popup' });

        // Pulse animation via CSS
        const el = circle.getElement?.();
        if (el) el.style.animation = 'pulseDot 2.5s infinite';
      });

      // Draw attack lines
      alerts.slice(0, 25).forEach((a) => {
        const src  = GEO_COORDS[a.sourceCountry] || GEO_COORDS.Unknown;
        const dest = [20.59, 78.96]; // target (India or generic)
        const line = L.polyline([src, dest], {
          color: SEV_COLORS[a.severity] || '#3b82f6',
          weight: 1, opacity: 0.3, dashArray: '4 6',
        }).addTo(map);
      });

      mapInst.current = map;
    });

    return () => {
      if (mapInst.current) {
        mapInst.current.remove();
        mapInst.current = null;
      }
    };
  }, [loading, alerts]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Network <span className="grad-text">Attack Map</span></h1>
        <p className="page-sub">Geographic visualization of threat origins</p>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 500, borderRadius: 14 }} />
      ) : (
        <div className="map-wrap" ref={mapRef} />
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', justifyContent: 'center' }}>
        {[
          { label: 'Low (1-3)', color: '#3b82f6' },
          { label: 'Medium (4-8)', color: '#f59e0b' },
          { label: 'High (9-15)', color: '#f97316' },
          { label: 'Heavy (15+)', color: '#ef4444' },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.78rem', color: '#94a3b8' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
