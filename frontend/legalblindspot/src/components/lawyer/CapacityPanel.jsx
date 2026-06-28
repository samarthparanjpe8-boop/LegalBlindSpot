import { useState, useEffect } from 'react';
import { Users, Settings, Save } from 'lucide-react';
import Spinner from '../shared/Spinner';
import { StatusBadge, formatRequestDate } from './LawyerLayout';
import * as api from '../../services/api';

export default function CapacityPanel({ capacity, loading, onUpdate }) {
  const [maxClients, setMaxClients] = useState(capacity?.maxActiveClients ?? 15);
  const [accepting, setAccepting] = useState(capacity?.acceptingClients !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (capacity) {
      setMaxClients(capacity.maxActiveClients ?? 15);
      setAccepting(capacity.acceptingClients !== false);
    }
  }, [capacity]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.updateLawyerCapacity({
        maxActiveClients: Number(maxClients),
        acceptingClients: accepting,
      });
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="tab-loading"><Spinner size={32} /></div>;
  }

  const atCapacity = (capacity?.availableSlots ?? 0) <= 0;

  return (
    <div className="tab-section">
      <h2 className="tab-section-title">
        <Settings size={22} className="tab-title-icon" />
        Client Capacity
      </h2>

      <div className="lawyer-capacity-grid">
        <div className="lawyer-capacity-card glass-card">
          <Users size={24} className="tab-title-icon" />
          <span className="lawyer-capacity-value">{capacity?.currentClients ?? 0}</span>
          <span className="lawyer-capacity-label">Current Clients</span>
        </div>
        <div className="lawyer-capacity-card glass-card">
          <Settings size={24} className="tab-title-icon" />
          <span className="lawyer-capacity-value">{capacity?.maxActiveClients ?? 15}</span>
          <span className="lawyer-capacity-label">Maximum Clients</span>
        </div>
        <div className={`lawyer-capacity-card glass-card ${atCapacity ? 'lawyer-capacity-full' : ''}`}>
          <Users size={24} className="tab-title-icon" />
          <span className="lawyer-capacity-value">{capacity?.availableSlots ?? 0}</span>
          <span className="lawyer-capacity-label">Available Slots</span>
        </div>
      </div>

      {atCapacity && (
        <div className="lawyer-capacity-warning">
          Not Accepting New Clients — you have reached maximum capacity.
        </div>
      )}

      <form onSubmit={handleSave} className="lawyer-capacity-form glass-card">
        <h3>Configure Capacity</h3>
        {error && <div className="consult-error">{error}</div>}

        <div className="consult-field">
          <label className="session-row-label">Maximum Active Clients</label>
          <input
            type="number"
            min="1"
            max="100"
            value={maxClients}
            onChange={(e) => setMaxClients(e.target.value)}
            className="budget-input"
          />
        </div>

        <label className="lawyer-checkbox-label">
          <input
            type="checkbox"
            checked={accepting}
            onChange={(e) => setAccepting(e.target.checked)}
          />
          Accepting new client requests
        </label>

        <button type="submit" className="budget-submit-btn" disabled={saving}>
          {saving ? 'Saving...' : <><Save size={16} /> Save Settings</>}
        </button>
      </form>
    </div>
  );
}

export function OverviewPanel({ stats, loading }) {
  if (loading || !stats) {
    return <div className="tab-loading"><Spinner size={32} /></div>;
  }

  return (
    <div className="tab-section lawyer-overview-activity">
      <h2 className="tab-section-title">Recent Activity</h2>
      <div className="lawyer-activity-list">
        {stats.recentActivity?.length ? stats.recentActivity.map((item) => (
          <div key={item.id} className="lawyer-activity-item glass-card-sm">
            <div className="lawyer-activity-main">
              <strong>{item.clientName}</strong>
              <span>{item.caseType}</span>
            </div>
            <div className="lawyer-activity-meta">
              <StatusBadge status={item.status || item.requestStatus} />
              <span>{formatRequestDate(item.timestamp)}</span>
            </div>
          </div>
        )) : (
          <p className="lawyer-empty-text">No recent activity yet.</p>
        )}
      </div>
    </div>
  );
}
