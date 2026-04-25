import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { t } from '../lib/i18n'

function fmt(n, dec = 0) {
  return Number(n || 0).toLocaleString('fr-MA', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

/* ─── SVG Donut Chart ─── */
function DonutChart({ segments, size = 148, centerLabel }) {
  const cx = size / 2, cy = size / 2, r = 50, thickness = 20
  const circumference = 2 * Math.PI * r
  let cumulative = 0
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#252836" strokeWidth={thickness} />
      {segments.map((seg, i) => {
        const dashLen = (seg.pct / 100) * circumference
        const offset = circumference * 0.25 - cumulative
        cumulative += dashLen
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={seg.color} strokeWidth={thickness}
            strokeDasharray={`${dashLen} ${circumference - dashLen}`}
            strokeDashoffset={offset}
          />
        )
      })}
      {centerLabel && (
        <text x={cx} y={cy - 7} textAnchor="middle" fill="#fff" fontSize="17" fontWeight="700">{centerLabel}</text>
      )}
      <text x={cx} y={cy + 13} textAnchor="middle" fill="#9ca3af" fontSize="10">total</text>
    </svg>
  )
}

/* ─── SVG Line Chart ─── */
const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const PLACEHOLDER_REVENUE = [38000,52000,47000,61000,55000,72000,68000,80000,74000,88000,92000,105000]

