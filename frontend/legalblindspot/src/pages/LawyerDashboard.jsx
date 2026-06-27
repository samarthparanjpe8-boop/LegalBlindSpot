import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LawyerDashboard = () => {
  const { logout, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/requests/lawyer`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch case requests');
      setRequests(data.data !== undefined ? data.data : data || []);
    } catch (err) {
      setError('Failed to fetch case requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDecision = async (id, decision) => {
    try {
      const res = await fetch(`${BASE_URL}/api/requests/${id}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ decision })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${decision} the case request.`);
      // Refresh list
      fetchRequests();
    } catch (err) {
      alert(err.message);
      console.error(err);
    }
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent)' }}>LegalLink</span>
          <span style={{
            fontSize: '0.8rem',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '4px 10px',
            borderRadius: '12px',
            color: 'var(--text-secondary)'
          }}>Lawyer Portal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Logged in as: {user?.email}</span>
          <button
            onClick={logout}
            style={{
              background: 'rgba(255, 74, 74, 0.1)',
              color: '#ff4a4a',
              border: '1px solid rgba(255, 74, 74, 0.2)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxW: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ marginBottom: '32px', fontSize: '2rem' }}>Incoming Case Requests</h1>
        {loading && <p>Loading requests...</p>}
        {error && <p style={{ color: '#ff4a4a' }}>{error}</p>}
        {!loading && requests.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px dashed rgba(255, 255, 255, 0.15)'
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No case requests received yet.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {requests.map((req) => (
            <div key={req._id} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '24px',
              transition: 'transform 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Top Row: Case Type & Status badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent)' }}>{req.caseType}</span>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  background: req.status === 'pending' ? 'rgba(255, 165, 0, 0.15)' : req.status === 'accepted' ? 'rgba(74, 255, 132, 0.15)' : 'rgba(255, 74, 74, 0.15)',
                  color: req.status === 'pending' ? 'orange' : req.status === 'accepted' ? '#4aff84' : '#ff4a4a'
                }}>
                  {req.status}
                </span>
              </div>

              {/* Body */}
              <div>
                <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{req.description}</p>
              </div>

              {/* Details grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary)',
                fontSize: '0.95rem'
              }}>
                <div><strong>Client Email:</strong> {req.client?.email || 'N/A'}</div>
                <div><strong>Location:</strong> {req.city}</div>
                <div><strong>Estimated Budget:</strong> {req.budgetInr ? `₹${req.budgetInr.toLocaleString()}` : 'Not Specified'}</div>
              </div>

              {/* Attachments if any */}
              {req.attachments && req.attachments.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Attachments:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {req.attachments.map((file, idx) => (
                      <a
                        key={idx}
                        href={`${BASE_URL}/uploads/${file.filename}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          color: 'var(--accent)',
                          textDecoration: 'none',
                          fontSize: '0.85rem'
                        }}
                      >
                        📄 {file.filename || `Attachment ${idx + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision Buttons */}
              {req.status === 'pending' && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleDecision(req._id, 'accept')}
                    style={{
                      background: 'var(--accent)',
                      color: '#000',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Accept Case
                  </button>
                  <button
                    onClick={() => handleDecision(req._id, 'decline')}
                    style={{
                      background: 'rgba(255, 74, 74, 0.1)',
                      color: '#ff4a4a',
                      border: '1px solid rgba(255, 74, 74, 0.2)',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Decline Case
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default LawyerDashboard;
