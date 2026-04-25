import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/* ─── Responsive hook ─────────────────────────────────────────────────────── */
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const BG     = '#0f1a14'
const BG2    = '#111d16'
const ACCENT = '#1D9E75'
const ACCENTL = '#5DCAA5'
const BORDER = 'rgba(255,255,255,0.08)'
const TEXT   = '#e8ede9'
const MUTED  = '#7a9488'

const S = {
  /* Layout */
  page: { background: BG, color: TEXT, fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', overflowX: 'hidden', fontSize: '1.1rem', lineHeight: 1.7 },

  /* Navbar */
  nav: { position: 'sticky', top: 0, zIndex: 100, background: BG, borderBottom: `1px solid ${BORDER}`, padding: '0 2rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navLogo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  navDot: { width: 10, height: 10, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 8px ${ACCENT}` },
  navBrand: { fontSize: 17, fontWeight: 600, color: '#fff', letterSpacing: '-0.3px' },
  navLinks: { display: 'flex', alignItems: 'center', gap: 8 },
  navLink: { color: MUTED, fontSize: 14, fontWeight: 400, cursor: 'pointer', padding: '6px 12px', background: 'none', border: 'none', textDecoration: 'none', transition: 'color 0.15s' },
  btnGhost: { color: TEXT, fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '8px 18px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, transition: 'border-color 0.15s' },
  btnGreen: { color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '8px 20px', background: ACCENT, border: 'none', borderRadius: 8, transition: 'opacity 0.15s' },

  /* Hero */
  hero: { position: 'relative', padding: '80px 2rem', maxWidth: 1200, margin: '0 auto', textAlign: 'center', overflow: 'hidden' },
  glow: { position: 'absolute', top: -100, right: -120, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, rgba(29,158,117,0.15) 0%, transparent 70%)`, pointerEvents: 'none' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(29,158,117,0.12)', border: `1px solid rgba(29,158,117,0.3)`, borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 500, color: ACCENTL, marginBottom: 32 },
  badgeDot: { width: 6, height: 6, borderRadius: '50%', background: ACCENT },
  headline: { fontFamily: "'Playfair Display', serif", fontSize: '3.5rem', fontWeight: 700, color: '#fff', lineHeight: 1.15, letterSpacing: '-1px', marginBottom: 16 },
  arabicSub: { fontSize: 18, color: ACCENTL, direction: 'rtl', fontFamily: "'Noto Kufi Arabic', sans-serif", marginBottom: 20, opacity: 0.85 },
  subtext: { fontSize: '1.1rem', color: MUTED, lineHeight: 1.7, maxWidth: 520, margin: '0 auto 40px' },
  heroBtns: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 },
  btnHeroPrimary: { background: ACCENT, color: '#fff', border: 'none', borderRadius: 10, padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' },
  btnHeroGhost: { background: 'transparent', color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 28px', fontSize: 15, fontWeight: 500, cursor: 'pointer', transition: 'border-color 0.15s' },
  statsBar: { display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap', borderTop: `1px solid ${BORDER}`, paddingTop: 32 },
  statItem: { textAlign: 'center' },
  statVal: { fontSize: 18, fontWeight: 600, color: ACCENTL },
  statLabel: { fontSize: 12, color: MUTED, marginTop: 2 },

  /* Section common */
  section: { padding: '80px 2rem', maxWidth: 1200, margin: '0 auto' },
  sectionTitle: { fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 8 },
  sectionAr: { fontSize: 15, color: ACCENTL, direction: 'rtl', fontFamily: "'Noto Kufi Arabic', sans-serif", textAlign: 'center', marginBottom: 48, opacity: 0.75 },

  /* Features */
  featuresWrap: { background: BG2 },
  featGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 },
  featCard: { background: '#162118', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '28px 24px', transition: 'border-color 0.2s' },
  featIcon: { fontSize: 28, marginBottom: 14 },
  featTitle: { fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 8 },
  featDesc: { fontSize: 13, color: MUTED, lineHeight: 1.65 },

  /* Pricing */
  pricingGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'stretch' },
  priceCard: { background: '#162118', border: `1px solid ${BORDER}`, borderRadius: 16, padding: '32px 28px', display: 'flex', flexDirection: 'column' },
  priceCardHL: { background: '#162118', border: `1.5px solid ${ACCENT}`, borderRadius: 16, padding: '32px 28px', display: 'flex', flexDirection: 'column', boxShadow: `0 0 40px rgba(29,158,117,0.12)` },
  planBadge: { display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, marginBottom: 20 },
  planName: { fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 },
  planPrice: { fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 4 },
  planPer: { fontSize: 12, color: MUTED, marginBottom: 24 },
  planFeatures: { listStyle: 'none', padding: 0, margin: '0 0 32px', flex: 1 },
  planFeature: { fontSize: 13, color: MUTED, padding: '6px 0', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8 },
  planCheck: { color: ACCENT, fontWeight: 700, flexShrink: 0 },
  btnPlanGhost: { background: 'transparent', color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%', marginTop: 'auto' },
  btnPlanGreen: { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: 'auto' },

  /* CTA */
  ctaWrap: { background: `linear-gradient(135deg, #122118 0%, #0f1a14 100%)`, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` },
  ctaInner: { padding: '80px 2rem', textAlign: 'center', maxWidth: 680, margin: '0 auto' },
  ctaTitle: { fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: 16, lineHeight: 1.3 },
  ctaBtn: { background: ACCENT, color: '#fff', border: 'none', borderRadius: 10, padding: '14px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 32, transition: 'opacity 0.15s' },

  /* Footer */
  footer: { background: BG, borderTop: `1px solid ${BORDER}`, padding: '24px 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  footerL: { fontSize: 12, color: MUTED },
  footerR: { display: 'flex', gap: 20 },
  footerLink: { fontSize: 12, color: MUTED, cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'none' },
}

/* ─── Mobile overrides ───────────────────────────────────────────────────── */
function mobileS(isMobile) {
  if (!isMobile) return {}
  return {
    headline: { ...S.headline, fontSize: 34 },
    featGrid: { ...S.featGrid, gridTemplateColumns: '1fr' },
    pricingGrid: { ...S.pricingGrid, gridTemplateColumns: '1fr' },
    hero: { ...S.hero, padding: '72px 1.25rem 56px' },
    section: { ...S.section, padding: '56px 1.25rem' },
    statsBar: { ...S.statsBar, gap: 24 },
    navLinks: { ...S.navLinks, gap: 4 },
    footer: { ...S.footer, flexDirection: 'column', textAlign: 'center' },
  }
}

/* ─── SVG Moroccan hex pattern (decorative) ─────────────────────────────── */
const HexPattern = () => (
  <svg width="320" height="320" viewBox="0 0 320 320" fill="none"
    style={{ position: 'absolute', top: 0, right: -40, opacity: 0.07, pointerEvents: 'none' }}>
    {[
      [80,46],[160,46],[240,46],
      [120,92],[200,92],
      [80,138],[160,138],[240,138],
      [120,184],[200,184],
      [80,230],[160,230],[240,230],
    ].map(([cx,cy],i) => (
      <polygon key={i}
        points={`${cx},${cy-36} ${cx+32},${cy-18} ${cx+32},${cy+18} ${cx},${cy+36} ${cx-32},${cy+18} ${cx-32},${cy-18}`}
        stroke="#1D9E75" strokeWidth="1.5" fill="none" />
    ))}
  </svg>
)

/* ─── Feature data ───────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: '📅', title: 'Gestion des événements',       desc: 'Mariages, henna, walima. Planifiez chaque journée avec ses menus, invités et équipes.' },
  { icon: '🧮', title: 'Calculateur de commande',       desc: 'Quantités exactes par table et par plat — zéro gaspillage, zéro manque.' },
  { icon: '🍯', title: 'Pâtisserie orientale',          desc: 'Recettes, coûts et marges pour chebakia, briouates, cornes de gazelle.' },
  { icon: '🫖', title: 'Art de la Table',               desc: 'Inventaire cérémonial. Évitez les doubles réservations de plateaux et nappes.' },
  { icon: '🏛', title: 'Conforme DGI',                  desc: 'ICE, IF, RC sur chaque facture. Documents valides pour votre comptable.' },
  { icon: '👥', title: 'Personnel Traditionnel',        desc: 'Negafa, Tiyaba, porteurs — coûts calculés automatiquement en un clic.' },
]

/* ─── Pricing data ───────────────────────────────────────────────────────── */
const PLANS = [
  {
    name: "L'Essentiel",
    fullPrice: 299,
    launchPrice: 199,
    badge: null,
    highlight: false,
    features: ['Plats & recettes', 'Gestion du stock', 'Art de la Table', 'Pâtisserie', 'Paramètres & devise'],
  },
  {
    name: 'Le Croissance',
    fullPrice: 499,
    launchPrice: 399,
    badge: { label: 'Le plus populaire', bg: 'rgba(29,158,117,0.18)', color: ACCENTL },
    highlight: true,
    features: ['Tout l\'Essentiel +', 'Événements & calculateur', 'Devis & paiements', 'Personnel & Negafa', 'Liste de courses'],
  },
  {
    name: "L'Élite",
    fullPrice: 699,
    launchPrice: 599,
    badge: { label: 'Pour les pros', bg: 'rgba(124,58,237,0.18)', color: '#c4b5fd' },
    highlight: false,
    features: ['Tout le Croissance +', 'Comptabilité complète', 'Factures DGI (ICE/IF/RC)', 'Rapports & export', 'Support prioritaire'],
  },
]

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function LandingPagePublic() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const ms = mobileS(isMobile)

  function scrollToPricing() {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={S.page}>

      {/* ── NAVBAR ── */}
      <nav style={{ ...S.nav, padding: isMobile ? '0 1.25rem' : '0 2rem' }}>
        <div style={S.navLogo}>
          <div style={S.navDot} />
          <span style={S.navBrand}>Traiteur Pro</span>
        </div>
        <div style={ms.navLinks || S.navLinks}>
          {!isMobile && (
            <button style={S.navLink} onClick={scrollToPricing}>Tarifs</button>
          )}
          <button style={S.btnGhost} onClick={() => navigate('/login')}>Connexion</button>
          <button style={S.btnGreen} onClick={() => navigate('/register')}>Essai gratuit</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ position: 'relative' }}>
        <div style={{ ...S.hero, ...(ms.hero || {}) }}>
          <HexPattern />
          <div style={S.glow} />

          <div style={S.badge}>
            <span style={S.badgeDot} />
            Logiciel traiteur · Maroc
          </div>

          <h1 style={ms.headline || S.headline}>
            De la commande<br />
            à la facture<br />
            tout en un
          </h1>

          <p style={S.subtext}>
            Fini les fichiers Excel et les erreurs de commande.<br />
            Gérez vos événements, votre équipe et vos finances.
          </p>

          <div style={S.heroBtns}>
            <button style={S.btnHeroPrimary}
              onClick={() => navigate('/register')}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Commencer gratuitement
            </button>
            <button style={S.btnHeroGhost}
              onClick={scrollToPricing}
              onMouseEnter={e => e.currentTarget.style.borderColor = ACCENTL}
              onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
              Voir les tarifs →
            </button>
          </div>

          <div style={ms.statsBar || S.statsBar}>
            {[
              { val: '+10h', label: 'économisées / semaine' },
              { val: '100%', label: 'conforme TVA & ICE' },
              { val: '1 clic', label: 'devis → facture' },
            ].map(s => (
              <div key={s.label} style={S.statItem}>
                <div style={S.statVal}>{s.val}</div>
                <div style={S.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={S.featuresWrap}>
        <div style={ms.section || S.section}>
          <h2 style={S.sectionTitle}>Tout ce dont vous avez besoin</h2>
          <div style={ms.featGrid || S.featGrid}>
            {FEATURES.map(f => (
              <div key={f.title} style={S.featCard}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(29,158,117,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
                <div style={S.featIcon}>{f.icon}</div>
                <div style={S.featTitle}>{f.title}</div>
                <div style={S.featDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRICING ── */}
      <div id="pricing">
        <div style={ms.section || S.section}>
          <h2 style={S.sectionTitle}>Choisissez votre plan</h2>
          <div style={ms.pricingGrid || S.pricingGrid}>
            {PLANS.map(plan => (
              <div key={plan.name} style={plan.highlight ? S.priceCardHL : S.priceCard}>
                {plan.badge && (
                  <span style={{ ...S.planBadge, background: plan.badge.bg, color: plan.badge.color }}>
                    {plan.badge.label}
                  </span>
                )}
                {!plan.badge && <div style={{ height: 29, marginBottom: 20 }} />}
                <div style={S.planName}>{plan.name}</div>
                <div style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: 14 }}>{plan.fullPrice} MAD</div>
                <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{plan.launchPrice} <span style={{ fontSize: 16, fontWeight: 400, color: MUTED }}>MAD</span></div>
                <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 4, marginBottom: 4 }}>🏷️ Offre de lancement · -100 MAD</div>
                <div style={S.planPer}>par mois, par établissement</div>
                <ul style={S.planFeatures}>
                  {plan.features.map(f => (
                    <li key={f} style={S.planFeature}>
                      <span style={S.planCheck}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  style={plan.highlight ? S.btnPlanGreen : S.btnPlanGhost}
                  onClick={() => navigate('/register')}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  Commencer
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={S.ctaWrap}>
        <div style={S.ctaInner}>
          <h2 style={S.ctaTitle}>
            Rejoignez les traiteurs marocains<br />
            qui gèrent leur activité comme des pros.
          </h2>
          <p style={{ fontSize: 14, color: MUTED, marginTop: 12 }}>
            Aucune carte bancaire requise · Accès immédiat · Support en français et arabe
          </p>
          <button style={S.ctaBtn}
            onClick={() => navigate('/register')}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            Essai gratuit 14 jours · sans carte bancaire
          </button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={ms.footer || S.footer}>
        <span style={S.footerL}>Traiteur Pro © 2026 — Moorish Automation</span>
        <div style={S.footerR}>
          <span style={S.footerLink}>Mentions légales</span>
          <span style={S.footerLink}>Contact</span>
        </div>
      </footer>

    </div>
  )
}
