import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const S = {
  page: { padding: '2rem', maxWidth: '960px', margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: '600', color: '#1a1a18', marginBottom: '4px' },
  subtitle: { fontSize: '0.9rem', color: '#6b6b66', marginBottom: '2rem' },
  card: { background: '#fff', border: '1px solid #e5e4e0', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' },
  cardTitle: { fontSize: '1rem', fontWeight: '600', color: '#1a1a18', marginBottom: '1rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b6b66', marginBottom: '4px' },
  select: { width: '100%', padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: '6px', fontSize: '0.9rem', background: '#fff', color: '#1a1a18', outline: 'none' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b6b66', padding: '8px 12px', borderBottom: '2px solid #e5e4e0', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '10px 12px', fontSize: '0.875rem', color: '#1a1a18', borderBottom: '1px solid #f0efeb', verticalAlign: 'middle' },
  badge: { display: 'inline-block', padding: '2px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' },
  sectionHeader: { background: '#f9f8f5', padding: '8px 12px', fontWeight: '700', fontSize: '0.85rem', color: '#1a1a18', borderBottom: '1px solid #e5e4e0', letterSpacing: '0.03em' },
  statRow: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  statBox: { flex: 1, minWidth: '140px', background: '#f9f8f5', borderRadius: '8px', padding: '1rem', textAlign: 'center' },
  statNum: { fontSize: '1.6rem', fontWeight: '700', color: '#2d6a4f' },
  statLabel: { fontSize: '0.72rem', color: '#6b6b66', marginTop: '2px' },
  emptyState: { textAlign: 'center', padding: '3rem', color: '#6b6b66', fontSize: '0.9rem' },
  btnPDF: { background: '#1d4ed8', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
  progressBar: { height: '6px', borderRadius: '3px', background: '#e5e4e0', overflow: 'hidden', marginTop: '4px', width: '100px' },
  progressFill: (pct, ok) => ({ height: '100%', width: `${Math.min(pct, 100)}%`, background: ok ? '#2d6a4f' : '#dc2626', borderRadius: '3px', transition: 'width 0.3s' }),
}

const catColors = {
  'Viande':   { background: '#fee2e2', color: '#991b1b' },
  'Poisson':  { background: '#dbeafe', color: '#1e40af' },
  'Légume':   { background: '#dcfce7', color: '#166534' },
  'Épicerie': { background: '#fef9c3', color: '#854d0e' },
  'Fruit':    { background: '#fce7f3', color: '#9d174d' },
  'Laitier':  { background: '#e0f2fe', color: '#075985' },
}
function catStyle(c) {
  if (!c) return { background: '#f0efeb', color: '#6b6b66' }
  for (const k in catColors) if (c.includes(k)) return catColors[k]
  return { background: '#f0efeb', color: '#6b6b66' }
}

function fmt(n) {
  if (n === null || n === undefined) return '—'
  return Number.isInteger(n) ? n.toString() : parseFloat(n.toFixed(3)).toString()
}

function generatePDF(event, grouped, stats) {
  const date = event.event_date
    ? new Date(event.event_date).toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
    : '—'
  const printDate = new Date().toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'numeric' })

  let rows = ''
  for (const cat in grouped) {
    rows += `<tr><td colspan="5" style="background:#2d6a4f;color:#fff;font-weight:700;padding:8px 12px;font-size:12px">${cat}</td></tr>`
    grouped[cat].forEach(ing => {
      const ok = ing.current_stock >= ing.total_needed
      const missing = ok ? 0 : (ing.total_needed - ing.current_stock).toFixed(3)
      rows += `<tr style="${!ok ? 'background:#fff5f5' : ''}">
        <td>${ing.name_fr}${ing.name_ar ? `<br/><span style="font-size:10px;color:#888;direction:rtl">${ing.name_ar}</span>` : ''}</td>
        <td style="text-align:center">${ing.dishes.join(', ')}</td>
        <td style="text-align:center;font-weight:700;color:#166534">${fmt(ing.total_needed)} ${ing.unit}</td>
        <td style="text-align:center;color:#6b6b66">${fmt(ing.current_stock)} ${ing.unit}</td>
        <td style="text-align:center;font-weight:700;color:${ok ? '#166534' : '#dc2626'}">${ok ? '✓ OK' : `⚠ ${fmt(missing)} ${ing.unit}`}</td>
      </tr>`
    })
  }

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
  <title>Liste de courses — ${event.title}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;font-size:13px;color:#1a1a18;padding:32px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:3px solid #2d6a4f;padding-bottom:16px}
    .brand{font-size:22px;font-weight:700;color:#2d6a4f}
    .brand-sub{font-size:12px;color:#6b6b66;margin-top:2px}
    .doc-title{font-size:18px;font-weight:700;text-align:right}
    .doc-date{font-size:11px;color:#6b6b66;text-align:right;margin-top:4px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
    .info-box{background:#f9f8f5;border-radius:8px;padding:12px 16px}
    .info-box h3{font-size:11px;color:#6b6b66;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
    .info-row{display:flex;justify-content:space-between;margin-bottom:4px}
    .info-row span:last-child{font-weight:600}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
    .stat{background:#f0fdf4;border-radius:6px;padding:10px;text-align:center;border:1px solid #bbf7d0}
    .stat-num{font-size:20px;font-weight:700;color:#166534}
    .stat-label{font-size:10px;color:#6b6b66;margin-top:2px}
    .stat.warn{background:#fff5f5;border-color:#fca5a5}
    .stat.warn .stat-num{color:#dc2626}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{background:#2d6a4f;color:#fff;padding:10px 12px;font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:.05em}
    td{padding:9px 12px;border-bottom:1px solid #e5e4e0;font-size:13px}
    tbody tr:nth-child(even):not(.cat-row){background:#f9f8f5}
    .footer{border-top:1px solid #e5e4e0;padding-top:12px;font-size:11px;color:#6b6b66;display:flex;justify-content:space-between}
    @media print{button{display:none}}
  </style></head><body>
  <div class="header">
    <div><div class="brand">🍽 Traiteur Pro</div><div class="brand-sub">Gestion de traiteur professionnelle</div></div>
    <div><div class="doc-title">LISTE DE COURSES</div><div class="doc-date">Imprimé le ${printDate}</div></div>
  </div>
  <div class="info-grid">
    <div class="info-box"><h3>Événement</h3>
      <div class="info-row"><span>Nom</span><span>${event.title}</span></div>
      <div class="info-row"><span>Client</span><span>${event.clients?.full_name || '—'}</span></div>
      <div class="info-row"><span>Date</span><span>${date}</span></div>
    </div>
    <div class="info-box"><h3>Commande</h3>
      <div class="info-row"><span>Invités</span><span>${(event.tables_count||0)*(event.guests_per_table||0)}</span></div>
      <div class="info-row"><span>Plats différents</span><span>${stats.totalDishes}</span></div>
      <div class="info-row"><span>Ingrédients</span><span>${stats.totalIng}</span></div>
    </div>
  </div>
  <div class="stats">
    <div class="stat"><div class="stat-num">${stats.totalIng}</div><div class="stat-label">Ingrédients total</div></div>
    <div class="stat"><div class="stat-num">${stats.okCount}</div><div class="stat-label">En stock ✓</div></div>
    <div class="stat ${stats.missingCount > 0 ? 'warn' : ''}"><div class="stat-num">${stats.missingCount}</div><div class="stat-label">À acheter</div></div>
    <div class="stat"><div class="stat-num">${stats.totalDishes}</div><div class="stat-label">Plats</div></div>
  </div>
  <table>
    <thead><tr><th>Ingrédient</th><th>Utilisé dans</th><th style="text-align:center">Quantité nécessaire</th><th style="text-align:center">Stock actuel</th><th style="text-align:center">Statut</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>Traiteur Pro — Liste de courses générée automatiquement</span>
    <span>${event.title} | ${date}</span>
  </div>
  <br/>
  <button onclick="window.print()" style="background:#2d6a4f;color:#fff;padding:10px 24px;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600">🖨 Imprimer / Enregistrer en PDF</button>
  </body></html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.focus()
}

export default function ListeCourses() {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [grouped, setGrouped] = useState({})
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('events').select('*, clients(full_name)').order('event_date', { ascending: false })
      .then(({ data }) => setEvents(data || []))
  }, [])

  async function handleSelectEvent(eventId) {
    if (!eventId) { setSelectedEvent(null); setGrouped({}); return }
    setLoading(true)
    const event = events.find(e => e.id === eventId)
    setSelectedEvent(event)

    // Load event_dishes with dish info
    const { data: eventDishes } = await supabase
      .from('event_dishes')
      .select('units_count, dishes(id, name_fr, serves_per_unit)')
      .eq('event_id', eventId)

    if (!eventDishes || eventDishes.length === 0) {
      setGrouped({})
      setStats({ totalIng: 0, totalDishes: 0, okCount: 0, missingCount: 0 })
      setLoading(false)
      return
    }

    // Load all ingredients for all dishes in this event
    const dishIds = eventDishes.map(ed => ed.dishes?.id).filter(Boolean)
    const { data: dishIngData } = await supabase
      .from('dish_ingredients')
      .select('dish_id, quantity_per_unit, ingredients(id, name_fr, name_ar, unit, category, current_stock)')
      .in('dish_id', dishIds)

    // Aggregate: for each ingredient, sum across all dishes × units
    const ingMap = {}
    for (const di of (dishIngData || [])) {
      const ed = eventDishes.find(e => e.dishes?.id === di.dish_id)
      const units = ed?.units_count || 0
      const ing = di.ingredients
      if (!ing) continue
      const key = ing.id
      const totalQty = di.quantity_per_unit * units
      const dishName = ed?.dishes?.name_fr || '?'
      if (!ingMap[key]) {
        ingMap[key] = {
          id: ing.id,
          name_fr: ing.name_fr,
          name_ar: ing.name_ar,
          unit: ing.unit,
          category: ing.category || 'Autre',
          current_stock: ing.current_stock || 0,
          total_needed: 0,
          dishes: []
        }
      }
      ingMap[key].total_needed += totalQty
      if (!ingMap[key].dishes.includes(dishName)) ingMap[key].dishes.push(dishName)
    }

    // Group by category
    const grp = {}
    for (const ing of Object.values(ingMap)) {
      const cat = ing.category
      if (!grp[cat]) grp[cat] = []
      grp[cat].push(ing)
    }
    // Sort each category alphabetically
    for (const cat in grp) grp[cat].sort((a, b) => a.name_fr.localeCompare(b.name_fr))

    const allIng = Object.values(ingMap)
    const okCount = allIng.filter(i => i.current_stock >= i.total_needed).length
    setStats({
      totalIng: allIng.length,
      totalDishes: eventDishes.length,
      okCount,
      missingCount: allIng.length - okCount
    })
    setGrouped(grp)
    setLoading(false)
  }

  const hasData = Object.keys(grouped).length > 0

  return (
    <div style={S.page}>
      <h1 style={S.title}>Liste de courses</h1>
      <p style={S.subtitle}><div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#166534' }}>
  💡 <strong>Comment ça marche :</strong> Sélectionnez un événement → tous les ingrédients nécessaires apparaissent automatiquement, calculés depuis les recettes.
</div>Sélectionnez un événement pour voir tous les ingrédients nécessaires, calculés automatiquement depuis les recettes.</p>

      <div style={S.card}>
        <div style={S.cardTitle}>Sélectionner un événement</div>
        <label style={S.label}>Événement</label>
        <select style={S.select} value={selectedEvent?.id || ''} onChange={e => handleSelectEvent(e.target.value)}>
          <option value="">-- Choisir un événement --</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>
              {ev.title} — {ev.clients?.full_name || 'Client inconnu'} — {ev.event_date ? new Date(ev.event_date).toLocaleDateString('fr-FR') : ''}
            </option>
          ))}
        </select>
      </div>

      {loading && <div style={S.emptyState}>Calcul des ingrédients en cours...</div>}

      {!loading && selectedEvent && !hasData && (
        <div style={S.emptyState}>
          Aucune commande sauvegardée pour cet événement.<br/>
          <span style={{ fontSize: '0.8rem' }}>Allez dans le Calculateur, ajoutez des plats et sauvegardez la commande d'abord.</span>
        </div>
      )}

      {!loading && hasData && (
        <>
          {/* Stats */}
          <div style={S.statRow}>
            <div style={S.statBox}>
              <div style={S.statNum}>{stats.totalDishes}</div>
              <div style={S.statLabel}>Plats commandés</div>
            </div>
            <div style={S.statBox}>
              <div style={S.statNum}>{stats.totalIng}</div>
              <div style={S.statLabel}>Ingrédients total</div>
            </div>
            <div style={{ ...S.statBox, background: '#f0fdf4' }}>
              <div style={{ ...S.statNum, color: '#166534' }}>{stats.okCount}</div>
              <div style={S.statLabel}>En stock ✓</div>
            </div>
            <div style={{ ...S.statBox, background: stats.missingCount > 0 ? '#fff5f5' : '#f0fdf4' }}>
              <div style={{ ...S.statNum, color: stats.missingCount > 0 ? '#dc2626' : '#166534' }}>{stats.missingCount}</div>
              <div style={S.statLabel}>À acheter</div>
            </div>
          </div>

          {/* Ingredient Table grouped by category */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={S.cardTitle}>Détail des ingrédients par catégorie</div>
              <button style={S.btnPDF} onClick={() => generatePDF(selectedEvent, grouped, stats)}>
                🖨 Exporter PDF
              </button>
            </div>

            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Ingrédient</th>
                  <th style={S.th}>Utilisé dans</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>Quantité nécessaire</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>Stock actuel</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(grouped).map(([cat, ings]) => (
                  <>
                    <tr key={`cat_${cat}`}>
                      <td colSpan={5} style={S.sectionHeader}>
                        <span style={{ ...S.badge, ...catStyle(cat), marginRight: '8px' }}>{cat}</span>
                        {ings.length} ingrédient{ings.length > 1 ? 's' : ''}
                      </td>
                    </tr>
                    {ings.map(ing => {
                      const ok = ing.current_stock >= ing.total_needed
                      const pct = ing.total_needed > 0 ? (ing.current_stock / ing.total_needed) * 100 : 100
                      const missing = !ok ? (ing.total_needed - ing.current_stock) : 0
                      return (
                        <tr key={ing.id} style={{ background: ok ? 'transparent' : '#fff5f5' }}>
                          <td style={S.td}>
                            <div style={{ fontWeight: '500' }}>{ing.name_fr}</div>
                            {ing.name_ar && <div style={{ fontSize: '0.72rem', color: '#6b6b66', direction: 'rtl' }}>{ing.name_ar}</div>}
                          </td>
                          <td style={{ ...S.td, fontSize: '0.78rem', color: '#6b6b66' }}>
                            {ing.dishes.join(', ')}
                          </td>
                          <td style={{ ...S.td, textAlign: 'center' }}>
                            <span style={{ fontWeight: '700', color: '#166534', fontSize: '1rem' }}>{fmt(ing.total_needed)}</span>
                            <span style={{ fontSize: '0.75rem', color: '#6b6b66', marginLeft: '3px' }}>{ing.unit}</span>
                          </td>
                          <td style={{ ...S.td, textAlign: 'center' }}>
                            <div>{fmt(ing.current_stock)} <span style={{ fontSize: '0.75rem', color: '#6b6b66' }}>{ing.unit}</span></div>
                            <div style={S.progressBar}><div style={S.progressFill(pct, ok)} /></div>
                          </td>
                          <td style={{ ...S.td, textAlign: 'center' }}>
                            {ok ? (
                              <span style={{ ...S.badge, background: '#dcfce7', color: '#166534' }}>✓ En stock</span>
                            ) : (
                              <span style={{ ...S.badge, background: '#fee2e2', color: '#dc2626' }}>
                                ⚠ Manque {fmt(missing)} {ing.unit}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
