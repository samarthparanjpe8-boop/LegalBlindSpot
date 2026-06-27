import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Badge from '../components/shared/Badge';

export default function LandingPage() {
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const tiers = [
    { name: 'Elite', score: '85–100', color: 'var(--trust-elite)' },
    { name: 'Trusted', score: '70–84', color: 'var(--trust-trusted)' },
    { name: 'Established', score: '50–69', color: 'var(--trust-established)' },
    { name: 'Unverified', score: '30–49', color: 'var(--trust-unverified)' },
    { name: 'Incomplete', score: '0–29', color: 'var(--trust-incomplete)' }
  ];

  return (
    <div className="landing-page">
      {/* ───── Cinematic Hero Zone ───── */}
      <div className="landing-hero-wrapper">
        {/* Background image layer — blurred & dimmed behind content */}
        <div className="hero-bg-layer" aria-hidden="true">
          <img
            src="/assets/hero-bg.png"
            alt=""
            className="hero-bg-image"
            loading="eager"
          />
        </div>
        {/* Dark overlay for text readability */}
        <div className="hero-overlay" aria-hidden="true"></div>

        <nav className="landing-nav">
          <div className="landing-logo">
            <span className="logo-icon">⚖</span>
            <span className="logo-text">LegalLink</span>
            <Badge variant="danger" size="sm">BETA</Badge>
          </div>
          <div className="nav-links-row">
            <a href="#features" className="nav-link-item">Features</a>
            <a href="#process" className="nav-link-item">How It Works</a>
            <a href="#trust" className="nav-link-item">Trust</a>
          </div>
          <Link to="/onboarding" className="nav-cta-btn">
            Get Started
          </Link>
        </nav>

        <header className="landing-hero">
          <h1 className="hero-headline">
            Legal Help Shouldn't<br />Require Connections
          </h1>
          <p className="hero-subheadline">
            Find verified advocates, assess your case, and understand your rights — for free, in plain language.
          </p>
          <div className="hero-actions">
            <Link to="/onboarding" className="hero-cta-btn">
              Start for Free
              <span className="btn-arrow">→</span>
            </Link>
          </div>
          <div className="hero-trust-row">
            <span className="trust-indicator">✓ Verified Advocates</span>
            <span className="trust-indicator-sep">·</span>
            <span className="trust-indicator">100% Free</span>
            <span className="trust-indicator-sep">·</span>
            <span className="trust-indicator">7 Cities</span>
            <span className="trust-indicator-sep">·</span>
            <span className="trust-indicator">English</span>
          </div>
        </header>
      </div>

      {/* ── Quick Feature Strip (visible before scroll) ── */}
      <div className="hero-feature-strip">
        {[
          { icon: '🔍', label: 'Find Lawyers' },
          { icon: '⚡', label: 'Case Assessment' },
          { icon: '✓', label: 'Verify Advice' },
          { icon: '📋', label: 'Document Checklist' },
          { icon: '🛡', label: 'Trust Scores' },
        ].map((f, i) => (
          <div className="strip-item" key={i}>
            <span className="strip-icon">{f.icon}</span>
            <span className="strip-label">{f.label}</span>
          </div>
        ))}
      </div>

      {/* ───── Light Content Zone ───── */}
      <div className="landing-content-wrapper">

        {/* Product Features */}
        <section id="features" className="landing-features">
          <div className="section-header-centered reveal-on-scroll">
            <span className="section-kicker">Capabilities</span>
            <h2 className="section-title-large">Designed to navigate the Indian legal system</h2>
          </div>
          <div className="features-grid">
            {[
              { icon: '🔍', title: 'Find the Right Lawyer', desc: 'Filter by city, case type, and budget. Every advocate has a verified trust score.' },
              { icon: '⚡', title: 'Know If Your Case Is Worth It', desc: 'Get an honest viability assessment before spending a rupee on legal fees.' },
              { icon: '✓', title: 'Verify Legal Advice', desc: 'Paste what your lawyer told you. We\'ll tell you if it checks out.' },
              { icon: '📋', title: 'Know What Documents You Need', desc: 'Case-specific document checklists so you\'re prepared before the first meeting.' },
              { icon: '🛡', title: 'Trust Scores for Every Advocate', desc: 'Transparent scoring based on verification, experience, ratings, and case history.' },
              { icon: '🗣', title: 'Speak Your Language', desc: 'Ask in Hindi, English, or Hinglish. LegalLink understands all three.' }
            ].map((f, i) => (
              <div className="feature-card reveal-on-scroll" key={i} style={{ animationDelay: `${i * 60}ms` }}>
                <span className="feature-icon">{f.icon}</span>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="process" className="landing-how-it-works">
          <div className="section-header-centered reveal-on-scroll">
            <span className="section-kicker">Process</span>
            <h2 className="section-title-large">How LegalLink Works</h2>
          </div>
          <div className="how-it-works-steps">
            {[
              { num: '01', title: 'Setup Your Session', desc: 'Select your city and set your legal budget so we can personalize matches.' },
              { num: '02', title: 'Discuss Your Situation', desc: 'Chat with our AI assistant in Hindi, English, or Hinglish to summarize your issue.' },
              { num: '03', title: 'Evaluate Case & Advice', desc: 'Assess case viability, download checklist documents, or check legal counsel advice.' },
              { num: '04', title: 'Connect with Advocates', desc: 'View ranked matching lawyers with transparent, verified trust breakdown scores.' }
            ].map((s, i) => (
              <div className="step-card reveal-on-scroll" key={i} style={{ animationDelay: `${i * 80}ms` }}>
                <span className="step-number">{s.num}</span>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust Score Explainer */}
        <section id="trust" className="landing-trust-explainer reveal-on-scroll">
          <div className="section-header-centered">
            <span className="section-kicker">Accountability</span>
            <h2 className="explainer-title">Transparent Advocate Trust Scores</h2>
          </div>
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

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <span className="logo-icon">⚖</span>
              <span className="logo-text" style={{ color: '#333' }}>LegalLink</span>
            </div>
            <p className="footer-warning">
              LegalLink is for informational purposes only and not a substitute for formal legal advice.
            </p>
            <div className="footer-bottom-row">
              <p className="footer-credits">
                Built for Binge N Build 2026 Hackathon &nbsp;·&nbsp; The Codebreakers Club
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
