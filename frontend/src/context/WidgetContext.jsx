import { createContext, useContext, useState, useEffect } from 'react';

const WidgetContext = createContext(null);

export const AVAILABLE_WIDGETS = [
  { id: 'stats', name: 'Stats Overview', icon: '📊' },
  { id: 'liveFeed', name: 'Live Alert Feed', icon: '🔔' },
  { id: 'severityChart', name: 'Severity Distribution', icon: '📈' },
  { id: 'attackTypeChart', name: 'Attack Types', icon: '🎯' },
  { id: 'topSources', name: 'Top Source IPs', icon: '🌐' },
  { id: 'systemHealth', name: 'System Health', icon: '💚' },
  { id: 'attackSimulator', name: 'Attack Simulator', icon: '⚔️' },
  { id: 'recentLogs', name: 'Recent Logs', icon: '📋' },
];

const DEFAULT_LAYOUT = {
  admin: ['stats', 'liveFeed', 'severityChart', 'attackTypeChart', 'topSources', 'systemHealth', 'attackSimulator', 'recentLogs'],
  analyst: ['stats', 'liveFeed', 'severityChart', 'attackTypeChart', 'topSources', 'systemHealth'],
  viewer: ['stats', 'liveFeed', 'severityChart'],
};

export const WidgetProvider = ({ children }) => {
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('dashboard-widgets');
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch {
        setWidgets(DEFAULT_LAYOUT.analyst);
      }
    } else {
      setWidgets(DEFAULT_LAYOUT.analyst);
    }
    setLoading(false);
  }, []);

  const updateWidgets = (newWidgets) => {
    setWidgets(newWidgets);
    localStorage.setItem('dashboard-widgets', JSON.stringify(newWidgets));
  };

  const resetToDefault = (role = 'analyst') => {
    const defaultWidgets = DEFAULT_LAYOUT[role] || DEFAULT_LAYOUT.analyst;
    updateWidgets(defaultWidgets);
  };

  const toggleWidget = (widgetId) => {
    if (widgets.includes(widgetId)) {
      updateWidgets(widgets.filter(w => w !== widgetId));
    } else {
      updateWidgets([...widgets, widgetId]);
    }
  };

  const moveWidget = (fromIndex, toIndex) => {
    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(fromIndex, 1);
    newWidgets.splice(toIndex, 0, removed);
    updateWidgets(newWidgets);
  };

  return (
    <WidgetContext.Provider value={{
      widgets,
      loading,
      updateWidgets,
      resetToDefault,
      toggleWidget,
      moveWidget,
    }}>
      {children}
    </WidgetContext.Provider>
  );
};

export const useWidgets = () => useContext(WidgetContext);