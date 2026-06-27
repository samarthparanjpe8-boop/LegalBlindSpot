import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const MagicLinkHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying your magic link...');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('No token found in magic link. Please request a new link.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await axios.post('/api/auth/verify', { token });
        const jwtToken = res.data.jwt;
        localStorage.setItem('token', jwtToken);

        const payload = JSON.parse(atob(jwtToken.split('.')[1]));
        setStatus('Success! Logging you in...');
        setTimeout(() => {
          if (payload.role === 'lawyer') {
            navigate('/lawyer');
          } else {
            navigate('/dashboard');
          }
        }, 1000);
      } catch (err) {
        console.error('Magic link verification failed:', err);
        setError(err.response?.data?.error || 'Verification failed. The link may have expired.');
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div className="auth-container" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '20px'
    }}>
      <div className="auth-card" style={{
        background: 'var(--bg-secondary)',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '24px' }}>Authenticating</h2>
        {error ? (
          <div>
            <div style={{ color: '#ff4a4a', marginBottom: '24px' }}>{error}</div>
            <a href="/login" style={{
              background: 'var(--accent)',
              color: '#000',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600'
            }}>Go to Login</a>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{
              margin: '0 auto 24px auto',
              width: '40px',
              height: '40px',
              borderColor: 'var(--accent) transparent transparent transparent'
            }} />
            <p>{status}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MagicLinkHandler;
