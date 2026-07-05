import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

/**
 * Public marketing homepage — what a prospective client OR an investor
 * sees at "/". Previously the root path just redirected straight to
 * /dashboard (which bounces to /login if not authenticated), so there was
 * no public-facing page explaining the product at all. This fixes that.
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/v1/public/billing/plans`)
      .then((res) => setPlans(res.data.plans || []))
      .catch(() => {}); // pricing section just hides gracefully if this fails
  }, []);

  return (
    <div style={S.root}>
      {/* ══ NAV ══════════════════════════════════════════════ */}
      <header style={S.nav}>
        <div style={S.navInner}>
          <div style={S.navLogo}>
            <div style={S.navLogoIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V21H15v-6H9v6H3V9.5Z" fill="#0c1b2e" />
              </svg>
            </div>
            <span style={S.navBrand}>PropertyPro</span>
          </div>
          <div style={S.navLinks}>
            <a href="#features" style={S.navLink}>Features</a>
            <a href="#pricing" style={S.navLink}>Pricing</a>
            <button onClick={() => navigate('/login')} style={S.navLoginBtn}>Log In</button>
          </div>
        </div>
      </header>

      {/* ══ HERO ═════════════════════════════════════════════ */}
      <section style={S.hero}>
        <div style={S.heroInner}>
          <span style={S.heroEyebrow}>For Real Estate Dealers &amp; Agencies</span>
          <h1 style={S.heroTitle}>
            Turn every property into an interactive,<br />lead-capturing experience
          </h1>
          <p style={S.heroSub}>
            Satellite views, nearby landmarks, a rent-vs-buy calculator, and
            automated WhatsApp follow-up — all on one shareable page per
            listing. Buyers self-qualify before you ever schedule a visit.
          </p>
          <div style={S.heroActions}>
            <button onClick={() => navigate('/request-access')} style={S.ctaPrimary}>
              Request Access
            </button>
            <a href="#features" style={S.ctaSecondary}>See how it works ↓</a>
          </div>
        </div>
      </section>

      {/* ══ PROBLEM / SOLUTION ══════════════════════════════ */}
      <section style={S.section}>
        <div style={S.sectionInner}>
          <div style={S.compareGrid}>
            <div style={S.compareCard}>
              <span style={S.compareLabel}>Today</span>
              <ul style={S.compareList}>
                <li>Buyers visit 8–10 properties before shortlisting one</li>
                <li>Dealers waste hours on unqualified site visits</li>
                <li>Follow-up happens whenever someone remembers to call</li>
                <li>No idea which listing links actually get shared or opened</li>
              </ul>
            </div>
            <div style={{ ...S.compareCard, ...S.compareCardHighlight }}>
              <span style={{ ...S.compareLabel, color: '#c8a96e' }}>With PropertyPro</span>
              <ul style={S.compareList}>
                <li>Buyers explore satellite view, street view &amp; nearby landmarks online first</li>
                <li>Only serious, pre-qualified buyers book a visit</li>
                <li>WhatsApp follow-up fires automatically within seconds</li>
                <li>Every visit, click, and lead is tracked per listing</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════ */}
      <section id="features" style={{ ...S.section, backgroundColor: '#f8fafd' }}>
        <div style={S.sectionInner}>
          <h2 style={S.sectionTitle}>Everything a listing needs, in one link</h2>
          <div style={S.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} style={S.featureCard}>
                <div style={S.featureIcon}>{f.icon}</div>
                <h3 style={S.featureTitle}>{f.title}</h3>
                <p style={S.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══════════════════════════════════════════ */}
      {plans.length > 0 && (
        <section id="pricing" style={S.section}>
          <div style={S.sectionInner}>
            <h2 style={S.sectionTitle}>Simple, transparent pricing</h2>
            <p style={S.sectionSub}>Cancel or change plans anytime.</p>
            <div style={S.pricingGrid}>
              {plans.map((p, i) => (
                <div key={p.key} style={{ ...S.priceCard, ...(i === 1 ? S.priceCardHighlight : {}) }}>
                  {i === 1 && <span style={S.popularBadge}>Most Popular</span>}
                  <h3 style={S.priceLabel}>{p.label}</h3>
                  <div style={S.priceAmount}>
                    ₹{p.priceINR.toLocaleString('en-IN')}
                    <span style={S.pricePeriod}>/month</span>
                  </div>
                  <ul style={S.priceFeatures}>
                    {p.features.map((f) => <li key={f}>✓ {f}</li>)}
                  </ul>
                  <button onClick={() => navigate('/request-access')} style={i === 1 ? S.priceBtnHighlight : S.priceBtn}>
                    Get Started
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ FINAL CTA ════════════════════════════════════════ */}
      <section style={S.finalCta}>
        <h2 style={S.finalCtaTitle}>Ready to sell smarter?</h2>
        <p style={S.finalCtaSub}>Get your first listing live in under 10 minutes.</p>
        <button onClick={() => navigate('/request-access')} style={S.ctaPrimary}>
          Request Access
        </button>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════ */}
      <footer style={S.footer}>
        <p style={S.footerTxt}>© {new Date().getFullYear()} PropertyPro · Powered by Wayne E Solutions</p>
      </footer>
    </div>
  );
}

const FEATURES = [
  { icon: '🛰', title: 'Satellite + Street View', desc: 'Auto-fetched imagery for every listing address — no manual uploads needed.' },
  { icon: '📍', title: 'Nearby Landmarks', desc: 'Schools, hospitals, markets, and transit with walk/drive times, pulled automatically.' },
  { icon: '💬', title: 'WhatsApp Automation', desc: 'Every buyer inquiry opens a tracked WhatsApp thread with automated first-touch replies.' },
  { icon: '🧮', title: 'Rent vs Buy Calculator', desc: 'A self-serve financial tool that keeps serious buyers engaged on your listing page.' },
  { icon: '🗺', title: 'Plot Boundary Tracing', desc: 'Draw and save exact plot boundaries so buyers see precisely what they\u2019re buying.' },
  { icon: '📊', title: 'Lead Scoring & Analytics', desc: 'Every visit and reply is scored so your team calls the hottest leads first.' },
];

const S = {
  root: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#0c1b2e', backgroundColor: '#fff' },

  nav: { borderBottom: '1px solid #eef2f7', position: 'sticky', top: 0, backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', zIndex: 50 },
  navInner: { maxWidth: '1100px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navLogo: { display: 'flex', alignItems: 'center', gap: '9px' },
  navLogoIcon: { width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#c8a96e', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  navBrand: { fontSize: '14px', fontWeight: '800', color: '#0c1b2e', letterSpacing: '1px', textTransform: 'uppercase' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '28px' },
  navLink: { fontSize: '14px', color: '#475569', fontWeight: '600', textDecoration: 'none' },
  navLoginBtn: { padding: '9px 20px', borderRadius: '8px', border: '1.5px solid #0c1b2e', background: '#fff', color: '#0c1b2e', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },

  hero: { background: 'linear-gradient(180deg, #0c1b2e 0%, #16273f 100%)', padding: '90px 24px 100px' },
  heroInner: { maxWidth: '760px', margin: '0 auto', textAlign: 'center' },
  heroEyebrow: { display: 'inline-block', color: '#c8a96e', fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '18px' },
  heroTitle: { fontSize: '40px', fontWeight: '900', color: '#fff', lineHeight: '1.25', margin: '0 0 20px' },
  heroSub: { fontSize: '16px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.7', maxWidth: '600px', margin: '0 auto 32px' },
  heroActions: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' },
  ctaPrimary: { padding: '15px 32px', borderRadius: '11px', border: 'none', background: 'linear-gradient(135deg, #c8a96e, #e8c98e)', color: '#0c1b2e', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(200,169,110,0.35)' },
  ctaSecondary: { color: '#fff', fontSize: '14px', fontWeight: '600', textDecoration: 'none', opacity: 0.8 },

  section: { padding: '80px 24px' },
  sectionInner: { maxWidth: '1100px', margin: '0 auto' },
  sectionTitle: { fontSize: '28px', fontWeight: '800', color: '#0c1b2e', textAlign: 'center', margin: '0 0 12px' },
  sectionSub: { fontSize: '15px', color: '#64748b', textAlign: 'center', margin: '0 0 48px' },

  compareGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  compareCard: { border: '1px solid #eef2f7', borderRadius: '16px', padding: '32px' },
  compareCardHighlight: { backgroundColor: '#0c1b2e', border: 'none' },
  compareLabel: { fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '16px' },
  compareList: { margin: 0, padding: '0 0 0 20px', color: 'inherit', fontSize: '14px', lineHeight: '2.2' },

  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  featureCard: { backgroundColor: '#fff', border: '1px solid #eef2f7', borderRadius: '16px', padding: '28px' },
  featureIcon: { fontSize: '28px', marginBottom: '14px' },
  featureTitle: { fontSize: '16px', fontWeight: '800', color: '#0c1b2e', margin: '0 0 8px' },
  featureDesc: { fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: 0 },

  pricingGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  priceCard: { border: '1px solid #eef2f7', borderRadius: '18px', padding: '32px 28px', position: 'relative', display: 'flex', flexDirection: 'column' },
  priceCardHighlight: { border: '2px solid #c8a96e', boxShadow: '0 12px 32px rgba(200,169,110,0.20)' },
  popularBadge: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#c8a96e', color: '#0c1b2e', fontSize: '11px', fontWeight: '800', padding: '4px 14px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  priceLabel: { fontSize: '15px', fontWeight: '700', color: '#64748b', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  priceAmount: { fontSize: '34px', fontWeight: '900', color: '#0c1b2e', marginBottom: '20px' },
  pricePeriod: { fontSize: '14px', fontWeight: '500', color: '#94a3b8' },
  priceFeatures: { listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#475569', flex: 1 },
  priceBtn: { padding: '12px', borderRadius: '10px', border: '1.5px solid #0c1b2e', background: '#fff', color: '#0c1b2e', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
  priceBtnHighlight: { padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #0c1b2e, #1a3558)', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },

  finalCta: { textAlign: 'center', padding: '90px 24px', backgroundColor: '#0c1b2e' },
  finalCtaTitle: { fontSize: '30px', fontWeight: '900', color: '#fff', margin: '0 0 10px' },
  finalCtaSub: { fontSize: '15px', color: 'rgba(255,255,255,0.6)', margin: '0 0 28px' },

  footer: { textAlign: 'center', padding: '28px', borderTop: '1px solid #eef2f7' },
  footerTxt: { fontSize: '12px', color: '#94a3b8', margin: 0 },
};
