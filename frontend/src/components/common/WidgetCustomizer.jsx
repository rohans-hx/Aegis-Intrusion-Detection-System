import { useState } from 'react';
import { useWidgets, AVAILABLE_WIDGETS } from '../../context/WidgetContext';
import { HiXMark, HiArrowPathRoundedSquare, HiCheck, HiBars3, HiPlus, HiMinus } from 'react-icons/hi2';

export default function WidgetCustomizer({ isOpen, onClose }) {
  const { widgets, toggleWidget, moveWidget, resetToDefault } = useWidgets();
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveWidget(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleReset = () => {
    const role = localStorage.getItem('userRole') || 'analyst';
    resetToDefault(role);
  };

  return (
    <>
      {isOpen && <div className="modal-backdrop" onClick={onClose} />}
      <div className={`widget-customizer ${isOpen ? 'open' : ''}`}>
        <div className="customizer-header">
          <h3>Customize Dashboard</h3>
          <div className="customizer-actions">
            <button className="btn btn-ghost btn-sm" onClick={handleReset}>
              <HiArrowPathRoundedSquare size={14} /> Reset
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              <HiXMark size={16} />
            </button>
          </div>
        </div>

        <div className="customizer-content">
          <p className="customizer-desc">
            Toggle widgets on/off and drag to reorder them on your dashboard.
          </p>

          <div className="widget-list">
            {AVAILABLE_WIDGETS.map((widget) => {
              const isActive = widgets.includes(widget.id);
              return (
                <div
                  key={widget.id}
                  className={`widget-item ${isActive ? 'active' : ''} ${draggedIndex !== null ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(widgets.indexOf(widget.id))}
                  onDragOver={(e) => handleDragOver(e, widgets.indexOf(widget.id))}
                  onDragEnd={handleDragEnd}
                >
                  <div className="drag-handle">
                    <HiBars3 size={16} />
                  </div>
                  <span className="widget-icon">{widget.icon}</span>
                  <span className="widget-name">{widget.name}</span>
                  <button
                    className={`toggle-btn ${isActive ? 'on' : 'off'}`}
                    onClick={() => toggleWidget(widget.id)}
                  >
                    {isActive ? <HiMinus size={14} /> : <HiPlus size={14} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}