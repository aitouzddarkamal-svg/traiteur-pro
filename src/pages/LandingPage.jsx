import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/* ─── Google Fonts ─── */
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap'

/* ─── Design tokens ─── */
const BG      = '#0f1a14'
const BG2     = '#152019'
const BG3     = '#1a2820'
const BORDER  = 'rgba(255,255,255,0.07)'
const TEXT     = '#e8f0ea'
const MUTED    = '#7a9a82'

/* ─── Default services ─── */
const DEFAULT_SERVICES = [
  { icon: '🍽️', label: 'Traiteur',          desc: 'Menus sur-mesure pour tous vos événements' },
  { icon: '🎂', label: 'Pâtisserie',         desc: 'Gâteaux et desserts artisanaux' },
  { icon: '💐', label: 'Décoration Florale', desc: 'Compositions élégantes pour chaque espace' },
  { icon: '🏛️', label: 'Aménagement',        desc: 'Mise en scène complète de votre événement' },
  { icon: '🥂', label: 'Art de la Table',    desc: 'Vaisselle et nappage haut de gamme' },
  { icon: '👨‍🍳', label: 'Personnel',          desc: 'Équipe professionnelle et expérimentée' },
]

/* ─── Styles ─── */
const S = {
  /* Base */
  page:     { fontFamily: "'DM Sans', system-ui, sans-serif", background: BG, color: TEXT, margin: 0, padding: 0, minHeight: '100vh' },

  /* Navbar */
  nav:       { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,26,20,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${BORDER}`, padding: '0 5vw', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 },
  navLogo:   { fontFamily: "'Playfair Display', serif", fontSize: 21, fontWeight: 700, color: TEXT, letterSpacing: '0.02em', textDecoration: 'none', cursor: 'pointer' },
  navList:   { display: 'flex', gap: 32, listStyle: 'none', margin: 0, padding: 0 },
  navLink:   { fontSize: 13, fontWeight: 500, color: MUTED, letterSpacing: '0.04em', cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'none' },

  /* Hero */
  hero:        { position: 'relative', minHeight: '88vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', textAlign: 'center', background: BG },
  heroGrad:    { position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 60% 40%, rgba(29,158,117,0.12) 0%, transparent 65%), radial-gradient(ellipse at 20% 80%, rgba(29,158,117,0.06) 0%, transparent 55%)` },
  heroBgImg:   { position: 'absolute', inset: 0, objectFit: 'cover', width: '100%', height: '100%', opacity: 0.18 },
  heroDark:    { position: 'absolute', inset: 0, background: 'rgba(15,26,20,0.72)' },
  heroContent: { position: 'relative', zIndex: 2, padding: '0 5vw', maxWidth: 720 },
  heroEye:     { fontSize: 11, fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase', color: MUTED, marginBottom: 20, display: 'block' },
  heroTitle:   { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(38px,6vw,74px)', fontWeight: 700, color: TEXT, lineHeight: 1.13, margin: '0 0 22px' },
  heroSub:     { fontSize: 'clamp(15px,1.8vw,18px)', color: 'rgba(232,240,234,0.72)', lineHeight: 1.75, margin: '0 0 40px', maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' },
  heroBtn:     { display: 'inline-block', padding: '14px 40px', borderRadius: 4, fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s, transform 0.15s', color: '#fff' },

  /* Section commons */
  section:     { padding: '88px 5vw' },
  sectionAlt:  { padding: '88px 5vw', background: BG2 },
  eye:         { fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: MUTED, marginBottom: 14, display: 'block' },
  divider:     { width: 40, height: 2, border: 'none', margin: '0 auto 20px', borderRadius: 1 },
  secTitle:    { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px,3.8vw,42px)', fontWeight: 700, color: TEXT, margin: '0 0 16px', lineHeight: 1.2 },
  secSub:      { fontSize: 15, color: MUTED, lineHeight: 1.75, maxWidth: 560, margin: '0 auto 52px' },

  /* Services grid */
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 1, maxWidth: 960, margin: '0 auto', border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' },
  svcCard:     { background: BG3, padding: '32px 28px', transition: 'background 0.2s', cursor: 'default' },
  svcIcon:     { fontSize: 36, marginBottom: 16, display: 'block' },
  svcTitle:    { fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: TEXT, margin: '0 0 8px' },
  svcDesc:     { fontSize: 13, color: MUTED, lineHeight: 1.65, margin: 0 },

  /* Gallery */
  galGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10, maxWidth: 960, margin: '0 auto' },
  galItem:     { aspectRatio: '4/3', borderRadius: 8, overflow: 'hidden', position: 'relative' },
  galImg:      { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  galPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 },

  /* Contact */
  contactWrap: { maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' },
  infoCard:    { background: BG3, borderRadius: 10, padding: '20px 22px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 14, border: `1px solid ${BORDER}` },
  infoIcon:    { fontSize: 22, flexShrink: 0, marginTop: 2 },
  infoLabel:   { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED, marginBottom: 4, display: 'block' },
  infoVal:     { fontSize: 14, color: TEXT, lineHeight: 1.5, textDecoration: 'none' },
  waBtn:       { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: '#25d366', color: '#fff', borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: 'none', marginTop: 6 },

  /* Form */
  form:        { display: 'flex', flexDirection: 'column', gap: 12 },
  formLabel:   { fontSize: 11, color: MUTED, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, display: 'block' },
  input:       { padding: '12px 16px', background: BG3, border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT, fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  textarea:    { padding: '12px 16px', background: BG3, border: `1px solid ${BORDER}`, borderRadius: 6, color: TEXT, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', minHeight: 120, outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s' },

  /* Footer */
  footer:      { background: '#08100a', padding: '24px 5vw', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderTop: `1px solid ${BORDER}` },
  footerText:  { fontSize: 12, color: '#4a6a50' },
  footerAdmin: { fontSize: 11, color: '#2a4a30', textDecoration: 'none', transition: 'color 0.2s' },

  /* Coming soon */
  coming:      { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, textAlign: 'center', padding: 40 },
  comingBox:   { maxWidth: 480 },
  comingIcon:  { fontSize: 52, marginBottom: 24 },
  comingTitle: { fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700, color: TEXT, margin: '0 0 16px' },
  comingSub:   { fontSize: 16, color: MUTED, lineHeight: 1.7 },
}

/* ─── Hex pattern SVG (hero decoration) ─── */
function HexPattern({ color }) {
  return (
    <svg width="420" height="420" viewBox="0 0 320 320" fill="none"
      style={{ position: 'absolute', top: -20, right: -60, opacity: 0.06, pointerEvents: 'none', zIndex: 1 }}>
      {[
        [80,46],[160,46],[240,46],
        [120,92],[200,92],
        [80,138],[160,138],[240,138],
        [120,184],[200,184],
        [80,230],[160,230],[240,230],
      ].map(([cx, cy], i) => (
        <polygon key={i}
          points={`${cx},${cy-36} ${cx+32},${cy-18} ${cx+32},${cy+18} ${cx},${cy+36} ${cx-32},${cy+18} ${cx-32},${cy-18}`}
          stroke={color} strokeWidth="1.5" fill="none" />
      ))}
    </svg>
  )
}

/* ─── Smooth scroll ─── */
function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

/* ─── Contact form ─── */
function ContactForm({ accent }) {
  const [form, setForm] = useState({ nom: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleSubmit(e) {
    e.preventDefault()
    setSent(true)
    setForm({ nom: '', email: '', message: '' })
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <form style={S.form} onSubmit={handleSubmit}>
      <div>
        <label style={S.formLabel}>Votre nom</label>
        <input style={S.input} type="text" placeholder="Mohamed Alami" required
          value={form.nom} onChange={e => set('nom', e.target.value)} />
      </div>
      <div>
        <label style={S.formLabel}>Email</label>
        <input style={S.input} type="email" placeholder="vous@email.com" required
          value={form.email} onChange={e => set('email', e.target.value)} />
      </div>
      <div>
        <label style={S.formLabel}>Message</label>
        <textarea style={S.textarea} placeholder="Décrivez votre événement..." required
          value={form.message} onChange={e => set('message', e.target.value)} />
      </div>
      <button type="submit"
        style={{ ...S.heroBtn, background: accent, alignSelf: 'flex-start', marginTop: 4 }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        {sent ? '✅ Message envoyé !' : 'Envoyer le message'}
      </button>
    </form>
  )
}

/* ─── Coming soon fallback ─── */
function ComingSoon() {
  return (
    <>
      <link rel="stylesheet" href={FONT_LINK} />
      <div style={S.coming}>
        <div style={S.comingBox}>
          <div style={S.comingIcon}>✨</div>
          <h1 style={S.comingTitle}>Bientôt Disponible</h1>
          <p style={S.comingSub}>
            Notre site est en cours de préparation.<br />
            Revenez très prochainement.
          </p>
          <a href="/login" style={{ ...S.footerAdmin, color: '#4a6a50', marginTop: 40, display: 'block' }}>
            ⚙️ Accès Admin
          </a>
        </div>
      </div>
    </>
  )
}

/* ─── Gallery placeholder items ─── */
const GAL_ICONS = ['🥘', '🍰', '💐', '🥗', '🍾', '🎊']

/* ─── Main component ─── */
export default function LandingPage({ hostname }) {
  const [biz, setBiz]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBiz() {
      const { data } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('hostname', hostname)
        .single()
      setBiz(data || null)
      setLoading(false)
    }
    fetchBiz()
  }, [hostname])

  if (loading) return (
    <>
      <link rel="stylesheet" href={FONT_LINK} />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: MUTED }}>…</div>
      </div>
    </>
  )

  if (!biz) return <ComingSoon />

  const accent   = biz.primary_color || '#1D9E75'
  const services = Array.isArray(biz.services) && biz.services.length ? biz.services : DEFAULT_SERVICES
  const gallery  = Array.isArray(biz.gallery)  && biz.gallery.length  ? biz.gallery  : null
  const waNumber = (biz.whatsapp || biz.phone || '').replace(/\D/g, '')
  const year     = new Date().getFullYear()

  const NAV_ITEMS = [
    { label: 'Notre Histoire', id: 'histoire' },
    { label: 'Services',       id: 'services' },
    { label: 'Galerie',        id: 'galerie'  },
    { label: 'Contact',        id: 'contact'  },
  ]

  return (
    <>
      <link rel="stylesheet" href={FONT_LINK} />
      <div style={S.page}>

        {/* ── NAVBAR ── */}
        <nav style={S.nav}>
          <span style={S.navLogo} onClick={() => scrollTo('hero')}>
            {biz.logo_url
              ? <img src={biz.logo_url} alt={biz.business_name} style={{ height: 38, objectFit: 'contain', display: 'block' }} />
              : biz.business_name}
          </span>
          <ul style={S.navList}>
            {NAV_ITEMS.map(n => (
              <li key={n.id}>
                <span style={S.navLink}
                  onClick={() => scrollTo(n.id)}
                  onMouseEnter={e => e.target.style.color = accent}
                  onMouseLeave={e => e.target.style.color = MUTED}>
                  {n.label}
                </span>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── HERO ── */}
        <section id="hero" style={S.hero}>
          <div style={S.heroGrad} />
          <HexPattern color={accent} />
          {biz.logo_url && (
            <>
              <img src={biz.logo_url} alt="" style={S.heroBgImg} />
              <div style={S.heroDark} />
            </>
          )}
          <div style={S.heroContent}>
            <span style={{ ...S.heroEye, color: accent }}>Bienvenue</span>
            <h1 style={S.heroTitle}>{biz.business_name}</h1>
            {biz.tagline && <p style={S.heroSub}>{biz.tagline}</p>}
            <span style={{ ...S.heroBtn, background: accent }}
              onClick={() => scrollTo('contact')}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'none' }}>
              Réserver maintenant
            </span>
          </div>
        </section>

        {/* ── NOTRE HISTOIRE ── */}
        <section id="histoire" style={{ ...S.sectionAlt, textAlign: 'center' }}>
          <span style={{ ...S.eye, color: accent }}>Notre Histoire</span>
          <hr style={{ ...S.divider, background: accent }} />
          <h2 style={S.secTitle}>L'Art de Recevoir</h2>
          <p style={{ ...S.secSub, marginBottom: 0 }}>
            Passionnés par la gastronomie et l'élégance, nous mettons notre savoir-faire
            au service de vos événements les plus précieux. Chaque détail est pensé pour
            créer des instants inoubliables.
          </p>
        </section>

        {/* ── SERVICES ── */}
        <section id="services" style={{ ...S.section, textAlign: 'center' }}>
          <span style={{ ...S.eye, color: accent }}>Ce que nous offrons</span>
          <hr style={{ ...S.divider, background: accent }} />
          <h2 style={S.secTitle}>Nos Services</h2>
          <p style={S.secSub}>Des prestations complètes pour faire de votre événement un moment d'exception</p>
          <div style={S.grid}>
            {services.map((svc, i) => (
              <div key={i} style={S.svcCard}
                onMouseEnter={e => e.currentTarget.style.background = `rgba(29,158,117,0.08)`}
                onMouseLeave={e => e.currentTarget.style.background = BG3}>
                <span style={S.svcIcon}>{svc.icon || '✨'}</span>
                <h3 style={S.svcTitle}>{svc.label}</h3>
                <p style={S.svcDesc}>{svc.desc || ''}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── GALERIE ── */}
        <section id="galerie" style={{ ...S.sectionAlt, textAlign: 'center' }}>
          <span style={{ ...S.eye, color: accent }}>Galerie</span>
          <hr style={{ ...S.divider, background: accent }} />
          <h2 style={S.secTitle}>Nos Réalisations</h2>
          <p style={S.secSub}>Un aperçu de nos plus beaux événements</p>
          <div style={S.galGrid}>
            {gallery
              ? gallery.map((url, i) => (
                  <div key={i} style={S.galItem}>
                    <img src={url} alt={`Réalisation ${i + 1}`} style={S.galImg} />
                  </div>
                ))
              : GAL_ICONS.map((icon, i) => (
                  <div key={i} style={S.galItem}>
                    <div style={{ ...S.galPlaceholder, background: i % 2 === 0 ? BG3 : '#1e2e24', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                      {icon}
                    </div>
                  </div>
                ))
            }
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section id="contact" style={S.section}>
          <div style={S.contactWrap}>
            <div>
              <span style={{ ...S.eye, color: accent }}>Nous contacter</span>
              <h2 style={{ ...S.secTitle, marginBottom: 12 }}>
                Réservez votre<br />
                <em style={{ fontStyle: 'italic', color: accent }}>traiteur</em> dès maintenant
              </h2>
              <p style={{ ...S.secSub, margin: '0 0 28px', textAlign: 'left' }}>
                Notre équipe est disponible pour concevoir votre événement sur-mesure.
              </p>

              {biz.phone && (
                <div style={S.infoCard}>
                  <span style={S.infoIcon}>📞</span>
                  <div>
                    <span style={S.infoLabel}>Téléphone</span>
                    <a href={`tel:${biz.phone}`} style={S.infoVal}>{biz.phone}</a>
                  </div>
                </div>
              )}

              {biz.email && (
                <div style={S.infoCard}>
                  <span style={S.infoIcon}>✉️</span>
                  <div>
                    <span style={S.infoLabel}>Email</span>
                    <a href={`mailto:${biz.email}`} style={S.infoVal}>{biz.email}</a>
                  </div>
                </div>
              )}

              {biz.address && (
                <div style={S.infoCard}>
                  <span style={S.infoIcon}>📍</span>
                  <div>
                    <span style={S.infoLabel}>Adresse</span>
                    <span style={S.infoVal}>{biz.address}</span>
                  </div>
                </div>
              )}

              {waNumber && (
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" style={S.waBtn}>
                  💬 Écrire sur WhatsApp
                </a>
              )}
            </div>

            <div>
              <ContactForm accent={accent} />
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={S.footer}>
          <span style={S.footerText}>© {year} {biz.business_name}. Tous droits réservés.</span>
          <a href="/login" style={S.footerAdmin}
            onMouseEnter={e => e.target.style.color = '#6a9a70'}
            onMouseLeave={e => e.target.style.color = '#2a4a30'}>
            ⚙️ Accès Admin
          </a>
        </footer>

      </div>
    </>
  )
}
