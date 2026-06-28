import { useState } from 'react';
import { X, Send, Paperclip } from 'lucide-react';
import * as api from '../../services/api';
import Spinner from '../shared/Spinner';

export default function ConsultRequestModal({
  advocate,
  sessionId,
  caseType,
  city,
  budget,
  caseSummary,
  onClose,
  onSuccess,
}) {
  const [description, setDescription] = useState(caseSummary || '');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canRequest = advocate?.canReceiveRequests !== false && advocate?.lawyerUserId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canRequest) return;
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('advocateId', advocate.id || advocate._id);
      formData.append('lawyer', advocate.lawyerUserId);
      formData.append('caseType', caseType || 'General Legal Dispute');
      formData.append('city', city || advocate.city || 'Mumbai');
      formData.append('description', description);
      if (budget) formData.append('budgetInr', budget);
      if (sessionId) formData.append('sessionId', sessionId);
      files.forEach((file) => formData.append('attachments', file));

      await api.createCaseRequest(formData);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="budget-modal-overlay">
      <div className="budget-modal glass-panel consult-modal">
        <button type="button" className="budget-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <form onSubmit={handleSubmit} className="budget-modal-form">
          <div className="budget-modal-header">
            <h3 className="budget-modal-title">Request Consultation</h3>
            <p className="budget-modal-desc">
              Send a consultation request to {advocate.name}. They will review your case summary and respond.
            </p>
          </div>

          {!canRequest && (
            <div className="consult-unavailable">
              Not Accepting New Clients — this lawyer has reached capacity.
            </div>
          )}

          {error && <div className="consult-error">{error}</div>}

          <div className="consult-field">
            <label className="session-row-label">Case Summary</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
              className="consult-textarea"
              placeholder="Describe your legal issue..."
            />
          </div>

          <div className="consult-field">
            <label className="session-row-label">
              <Paperclip size={14} /> Attachments (optional)
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="consult-file-input"
            />
            {files.length > 0 && (
              <span className="consult-file-count">{files.length} file(s) selected</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !canRequest}
            className="budget-submit-btn"
          >
            {loading ? (
              <span className="consult-submit-loading"><Spinner size={16} /> Sending...</span>
            ) : (
              <>
                <Send size={16} /> Send Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
