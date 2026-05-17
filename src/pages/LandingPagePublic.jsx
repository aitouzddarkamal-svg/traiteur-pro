import { useState, useEffect, useId } from 'react'
import { useNavigate } from 'react-router-dom'

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap'

const BG     = '#FAF7F2'
const BG_ALT = '#F0E6D3'
const BURG   = '#6B2737'
const BURG_D = '#4A1A24'
const GOLD   = '#D4A853'
const GOLD_L = '#E8C97A'
const DARK   = '#1A1A1A'
const MUTED  = '#8A7060'
const WHITE  = '#FFFFFF'
const BRD    = 'rgba(107,39,55,0.12)'

/* ── Responsive hook ── */
function useIsMobile() {
  const [m, setM] = useState(typeof window !== 'undefined' && window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return m
}

/* ── Zellij SVG Pattern ── */
function ZellijBg({ opacity = 0.08, color1 = BURG, color2 = GOLD }) {
  const uid = useId().replace(/:/g, 'z')
  const star = '40,6 45,27 64,16 53,35 74,40 53,45 64,64 45,53 40,74 35,53 16,64 27,45 6,40 27,35 16,16 35,27'
  const diamond = '40,18 62,40 40,62 18,40'
  return (
    <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
      <defs>
        <pattern id={uid} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <polygon points={star} fill="none" stroke={color1} strokeWidth="1.2" opacity={opacity} />
          <polygon points={diamond} fill="none" stroke={color2} strokeWidth="0.9" opacity={opacity * 0.85} />
          <circle cx="40" cy="40" r="2" fill={color2} opacity={opacity * 0.5} />
          <line x1="0" y1="40" x2="6" y2="40" stroke={color1} strokeWidth="1" opacity={opacity} />
          <line x1="74" y1="40" x2="80" y2="40" stroke={color1} strokeWidth="1" opacity={opacity} />
          <line x1="40" y1="0" x2="40" y2="6" stroke={color1} strokeWidth="1" opacity={opacity} />
          <line x1="40" y1="74" x2="40" y2="80" stroke={color1} strokeWidth="1" opacity={opacity} />
          <line x1="0" y1="0" x2="16" y2="16" stroke={color2} strokeWidth="0.7" opacity={opacity * 0.6} />
          <line x1="80" y1="0" x2="64" y2="16" stroke={color2} strokeWidth="0.7" opacity={opacity * 0.6} />
          <line x1="0" y1="80" x2="16" y2="64" stroke={color2} strokeWidth="0.7" opacity={opacity * 0.6} />
          <line x1="80" y1="80" x2="64" y2="64" stroke={color2} strokeWidth="0.7" opacity={opacity * 0.6} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${uid})`} />
    </svg>
  )
}

/* ── Gold ornamental divider ── */
function GoldDivider({ color = GOLD }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', margin: '18px auto 30px' }}>
      <div style={{ flex: 1, maxWidth: 56, height: 1, background: `linear-gradient(to right, transparent, ${color})` }} />
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <polygon points="11,1 13,8 20,8 14.5,12.5 16.5,19.5 11,15 5.5,19.5 7.5,12.5 2,8 9,8" fill={color} />
      </svg>
      <div style={{ flex: 1, maxWidth: 56, height: 1, background: `linear-gradient(to left, transparent, ${color})` }} />
    </div>
  )
}

/* ── Section eyebrow label ── */
function Eye({ children, light = false }) {
  const c = light ? 'rgba(212,168,83,0.9)' : GOLD
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 10 }}>
      <div style={{ width: 22, height: 1, background: c }} />
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: c, fontFamily: "'DM Sans', sans-serif" }}>
        {children}
      </span>
      <div style={{ width: 22, height: 1, background: c }} />
    </div>
  )
}

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

/* ── Data ── */
const FEATURES = [
  { icon: '📅', title: 'Gestion des Événements',   desc: 'Mariages, henna, walima. Planifiez chaque journée avec ses menus, invités et équipes.' },
  { icon: '🧮', title: 'Calculateur de Commande',   desc: 'Quantités exactes par table et par plat — zéro gaspillage, zéro manque.' },
  { icon: '🍯', title: 'Pâtisserie Orientale',       desc: 'Recettes, coûts et marges pour chebakia, briouates, cornes de gazelle.' },
  { icon: '🫖', title: 'Art de la Table',             desc: 'Inventaire cérémonial. Évitez les doubles réservations de plateaux et nappes.' },
  { icon: '🏛',  title: 'Conforme DGI',               desc: 'ICE, IF, RC sur chaque facture. Documents valides pour votre comptable.' },
  { icon: '👥', title: 'Personnel Traditionnel',     desc: 'Negafa, Tiyaba, porteurs — coûts calculés automatiquement en un clic.' },
]

const WHY_US = [
  { num: '+10h',   label: 'économisées / semaine',   desc: 'Fini les fichiers Excel. Gérez tout depuis un seul tableau de bord intelligent.' },
  { num: '100%',   label: 'Conforme TVA & ICE',       desc: 'Factures aux normes DGI. Votre comptable sera ravi.' },
  { num: '1 clic', label: 'Devis → Facture',          desc: 'Convertissez un devis en facture officielle en quelques secondes.' },
]

const TESTIMONIALS = [
  { initials: 'FA', name: 'Fatima Alaoui',  city: 'Casablanca', quote: 'Traiteur Pro a transformé ma gestion. Je passe maintenant 3 fois moins de temps sur l\'administratif et plus de temps avec mes clients.' },
  { initials: 'AB', name: 'Ahmed Benali',   city: 'Marrakech',   quote: 'Le calculateur de commandes m\'a sauvé plusieurs fois. Plus aucune erreur sur les quantités pour les grands mariages.' },
  { initials: 'NC', name: 'Nadia Chraibi',  city: 'Fès',          quote: 'Les factures conformes DGI avec ICE et RC — enfin un logiciel qui comprend les besoins des traiteurs marocains.' },
]

const PLANS = [
  {
    name: "L'Essentiel",    fullPrice: 299, launchPrice: 199, badge: null, highlight: false,
    features: ['Plats & recettes', 'Gestion du stock', 'Art de la Table', 'Pâtisserie', 'Paramètres & devise'],
  },
  {
    name: 'Le Croissance',  fullPrice: 499, launchPrice: 399, badge: 'Le plus populaire', highlight: true,
    features: ["Tout l'Essentiel +", 'Événements & calculateur', 'Devis & paiements', 'Personnel & Negafa', 'Liste de courses'],
  },
  {
    name: "L'Élite",        fullPrice: 699, launchPrice: 599, badge: 'Pour les pros', highlight: false,
    features: ['Tout le Croissance +', 'Comptabilité complète', 'Factures DGI (ICE/IF/RC)', 'Rapports & export', 'Support prioritaire'],
  },
]

/* ── Styles ── */
const S = {
  page: { fontFamily: "'DM Sans', system-ui, sans-serif", background: BG, color: DARK, margin: 0, padding: 0, minHeight: '100vh', overflowX: 'hidden' },

  nav:        { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(250,247,242,0.97)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${BRD}`, padding: '0 5vw', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 },
  navLogo:    { display: 'flex', alignItems: 'center', gap: 10 },
  navLogoImg: { height: 38, objectFit: 'contain', filter: 'invert(16%) sepia(45%) saturate(1200%) hue-rotate(314deg) brightness(80%) contrast(95%)' },
  navLogoTxt: { fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: BURG },
  navLinks:   { display: 'flex', alignItems: 'center', gap: 6 },
  navLink:    { fontSize: 13, fontWeight: 500, color: MUTED, cursor: 'pointer', padding: '6px 13px', background: 'none', border: 'none', fontFamily: 'inherit', letterSpacing: '0.02em', transition: 'color 0.15s' },
  btnGhost:   { fontSize: 13, fontWeight: 500, color: DARK, cursor: 'pointer', padding: '8px 18px', background: 'transparent', border: `1.5px solid ${BRD}`, borderRadius: 6, fontFamily: 'inherit' },
  btnBurg:    { fontSize: 13, fontWeight: 600, color: WHITE, cursor: 'pointer', padding: '8px 20px', background: BURG, border: 'none', borderRadius: 6, fontFamily: 'inherit' },

  hero:         { position: 'relative', minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BURG, overflow: 'hidden', textAlign: 'center' },
  heroGlow:     { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '70%', height: '70%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,168,83,0.14) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 1 },
  heroContent:  { position: 'relative', zIndex: 2, padding: '60px 5vw', maxWidth: 800 },
  heroBadge:    { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,168,83,0.15)', border: '1px solid rgba(212,168,83,0.35)', borderRadius: 99, padding: '6px 18px', marginBottom: 28, fontSize: 12, fontWeight: 500, color: GOLD_L, letterSpacing: '0.05em' },
  heroDot:      { width: 6, height: 6, borderRadius: '50%', background: GOLD },
  heroTitle:    { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px,5.5vw,72px)', fontWeight: 700, color: WHITE, lineHeight: 1.1, margin: '0 0 8px', letterSpacing: '-0.02em' },
  heroItalic:   { fontStyle: 'italic', color: GOLD },
  heroSub:      { fontSize: 'clamp(15px,1.8vw,18px)', color: 'rgba(255,255,255,0.68)', lineHeight: 1.78, margin: '0 auto 42px', maxWidth: 540 },
  heroBtns:     { display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 },
  btnHeroPrim:  { background: GOLD, color: DARK, border: 'none', borderRadius: 8, padding: '14px 34px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.02em' },
  btnHeroGhost: { background: 'transparent', color: WHITE, border: '1.5px solid rgba(255,255,255,0.32)', borderRadius: 8, padding: '14px 34px', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  heroStats:    { display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.13)', paddingTop: 32 },
  heroStatVal:  { display: 'block', fontSize: 20, fontWeight: 700, color: GOLD },
  heroStatLbl:  { display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 },

  section:      { position: 'relative', padding: '88px 5vw', overflow: 'hidden', background: BG },
  sectionAlt:   { position: 'relative', padding: '88px 5vw', overflow: 'hidden', background: BG_ALT },
  sectionWhite: { position: 'relative', padding: '88px 5vw', overflow: 'hidden', background: WHITE },
  sectionDark:  { position: 'relative', padding: '88px 5vw', overflow: 'hidden', background: BURG },
  inner:        { position: 'relative', zIndex: 1, maxWidth: 1140, margin: '0 auto' },
  secTitle:     { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 700, color: DARK, margin: '0 0 8px', lineHeight: 1.2, textAlign: 'center' },
  secTitleW:    { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 700, color: WHITE, margin: '0 0 8px', lineHeight: 1.2, textAlign: 'center' },
  secSub:       { fontSize: 15, color: MUTED, lineHeight: 1.75, maxWidth: 560, margin: '0 auto 52px', textAlign: 'center' },
  secSubW:      { fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, maxWidth: 560, margin: '0 auto 52px', textAlign: 'center' },

  svcGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 },
  svcCard:      { background: WHITE, borderRadius: 12, padding: '32px 26px 28px', border: `1px solid ${BRD}`, position: 'relative', overflow: 'hidden', cursor: 'default' },
  svcBar:       { position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right, ${BURG}, ${GOLD})` },
  svcIconWrap:  { width: 50, height: 50, borderRadius: 12, background: 'rgba(107,39,55,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 18 },
  svcTitle:     { fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 600, color: BURG, margin: '0 0 10px' },
  svcDesc:      { fontSize: 13.5, color: MUTED, lineHeight: 1.65, margin: 0 },

  zellijBand:   { position: 'relative', height: 56, overflow: 'hidden', background: BG_ALT, borderTop: `1px solid ${BRD}`, borderBottom: `1px solid ${BRD}` },
  zellijOrnament: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 },

  whyGrid:   { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28, maxWidth: 960, margin: '0 auto' },
  whyCard:   { padding: '36px 28px', borderLeft: `3px solid ${GOLD}`, background: WHITE, borderRadius: '0 12px 12px 0', boxShadow: '0 2px 16px rgba(107,39,55,0.05)' },
  whyNum:    { fontFamily: "'Playfair Display', serif", fontSize: 52, fontWeight: 700, color: BURG, lineHeight: 1 },
  whyLabel:  { fontSize: 11, fontWeight: 600, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '6px 0 14px' },
  whyDesc:   { fontSize: 14, color: MUTED, lineHeight: 1.65 },

  testGrid:   { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22, maxWidth: 1100, margin: '0 auto' },
  testCard:   { background: WHITE, borderRadius: 14, padding: '32px 26px', border: `1px solid ${BRD}`, boxShadow: '0 2px 20px rgba(107,39,55,0.05)', display: 'flex', flexDirection: 'column', gap: 18 },
  testQuote:  { fontSize: 40, color: GOLD, lineHeight: 1, fontFamily: 'Georgia, serif', marginBottom: -8 },
  testText:   { fontSize: 14, color: MUTED, lineHeight: 1.75, flex: 1, fontStyle: 'italic' },
  testAuthor: { display: 'flex', alignItems: 'center', gap: 12 },
  testAvatar: { width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${BURG}, ${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: WHITE, flexShrink: 0 },
  testName:   { fontSize: 14, fontWeight: 600, color: DARK },
  testCity:   { fontSize: 12, color: MUTED, marginTop: 2 },

  pricingGrid:    { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 1100, margin: '0 auto', alignItems: 'stretch' },
  priceCard:      { background: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: '36px 28px', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', flexDirection: 'column' },
  priceCardHL:    { background: WHITE, borderRadius: 16, padding: '36px 28px', border: `2px solid ${GOLD}`, boxShadow: `0 0 44px rgba(212,168,83,0.22)`, display: 'flex', flexDirection: 'column' },
  planBadgeGold:  { display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99, marginBottom: 20, background: GOLD, color: DARK },
  planBadgeSoft:  { display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99, marginBottom: 20, background: 'rgba(212,168,83,0.18)', color: GOLD_L },
  planName:       { fontSize: 18, fontWeight: 700, color: WHITE, marginBottom: 6 },
  planNameDark:   { fontSize: 18, fontWeight: 700, color: DARK,  marginBottom: 6 },
  planTrial:      { fontSize: 12, color: '#22c55e', fontWeight: 500, marginBottom: 6 },
  planOld:        { fontSize: 14, color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' },
  planOldDark:    { fontSize: 14, color: MUTED, textDecoration: 'line-through' },
  planPrice:      { fontSize: 48, fontWeight: 800, color: WHITE, lineHeight: 1.05 },
  planPriceDark:  { fontSize: 48, fontWeight: 800, color: DARK,  lineHeight: 1.05 },
  planPer:        { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 4 },
  planPerDark:    { fontSize: 12, color: MUTED, marginBottom: 4 },
  planLaunch:     { fontSize: 11, color: GOLD,  marginBottom: 22 },
  planLaunchDark: { fontSize: 11, color: BURG,  marginBottom: 22 },
  planFeatures:   { listStyle: 'none', padding: 0, margin: '0 0 28px', flex: 1 },
  planFeat:       { fontSize: 13, color: 'rgba(255,255,255,0.65)', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 },
  planFeatDark:   { fontSize: 13, color: MUTED, padding: '7px 0', borderBottom: `1px solid ${BRD}`, display: 'flex', alignItems: 'center', gap: 10 },
  planCheck:      { color: GOLD, fontWeight: 700, flexShrink: 0 },
  planCheckDark:  { color: BURG, fontWeight: 700, flexShrink: 0 },
  btnPlanGhost:   { background: 'transparent', color: WHITE, border: '1px solid rgba(255,255,255,0.28)', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%', marginTop: 'auto', fontFamily: 'inherit' },
  btnPlanBurg:    { background: BURG, color: WHITE, border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: 'auto', fontFamily: 'inherit' },

  ctaWrap:    { position: 'relative', background: BURG_D, padding: '96px 5vw', textAlign: 'center', overflow: 'hidden' },
  ctaContent: { position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto' },
  ctaTitle:   { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,52px)', fontWeight: 700, color: WHITE, margin: '0 0 16px', lineHeight: 1.2 },
  ctaSub:     { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 36, lineHeight: 1.7 },
  btnCtaGold: { background: GOLD, color: DARK, border: 'none', borderRadius: 8, padding: '16px 42px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.02em' },

  footer:       { background: BURG_D, padding: '48px 5vw 28px', borderTop: `1px solid rgba(212,168,83,0.18)` },
  footerTop:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32, maxWidth: 1140, margin: '0 auto 32px' },
  footerBrand:  { maxWidth: 260 },
  footerName:   { fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: WHITE, marginBottom: 10 },
  footerTagline:{ fontSize: 13, color: 'rgba(255,255,255,0.42)', lineHeight: 1.65 },
  footerLinks:  { display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' },
  footerLink:   { fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  footerBottom: { borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1140, margin: '0 auto', flexWrap: 'wrap', gap: 8 },
  footerCopy:   { fontSize: 12, color: 'rgba(255,255,255,0.28)' },
  footerAdmin:  { fontSize: 12, color: 'rgba(255,255,255,0.18)', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' },
}

/* ── Component ── */
export default function LandingPagePublic() {
  const navigate         = useNavigate()
  const isMobile         = useIsMobile()
  const [imgOk, setImgOk]           = useState(true)
  const [mentionsOpen, setMentions] = useState(false)

  const col1 = isMobile ? '1fr' : undefined

  return (
    <>
      <link rel="stylesheet" href={FONT_LINK} />
      <div style={S.page}>

        {/* ─── NAVBAR ─── */}
        <nav style={{ ...S.nav, padding: isMobile ? '0 1.25rem' : '0 5vw' }}>
          <div style={S.navLogo}>
            {imgOk && (
              <img src="/_Traiteur Pro.png" alt="Traiteur Pro" style={S.navLogoImg} onError={() => setImgOk(false)} />
            )}
            <span style={S.navLogoTxt}>Traiteur Pro</span>
          </div>
          <div style={{ ...S.navLinks, gap: isMobile ? 6 : 8 }}>
            {!isMobile && (
              <>
                <button style={S.navLink}
                  onClick={() => scrollTo('services')}
                  onMouseEnter={e => e.currentTarget.style.color = BURG}
                  onMouseLeave={e => e.currentTarget.style.color = MUTED}>
                  Services
                </button>
                <button style={S.navLink}
                  onClick={() => scrollTo('tarifs')}
                  onMouseEnter={e => e.currentTarget.style.color = BURG}
                  onMouseLeave={e => e.currentTarget.style.color = MUTED}>
                  Tarifs
                </button>
              </>
            )}
            <button style={S.btnGhost} onClick={() => navigate('/login')}
              onMouseEnter={e => e.currentTarget.style.borderColor = BURG}
              onMouseLeave={e => e.currentTarget.style.borderColor = BRD}>
              Connexion
            </button>
            <button style={S.btnBurg} onClick={() => navigate('/register')}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Essai gratuit
            </button>
          </div>
        </nav>

        {/* ─── HERO ─── */}
        <section style={S.hero}>
          <ZellijBg opacity={0.13} color1="rgba(255,255,255,0.55)" color2={GOLD} />
          <div style={S.heroGlow} />
          <div style={S.heroContent}>
            <div style={S.heroBadge}>
              <span style={S.heroDot} />
              Logiciel traiteur · Maroc
            </div>
            <h1 style={{ ...S.heroTitle, fontSize: isMobile ? 'clamp(32px,9vw,48px)' : 'clamp(36px,5.5vw,72px)' }}>
              De la commande<br />
              à la facture,<br />
              <em style={S.heroItalic}>tout en un</em>
            </h1>
            <p style={S.heroSub}>
              Fini les fichiers Excel et les erreurs de commande.<br />
              Gérez vos événements, votre équipe et vos finances.
            </p>
            <div style={{ ...S.heroBtns, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center' }}>
              <button style={S.btnHeroPrim} onClick={() => navigate('/register')}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}>
                Commencer gratuitement
              </button>
              <button style={S.btnHeroGhost} onClick={() => scrollTo('tarifs')}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.65)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.32)'}>
                Voir les tarifs →
              </button>
            </div>
            <div style={{ ...S.heroStats, gap: isMobile ? 20 : 40 }}>
              {[
                { val: '+10h',   lbl: 'économisées / semaine' },
                { val: '100%',   lbl: 'conforme TVA & ICE' },
                { val: '1 clic', lbl: 'devis → facture' },
              ].map(s => (
                <div key={s.lbl} style={{ textAlign: 'center' }}>
                  <span style={S.heroStatVal}>{s.val}</span>
                  <span style={S.heroStatLbl}>{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SERVICES ─── */}
        <section id="services" style={S.section}>
          <div style={S.inner}>
            <Eye>Ce que nous offrons</Eye>
            <h2 style={S.secTitle}>Tout ce dont vous avez besoin</h2>
            <GoldDivider />
            <p style={S.secSub}>Des outils sur-mesure pour les traiteurs marocains — de la pâtisserie orientale aux mariages les plus grandioses</p>
            <div style={{ ...S.svcGrid, gridTemplateColumns: col1 || 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {FEATURES.map(f => (
                <div key={f.title} style={S.svcCard}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 36px rgba(107,39,55,0.1)` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={S.svcBar} />
                  <div style={S.svcIconWrap}>{f.icon}</div>
                  <h3 style={S.svcTitle}>{f.title}</h3>
                  <p style={S.svcDesc}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── ZELLIJ BAND DIVIDER ─── */}
        <div style={S.zellijBand}>
          <ZellijBg opacity={0.18} color1={BURG} color2={GOLD} />
          <div style={S.zellijOrnament}>
            <svg width="140" height="28" viewBox="0 0 140 28" fill="none">
              <line x1="0" y1="14" x2="48" y2="14" stroke={GOLD} strokeWidth="1" />
              <polygon points="58,4 70,14 58,24 46,14" fill={BURG} />
              <polygon points="70,7 79,14 70,21 61,14" fill={GOLD} />
              <polygon points="82,4 94,14 82,24 70,14" fill={BURG} />
              <line x1="92" y1="14" x2="140" y2="14" stroke={GOLD} strokeWidth="1" />
            </svg>
          </div>
        </div>

        {/* ─── WHY CHOOSE US ─── */}
        <section style={S.sectionAlt}>
          <div style={S.inner}>
            <Eye>Pourquoi nous choisir</Eye>
            <h2 style={S.secTitle}>Des résultats concrets</h2>
            <GoldDivider />
            <div style={{ ...S.whyGrid, gridTemplateColumns: col1 || 'repeat(3, 1fr)', gap: isMobile ? 16 : 28 }}>
              {WHY_US.map(w => (
                <div key={w.num} style={S.whyCard}>
                  <div style={S.whyNum}>{w.num}</div>
                  <div style={S.whyLabel}>{w.label}</div>
                  <div style={S.whyDesc}>{w.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ─── */}
        <section style={S.sectionWhite}>
          <div style={S.inner}>
            <Eye>Témoignages</Eye>
            <h2 style={S.secTitle}>Ils nous font confiance</h2>
            <GoldDivider />
            <p style={S.secSub}>Des traiteurs de tout le Maroc ont choisi Traiteur Pro pour gérer leur activité</p>
            <div style={{ ...S.testGrid, gridTemplateColumns: col1 || 'repeat(3, 1fr)', gap: isMobile ? 16 : 22 }}>
              {TESTIMONIALS.map(t => (
                <div key={t.name} style={S.testCard}>
                  <div style={S.testQuote}>"</div>
                  <p style={S.testText}>{t.quote}</p>
                  <div style={S.testAuthor}>
                    <div style={S.testAvatar}>{t.initials}</div>
                    <div>
                      <div style={S.testName}>{t.name}</div>
                      <div style={S.testCity}>{t.city}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section id="tarifs" style={S.sectionDark}>
          <ZellijBg opacity={0.1} color1="rgba(255,255,255,0.5)" color2="rgba(212,168,83,0.65)" />
          <div style={S.inner}>
            <Eye light>Nos Tarifs</Eye>
            <h2 style={S.secTitleW}>Choisissez votre plan</h2>
            <GoldDivider color="rgba(212,168,83,0.6)" />
            <p style={S.secSubW}>Aucune carte bancaire requise · Annulez à tout moment</p>
            <div style={{ ...S.pricingGrid, gridTemplateColumns: col1 || 'repeat(3, 1fr)', gap: isMobile ? 16 : 20 }}>
              {PLANS.map(plan => (
                <div key={plan.name} style={plan.highlight ? S.priceCardHL : S.priceCard}>
                  {plan.badge
                    ? <span style={plan.highlight ? S.planBadgeGold : S.planBadgeSoft}>{plan.badge}</span>
                    : <div style={{ height: 27, marginBottom: 20 }} />
                  }
                  <div style={plan.highlight ? S.planNameDark : S.planName}>{plan.name}</div>
                  <div style={S.planTrial}>✅ 30 jours d'essai gratuit</div>
                  <div style={plan.highlight ? S.planOldDark : S.planOld}>{plan.fullPrice} MAD</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '2px 0' }}>
                    <span style={plan.highlight ? S.planPriceDark : S.planPrice}>{plan.launchPrice}</span>
                    <span style={{ fontSize: 15, color: plan.highlight ? MUTED : 'rgba(255,255,255,0.4)' }}>MAD</span>
                  </div>
                  <div style={plan.highlight ? S.planPerDark : S.planPer}>par mois, par établissement</div>
                  <div style={plan.highlight ? S.planLaunchDark : S.planLaunch}>🏷️ Offre de lancement · -100 MAD</div>
                  <ul style={S.planFeatures}>
                    {plan.features.map(f => (
                      <li key={f} style={plan.highlight ? S.planFeatDark : S.planFeat}>
                        <span style={plan.highlight ? S.planCheckDark : S.planCheck}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    style={plan.highlight ? S.btnPlanBurg : S.btnPlanGhost}
                    onClick={() => navigate('/register')}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    Commencer
                  </button>
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'center', marginTop: 32, fontSize: 15, color: GOLD, fontWeight: 500 }}>
              🎁 Commencez gratuitement — 30 jours d'essai, aucune carte requise
            </p>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section style={S.ctaWrap}>
          <ZellijBg opacity={0.09} color1="rgba(255,255,255,0.45)" color2={GOLD} />
          <div style={S.ctaContent}>
            <Eye light>Commencez aujourd'hui</Eye>
            <h2 style={S.ctaTitle}>
              Votre traiteur mérite mieux<br />
              qu'Excel et WhatsApp.
            </h2>
            <p style={S.ctaSub}>
              Aucune carte bancaire requise · Accès immédiat<br />
              Support en français et arabe
            </p>
            <GoldDivider color="rgba(212,168,83,0.5)" />
            <button style={S.btnCtaGold} onClick={() => navigate('/register')}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}>
              Essai gratuit 30 jours · sans carte bancaire
            </button>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer style={S.footer}>
          <div style={{ ...S.footerTop, flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={S.footerBrand}>
              <div style={S.footerName}>Traiteur Pro</div>
              <p style={S.footerTagline}>
                Le logiciel de gestion conçu pour les traiteurs marocains.
                Événements, finances et personnel, tout en un.
              </p>
            </div>
            <div style={{ ...S.footerLinks, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 14 : 24 }}>
              <a href="/login" style={S.footerLink}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
                Connexion
              </a>
              <a href="/register" style={S.footerLink}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
                Essai gratuit
              </a>
              <button style={S.footerLink} onClick={() => setMentions(true)}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
                Mentions légales
              </button>
              <a href="https://wa.me/212751434780?text=Salam%2C%20je%20veux%20en%20savoir%20plus%20sur%20Traiteur%20Pro" target="_blank" rel="noreferrer" style={S.footerLink}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
                Contact
              </a>
            </div>
          </div>
          <div style={{ ...S.footerBottom, flexDirection: isMobile ? 'column' : 'row', textAlign: isMobile ? 'center' : 'left' }}>
            <span style={S.footerCopy}>Traiteur Pro © {new Date().getFullYear()}</span>
            <a href="/login" style={S.footerAdmin}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.18)'}>
              ⚙️ Accès Admin
            </a>
          </div>
        </footer>

        {/* ─── MENTIONS LÉGALES MODAL ─── */}
        {mentionsOpen && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(26,10,18,0.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}
            onClick={() => setMentions(false)}
          >
            <div
              style={{ background: WHITE, borderRadius: 16, maxWidth: 480, width: '100%', overflow: 'hidden', boxShadow: '0 24px 64px rgba(107,39,55,0.3)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div style={{ background: BURG, padding: '24px 28px 20px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div style={{ width: 22, height: 1, background: GOLD }} />
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>Informations légales</span>
                  <div style={{ width: 22, height: 1, background: GOLD }} />
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: WHITE, margin: 0 }}>
                  Mentions Légales
                </h2>
                <button
                  onClick={() => setMentions(false)}
                  style={{ position: 'absolute', top: 16, right: 18, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: WHITE, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}
                  aria-label="Fermer">
                  ✕
                </button>
              </div>

              {/* Modal body */}
              <div style={{ padding: '28px 28px 32px' }}>
                {[
                  { label: 'Nom du site',  value: 'Traiteur Pro' },
                  { label: 'Site web',     value: 'www.traiteur-pro.com' },
                  { label: 'Pays',         value: 'Maroc' },
                  { label: 'Contact',      value: '+212 751 434 780' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '12px 0', borderBottom: `1px solid ${BRD}` }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, minWidth: 100, flexShrink: 0 }}>
                      {row.label}
                    </span>
                    <span style={{ fontSize: 14, color: DARK, fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}

                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, margin: '22px 0 0', paddingTop: 6, borderTop: `2px solid ${BURG}`, borderLeft: `2px solid ${GOLD}`, paddingLeft: 12 }}>
                  Ce site est protégé. Toute reproduction est interdite sans autorisation préalable.
                </p>

                <button
                  onClick={() => setMentions(false)}
                  style={{ marginTop: 28, width: '100%', background: BURG, color: WHITE, border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
