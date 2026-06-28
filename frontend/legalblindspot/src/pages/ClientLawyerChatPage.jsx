import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Briefcase, MapPin, IndianRupee, Clock, User } from 'lucide-react';
import CaseChat from '../components/shared/CaseChat';
import Spinner from '../components/shared/Spinner';
import EmptyState from '../components/shared/EmptyState';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import LawyerLayout, { StatusBadge, formatRequestDate } from '../components/lawyer/LawyerLayout';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ClientLawyerChatPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const detail = await api.getCaseRequest(requestId);
      setCaseData(detail);
    } catch (err) {
      alert(err.message);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [requestId]);

  if (loading) {
    return (
      <div className="client-chat-page">
        <div className="chat-loading">
          <Spinner size={40} />
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="client-chat-page">
        <EmptyState 
          icon={<MessageCircle size={40} />} 
          heading="Case not found" 
          message="The case request you're looking for doesn't exist or you don't have access to it." 
        />
      </div>
    );
  }

  const lawyer = caseData.lawyer || {};
  const client = caseData.client || {};

  return (
    <div className="client-chat-page">
      <header className="client-chat-header glass-panel">
        <button 
          type="button" 
          className="back-btn" 
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div className="case-info">
          <div className="case-title">
            <Briefcase size={18} />
            <span>{caseData.caseType || 'Legal Consultation'}</span>
          </div>
          <div className="case-meta">
            <span><MapPin size={14} /> {caseData.city}</span>
            <span><IndianRupee size={14} /> {caseData.budgetInr}</span>
            <StatusBadge status={caseData.caseStatus} />
          </div>
        </div>

        {lawyer.name && (
          <div className="lawyer-info">
            <div className="lawyer-avatar">
              <User size={20} />
            </div>
            <div className="lawyer-details">
              <span className="lawyer-name">{lawyer.name}</span>
              <span className="lawyer-role">Advocate</span>
            </div>
          </div>
        )}
      </header>

      <main className="client-chat-main">
        {caseData.caseStatus === 'Pending' ? (
          <EmptyState 
            icon={<MessageCircle size={48} />} 
            heading="Waiting for Lawyer Response" 
            message="Your consultation request is pending. Once a lawyer accepts your case, you can chat with them in real-time." 
          />
        ) : caseData.caseStatus === 'Rejected' ? (
          <EmptyState 
            icon={<MessageCircle size={48} />} 
            heading="Request Rejected" 
            message="This consultation request was rejected by the lawyer." 
          />
        ) : (
          <div className="chat-container">
            <CaseChat 
              requestId={requestId} 
              token={token} 
              currentUserId={user?.id} 
              currentRole="client" 
            />
          </div>
        )}
      </main>

      <style jsx>{`
        .client-chat-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
          display: flex;
          flex-direction: column;
        }

        .chat-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }

        .client-chat-header {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 16px 24px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: none;
          background: #f3f4f6;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: #e5e7eb;
        }

        .case-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .case-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .case-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 13px;
          color: #6b7280;
        }

        .case-meta span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .lawyer-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          color: white;
        }

        .lawyer-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
        }

        .lawyer-details {
          display: flex;
          flex-direction: column;
        }

        .lawyer-name {
          font-size: 14px;
          font-weight: 600;
        }

        .lawyer-role {
          font-size: 12px;
          opacity: 0.9;
        }

        .client-chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 24px;
          overflow: hidden;
        }

        .chat-container {
          flex: 1;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
          .client-chat-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .case-info {
            width: 100%;
          }

          .lawyer-info {
            width: 100%;
          }

          .client-chat-main {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
