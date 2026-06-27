import { Link } from 'react-router-dom';
import Badge from '../components/shared/Badge';
import './LandingPage.css';

export default function LandingPage() {
  const tiers = [
    { name: 'Elite', score: '85-100', color: 'var(--trust-elite)' },
    { name: 'Trusted', score: '70-84', color: 'var(--trust-trusted)' },
    { name: 'Established', score: '50-69', color: 'var(--trust-established)' },
    { name: 'Unverified', score: '30-49', color: 'var(--trust-unverified)' },
    { name: 'Incomplete', score: '0-29', color: 'var(--trust-incomplete)' }
  ];

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-logo">
          <span className="logo-icon">⚖</span>
          <span className="logo-text">LegalLink</span>
          <Badge variant="danger" size="sm">BETA</Badge>
        </div>
        <Link to="/onboarding" className="nav-cta-btn">
          Get Started
        </Link>
      </nav>

      <header className="landing-hero">
        <h1 className="hero-headline">Legal Help Shouldn't Require Connections</h1>
        <p className="hero-subheadline">
          Find verified advocates, assess your case, and understand your rights — for free, in plain language.
        </p>
        <Link to="/onboarding" className="hero-cta-btn">
          Start for Free →
        </Link>
        <span className="hero-meta">
          No sign up required  •  100% free  •  Available in 7 cities
        </span>
      </header>

      <section className="landing-features">
        <div className="features-grid">
          <div className="feature-card">
            <h4>Find the Right Lawyer</h4>
            <p>Filter by city, case type, and budget. Every advocate has a verified trust score.</p>
          </div>
          <div className="feature-card">
            <h4>Know If Your Case Is Worth It</h4>
            <p>Get an honest viability assessment before spending a rupee on legal fees.</p>
          </div>
          <div className="feature-card">
            <h4>Verify Legal Advice</h4>
            <p>Paste what your lawyer told you. We'll tell you if it checks out.</p>
          </div>
          <div className="feature-card">
            <h4>Know What Documents You Need</h4>
            <p>Case-specific document checklists so you're prepared before the first meeting.</p>
          </div>
          <div className="feature-card">
            <h4>Trust Scores for Every Advocate</h4>
            <p>Transparent scoring based on verification, experience, ratings, and case history.</p>
          </div>
          <div className="feature-card">
            <h4>Speak Your Language</h4>
            <p>Ask in Hindi, English, or Hinglish. LegalLink understands all three.</p>
          </div>
        </div>
      </section>

      <section className="landing-trust-explainer">
        <h2 className="explainer-title">How Trust Scores Work</h2>
        <div className="explainer-tiers-row">
          {tiers.map((tier) => (
            <div key={tier.name} className="explainer-tier-badge" style={{ '--tier-color': tier.color }}>
              <span className="tier-dot"></span>
              <span className="tier-name">{tier.name}</span>
              <span className="tier-score">({tier.score})</span>
            </div>
          ))}
        </div>
        <p className="explainer-text">
          Scores are calculated from verification status, experience, ratings, review count, profile completeness, court level, and case history. Never paid for. Never gamed.
        </p>
      </section>

      <footer className="landing-footer">
        <p className="footer-warning">
          LegalLink is for informational purposes only and not a substitute for formal legal advice.
        </p>
        <p className="footer-credits">
          Built for Binge N Build 2026 Hackathon  •  The Codebreakers Club
        </p>
      </footer>
    </div>
  );
}