function LineChart({ data = PLACEHOLDER_REVENUE, color = '#4ade80' }) {
  const W = 520, H = 130, padX = 44, padY = 16
  const max = Math.max(...data) * 1.1
  const scaleX = i => padX + (i / (data.length - 1)) * W
  const scaleY = v => padY + H - (v / max) * H
  const points = data.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(' ')
  const areaD = `M${scaleX(0)},${scaleY(data[0])} ` +
    data.map((v, i) => `L${scaleX(i)},${scaleY(v)}`).join(' ') +
    ` L${scaleX(data.length - 1)},${padY + H} L${scaleX(0)},${padY + H} Z`
  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  return (
    <svg width="100%" viewBox={`0 0 ${W + padX * 2} ${H + padY * 2 + 24}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridLines.map(p => {
        const y = padY + H - p * H
        return <g key={p}>
          <line x1={padX} x2={W + padX} y1={y} y2={y} stroke="#252836" strokeWidth="1" />
          <text x={padX - 6} y={y + 4} textAnchor="end" fill="#4b5563" fontSize="10">
            {p > 0 ? `${Math.round(max * p / 1000)}k` : '0'}
          </text>
        </g>
      })}
      <path d={areaD} fill="url(#lg)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle key={i} cx={scaleX(i)} cy={scaleY(v)} r="3.5" fill={color} />
      ))}
      {MONTHS.map((m, i) => (
        <text key={m} x={scaleX(i)} y={padY + H + 20} textAnchor="middle" fill="#4b5563" fontSize="10">{m}</text>
      ))}
    </svg>
  )
}

/* ─── Styles ─── */
const S = {
  page:       { background: '#0f1117', minHeight: '100vh', padding: '28px 28px 48px', color: '#fff' },
  // Header
  headerRow:  { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 },
  title:      { fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px' },
  subtitle:   { fontSize: 13, color: '#6b7280', margin: 0 },
  dateBadge:  { background: '#1a1d27', border: '1px solid #252836', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' },
  // KPI
  kpiGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 },
  kpiCard:    { background: '#1a1d27', borderRadius: 14, padding: '20px 22px', border: '1px solid #252836', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.15s', position: 'relative', overflow: 'hidden' },
  kpiIcon:    { fontSize: 22, marginBottom: 10 },
  kpiVal:     { fontSize: 32, fontWeight: 800, lineHeight: 1, marginBottom: 6 },
  kpiLabel:   { fontSize: 12, color: '#6b7280', fontWeight: 500 },
  kpiTrend:   { position: 'absolute', top: 16, right: 16, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20 },
  // Section title
  secTitle:   { fontSize: 13, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 },
  // Cards
  card:       { background: '#1a1d27', borderRadius: 14, border: '1px solid #252836', padding: '20px 22px' },
  cardHead:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  cardTitle:  { fontSize: 14, fontWeight: 600, color: '#e5e7eb' },
  seeAll:     { fontSize: 12, color: '#4ade80', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 },
  // Row items
  row:        { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, marginBottom: 6, background: '#13151f' },
  rowTitle:   { fontSize: 13, fontWeight: 600, color: '#e5e7eb', marginBottom: 2 },
  rowSub:     { fontSize: 11, color: '#6b7280' },
  rowRight:   { textAlign: 'right' },
  rowDate:    { fontSize: 12, fontWeight: 600, color: '#9ca3af' },
  // Badges
  badge:      { display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  // Donut section
  donutRow:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
  donutInner: { display: 'flex', alignItems: 'center', gap: 20 },
  legend:     { display: 'flex', flexDirection: 'column', gap: 10 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 },
  legendDot:  { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  legendVal:  { fontWeight: 700, color: '#e5e7eb', marginLeft: 'auto', paddingLeft: 12 },
  // Line chart
  lineCard:   { background: '#1a1d27', borderRadius: 14, border: '1px solid #252836', padding: '20px 22px', marginBottom: 24 },
  // Bottom row
  bottomRow:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  // Quick guide
  guideItem:  { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, background: '#13151f', marginBottom: 8, cursor: 'pointer', transition: 'background 0.15s' },
  guideIcon:  { width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  guideTitle: { fontSize: 13, fontWeight: 600, color: '#e5e7eb', marginBottom: 2 },
  guideSub:   { fontSize: 11, color: '#6b7280' },
  empty:      { textAlign: 'center', padding: '28px 0', color: '#4b5563', fontSize: 13 },
}

/* ─── J-n countdown color ─── */
function jColor(days) {
  if (days <= 3)  return '#f87171'
  if (days <= 7)  return '#fb923c'
  if (days <= 14) return '#facc15'
  return '#4ade80'
}

export default function Dashboard() {
  const { profile }      = useAuth()
  const { lang } = useLang()
  const isRTL = lang === 'ar'
  const navigate         = useNavigate()
  const dateLocale       = lang === 'ar' ? 'ar-MA' : 'fr-MA'

  const [stats, setStats]               = useState({ events: 0, clients: 0, stockAlerts: 0, pendingPayments: 0, staff: 0 })
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [recentPayments, setRecentPayments] = useState([])
  const [stockAlerts, setStockAlerts]   = useState([])
  const [monthRevenue, setMonthRevenue] = useState(0)
  const [loading, setLoading]           = useState(true)

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const firstOfMonth = today.slice(0, 7) + '-01'

    const [eventsRes, clientsRes, ingredientsRes, paymentsRes, staffRes, monthPayRes] = await Promise.all([
      supabase.from('events').select('id, title, event_date, clients(full_name)').order('event_date', { ascending: true }),
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('ingredients').select('id, name_fr, unit, current_stock, alert_threshold'),
      supabase.from('payments').select('id, amount, payment_date, payment_type, events(title)').order('payment_date', { ascending: false }).limit(5),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('payments').select('amount').gte('payment_date', firstOfMonth).lte('payment_date', today),
    ])

    const allEvents    = eventsRes.data || []
    const upcoming     = allEvents.filter(e => e.event_date >= today).slice(0, 5)
    const activeCount  = allEvents.filter(e => e.event_date >= today).length
    const ingredients  = ingredientsRes.data || []
    const lowStock     = ingredients.filter(i => Number(i.current_stock) <= Number(i.alert_threshold))
    const mRevenue     = (monthPayRes.data || []).reduce((sum, p) => sum + Number(p.amount || 0), 0)

    setStats({
      events: activeCount,
      clients: clientsRes.count || 0,
      stockAlerts: lowStock.length,
      pendingPayments: activeCount,
      staff: staffRes.count || 0,
    })
    setUpcomingEvents(upcoming)
    setRecentPayments(paymentsRes.data || [])
    setStockAlerts(lowStock.slice(0, 5))
    setMonthRevenue(mRevenue)
    setLoading(false)
  }

  /* payment badge styles */
  const payBadge = {
    deposit: { background: 'rgba(250,204,21,0.15)', color: '#facc15' },
    balance: { background: 'rgba(74,222,128,0.15)', color: '#4ade80' },
    partial: { background: 'rgba(96,165,250,0.15)', color: '#60a5fa' },
    refund:  { background: 'rgba(248,113,113,0.15)', color: '#f87171' },
  }
  const payLabel = {
    deposit: 'Acompte',
    balance: 'Solde',
    partial: 'Partiel',
    refund:  'Remboursement',
  }

  const kpiCards = [
    { icon: '📅', label: t(lang, 'eventsAVenir'), value: stats.events,     color: '#4ade80', trend: '+2', trendUp: true,  route: '/evenements' },
    { icon: '👤', label: t(lang, 'clients'),       value: stats.clients,    color: '#60a5fa', trend: '+5', trendUp: true,  route: '/evenements' },
    { icon: '💰', label: t(lang, 'revenuesMois'),  value: fmt(monthRevenue) + ' MAD', color: '#c9a84c', trend: '', route: '/paiements', isText: true },
    { icon: '📦', label: t(lang, 'alertesStock'),  value: stats.stockAlerts, color: stats.stockAlerts > 0 ? '#f87171' : '#4ade80', trend: stats.stockAlerts > 0 ? '⚠' : '✓', trendUp: stats.stockAlerts === 0, route: '/stock' },
  ]

  const eventTypeSegments = [
    { pct: 69, color: '#c9a84c', label: 'Mariages',  val: '69%' },
    { pct: 20, color: '#4ade80', label: 'Corporate', val: '20%' },
    { pct: 11, color: '#60a5fa', label: 'Privé',     val: '11%' },
  ]
  const revenueSegments = [
    { pct: 50, color: '#c9a84c', label: 'Traiteur',   val: '50%' },
    { pct: 30, color: '#4ade80', label: 'Pâtisserie', val: '30%' },
    { pct: 20, color: '#60a5fa', label: 'Décoration', val: '20%' },
  ]

  const today = new Date().toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#4b5563', fontSize: 14 }}>{t(lang, 'loading')}</div>
    </div>
  )

  return (
    <div style={{ ...S.page, direction: isRTL ? 'rtl' : 'ltr' }}>

      {/* ── HEADER ── */}
      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}>{t(lang, 'dashboard')}</h1>
          <p style={S.subtitle}>{t(lang, 'welcome')}, {profile?.name} 👋</p>
        </div>
        <span style={S.dateBadge}>{today}</span>
      </div>

      {/* ── SECTION 1 — KPI CARDS ── */}
      <div style={S.kpiGrid}>
        {kpiCards.map(c => (
          <div key={c.label} style={S.kpiCard}
            onClick={() => navigate(c.route)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#252836'; e.currentTarget.style.transform = 'none' }}
          >
            {/* glow blob */}
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: c.color, borderRadius: '50%', opacity: 0.07, filter: 'blur(16px)' }} />
            <div style={S.kpiIcon}>{c.icon}</div>
            <div style={{ ...S.kpiVal, color: c.color, fontSize: c.isText ? 22 : 32 }}>{c.value}</div>
            <div style={S.kpiLabel}>{c.label}</div>
            {c.trend && (
              <div style={{ ...S.kpiTrend, background: c.trendUp ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)', color: c.trendUp ? '#4ade80' : '#f87171' }}>
                {c.trend}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── SECTION 2 — DONUT CHARTS ── */}
      <div style={S.donutRow}>
        {/* Types d'événements */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardTitle}>Types d'événements</span>
            <span style={{ ...S.badge, background: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}>2025</span>
          </div>
          <div style={S.donutInner}>
            <DonutChart segments={eventTypeSegments} centerLabel={stats.events.toString()} />
            <div style={S.legend}>
              {eventTypeSegments.map(s => (
                <div key={s.label} style={S.legendItem}>
                  <div style={{ ...S.legendDot, background: s.color }} />
                  <span style={{ color: '#9ca3af' }}>{s.label}</span>
                  <span style={S.legendVal}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenus par service */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardTitle}>Revenus par service</span>
            <span style={{ ...S.badge, background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>MAD</span>
          </div>
          <div style={S.donutInner}>
            <DonutChart segments={revenueSegments} centerLabel="100%" />
            <div style={S.legend}>
              {revenueSegments.map(s => (
                <div key={s.label} style={S.legendItem}>
                  <div style={{ ...S.legendDot, background: s.color }} />
                  <span style={{ color: '#9ca3af' }}>{s.label}</span>
                  <span style={S.legendVal}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3 — LINE CHART ── */}
      <div style={S.lineCard}>
        <div style={{ ...S.cardHead, marginBottom: 20 }}>
          <div>
            <div style={S.cardTitle}>Performance mensuelle</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Revenus en MAD — Jan à Déc 2025</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#4ade80' }}>{fmt(PLACEHOLDER_REVENUE.reduce((a, b) => a + b, 0))} MAD</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>cumul annuel (estimé)</div>
          </div>
        </div>
        <LineChart data={PLACEHOLDER_REVENUE} color="#4ade80" />
      </div>

      {/* ── SECTION 4 — ACTIVITÉ RÉCENTE + GUIDES ── */}
      <div style={S.bottomRow}>

        {/* Activité récente */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardTitle}>📅 Activité récente</span>
            <button style={S.seeAll} onClick={() => navigate('/evenements')}>Voir tout →</button>
          </div>
          {upcomingEvents.length === 0 && recentPayments.length === 0 ? (
            <div style={S.empty}>Aucune activité récente</div>
          ) : (
            <>
              {upcomingEvents.slice(0, 3).map(ev => {
                const daysUntil = Math.ceil((new Date(ev.event_date) - new Date()) / 86400000)
                return (
                  <div key={ev.id} style={{ ...S.row, borderLeft: `3px solid ${jColor(daysUntil)}` }}>
                    <div>
                      <div style={S.rowTitle}>{ev.title}</div>
                      <div style={S.rowSub}>{ev.clients?.full_name || '—'}</div>
                    </div>
                    <div style={S.rowRight}>
                      <div style={S.rowDate}>{new Date(ev.event_date).toLocaleDateString(dateLocale, { day: '2-digit', month: 'short' })}</div>
                      <div style={{ ...S.badge, background: `${jColor(daysUntil)}1a`, color: jColor(daysUntil), marginTop: 4 }}>J-{daysUntil}</div>
                    </div>
                  </div>
                )
              })}
              {recentPayments.slice(0, 2).map(p => (
                <div key={p.id} style={S.row}>
                  <div>
                    <div style={S.rowTitle}>{p.events?.title || '—'}</div>
                    <div style={{ ...(payBadge[p.payment_type] || {}), ...S.badge, marginTop: 4 }}>
                      {payLabel[p.payment_type] || p.payment_type}
                    </div>
                  </div>
                  <div style={S.rowRight}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80' }}>+{fmt(p.amount)} MAD</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                      {p.payment_date ? new Date(p.payment_date).toLocaleDateString(dateLocale, { day: '2-digit', month: 'short' }) : '—'}
                    </div>
                  </div>
                </div>
              ))}
              {stockAlerts.length > 0 && stockAlerts.slice(0, 2).map(i => (
                <div key={i.id} style={{ ...S.row, borderLeft: '3px solid #f87171' }}>
                  <div>
                    <div style={S.rowTitle}>{i.name_fr}</div>
                    <div style={{ ...S.badge, background: 'rgba(248,113,113,0.12)', color: '#f87171', marginTop: 4 }}>Stock bas</div>
                  </div>
                  <div style={S.rowRight}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>{fmt(i.current_stock, 1)} {i.unit}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>seuil: {fmt(i.alert_threshold, 1)}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Guides rapides */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardTitle}>⚡ Guides rapides</span>
          </div>

          {[
            { icon: '🧮', bg: 'rgba(201,168,76,0.15)',  color: '#c9a84c', title: 'Configurer vos Fiches Techniques',   sub: 'Calculateur → Recettes et coûts',     route: '/calculateur' },
            { icon: '📄', bg: 'rgba(96,165,250,0.15)',   color: '#60a5fa', title: 'Gérer les Factures Fournisseurs',    sub: 'Devis → Factures et bons de commande', route: '/devis'       },
            { icon: '🔒', bg: 'rgba(167,139,250,0.15)',  color: '#a78bfa', title: 'Paramétrer les Permissions',         sub: 'Paramètres → Accès et rôles',          route: '/settings'    },
            { icon: '📦', bg: 'rgba(248,113,113,0.15)',  color: '#f87171', title: 'Gérer le Stock',                     sub: 'Stock → Seuils et alertes',            route: '/stock'       },
            { icon: '💳', bg: 'rgba(74,222,128,0.15)',   color: '#4ade80', title: 'Enregistrer un Paiement',            sub: 'Paiements → Nouveau règlement',        route: '/paiements'   },
          ].map(g => (
            <div key={g.title} style={S.guideItem}
              onClick={() => navigate(g.route)}
              onMouseEnter={e => e.currentTarget.style.background = '#1a1d27'}
              onMouseLeave={e => e.currentTarget.style.background = '#13151f'}
            >
              <div style={{ ...S.guideIcon, background: g.bg, color: g.color }}>{g.icon}</div>
              <div>
                <div style={S.guideTitle}>{g.title}</div>
                <div style={S.guideSub}>{g.sub}</div>
              </div>
              <div style={{ marginLeft: 'auto', color: '#4b5563', fontSize: 14 }}>›</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
