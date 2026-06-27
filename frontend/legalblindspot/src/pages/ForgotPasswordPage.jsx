import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Something went wrong');
      setMessage(data.message || 'If that email exists, we sent a password reset link.');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

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
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Link to="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          fontSize: '0.85rem',
          marginBottom: '24px',
          alignSelf: 'flex-start',
          transition: 'color 0.2s',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }} className="back-link">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
          <span className="logo-icon" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>⚖</span>
          <span className="logo-text" style={{ fontSize: '1.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>LegalLink</span>
        </div>

        <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px', textAlign: 'center', fontSize: '2rem', fontFamily: 'var(--font-serif)' }}>Reset Password</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem', textAlign: 'center', fontWeight: '300' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {message && (
          <div style={{ color: 'var(--success)', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center' }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--accent)',
              color: 'var(--text-primary)',
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '10px',
              transition: 'var(--transition)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
            onMouseEnter={(e) => e.target.style.background = 'var(--accent-hover)'}
            onMouseLeave={(e) => e.target.style.background = 'var(--accent)'}
          >
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>
        </form>
        <p style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Back to{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
