import { useState } from 'react';
import {
  Users,
  Inbox,
  Briefcase,
  CheckCircle,
  Clock,
  MapPin,
  IndianRupee,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../shared/Spinner';
import EmptyState from '../shared/EmptyState';
import { StatusBadge, formatRequestDate } from './LawyerLayout';
import { formatCurrency } from '../../utils/formatters';
import * as api from '../../services/api';

export default function PendingRequestsPanel({ requests, loading, onRefresh }) {
  const [processingId, setProcessingId] = useState(null);
  const [declineId, setDeclineId] = useState(null);
  const [declineReason, setDeclineReason] = useState('');

  const handleDecision = async (id, decision, reason) => {
    setProcessingId(id);
    try {
      await api.decideCaseRequest(id, decision, reason);
      onRefresh();
      setDeclineId(null);
      setDeclineReason('');
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="tab-loading"><Spinner size={32} /></div>;
  }

  if (!requests.length) {
    return (
      <EmptyState
        icon={<Inbox size={40} />}
        heading="No pending requests"
        message="New client consultation requests will appear here."
      />
    );
  }

  return (
    <div className="tab-section">
      <h2 className="tab-section-title">
        <Inbox size={22} className="tab-title-icon" />
        Pending Requests
      </h2>
      <div className="lawyer-request-list">
        {requests.map((req, idx) => (
          <div key={req._id} className="lawyer-request-card glass-card" style={{ animationDelay: `${idx * 60}ms` }}>
            <div className="lawyer-request-header">
              <div className="lawyer-request-client">
                <User size={18} />
                <div>
                  <h3>{req.client?.name || 'Client'}</h3>
                  <span className="lawyer-request-meta">
                    {req.clientGender || req.client?.gender || '--'} · {req.city}
                  </span>
                </div>
              </div>
              <StatusBadge status={req.status} />
            </div>

            <div className="lawyer-request-tags">
              <span className="lawyer-tag"><Briefcase size={12} /> {req.caseType}</span>
              <span className="lawyer-tag"><MapPin size={12} /> {req.city}</span>
              {req.budgetInr != null && (
                <span className="lawyer-tag"><IndianRupee size={12} /> {formatCurrency(req.budgetInr)}</span>
              )}
              <span className="lawyer-tag"><Clock size={12} /> {formatRequestDate(req.createdAt)}</span>
            </div>

            <div className="lawyer-request-summary">
              <h4>AI Case Summary</h4>
              <p>{req.aiSummary || req.description}</p>
            </div>

            {declineId === req._id ? (
              <div className="lawyer-decline-form">
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Optional decline reason..."
                  rows={2}
                  className="consult-textarea"
                />
                <div className="lawyer-request-actions">
                  <button
                    type="button"
                    className="lawyer-btn-decline"
                    disabled={processingId === req._id}
                    onClick={() => handleDecision(req._id, 'decline', declineReason)}
                  >
                    Confirm Decline
                  </button>
                  <button type="button" className="lawyer-btn-secondary" onClick={() => setDeclineId(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="lawyer-request-actions">
                <button
                  type="button"
                  className="lawyer-btn-accept"
                  disabled={processingId === req._id}
                  onClick={() => handleDecision(req._id, 'accept')}
                >
                  <CheckCircle size={16} /> Accept
                </button>
                <button
                  type="button"
                  className="lawyer-btn-decline"
                  disabled={processingId === req._id}
                  onClick={() => setDeclineId(req._id)}
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActiveClientsPanel({ clients, loading, onRefresh }) {
  const navigate = useNavigate();
  const [completingId, setCompletingId] = useState(null);

  const handleComplete = async (id) => {
    if (!confirm('Mark this case as complete?')) return;
    setCompletingId(id);
    try {
      await api.completeCase(id);
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return <div className="tab-loading"><Spinner size={32} /></div>;
  }

  if (!clients.length) {
    return (
      <EmptyState
        icon={<Users size={40} />}
        heading="No active clients"
        message="Accepted clients will appear here."
      />
    );
  }

  return (
    <div className="tab-section">
      <h2 className="tab-section-title">
        <Users size={22} className="tab-title-icon" />
        Active Clients
      </h2>
      <div className="lawyer-client-grid">
        {clients.map((client, idx) => (
          <div key={client._id} className="lawyer-client-card glass-card" style={{ animationDelay: `${idx * 60}ms` }}>
            <div className="lawyer-client-header">
              <h3>{client.client?.name || 'Client'}</h3>
              <StatusBadge status={client.caseStatus} />
            </div>
            <div className="lawyer-client-details">
              <div><span>Gender</span><strong>{client.clientGender || client.client?.gender || '--'}</strong></div>
              <div><span>City</span><strong>{client.city}</strong></div>
              <div><span>Budget</span><strong>{formatCurrency(client.budgetInr)}</strong></div>
              <div><span>Case Type</span><strong>{client.caseType}</strong></div>
              <div><span>Started</span><strong>{formatRequestDate(client.startedDate || client.acceptedAt)}</strong></div>
            </div>
            <div className="lawyer-client-actions">
              <button type="button" className="lawyer-btn-primary" onClick={() => navigate(`/lawyer/clients/${client._id}`)}>
                Open Case
              </button>
              <button
                type="button"
                className="lawyer-btn-secondary"
                disabled={completingId === client._id}
                onClick={() => handleComplete(client._id)}
              >
                Mark Complete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
