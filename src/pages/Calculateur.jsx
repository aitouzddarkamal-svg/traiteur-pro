import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import DateInput from '../components/DateInput'

const styles = {
  page: { padding: '2rem', maxWidth: '960px', margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: '600', color: '#1a1a18', marginBottom: '4px' },
  subtitle: { fontSize: '0.9rem', color: '#6b6b66', marginBottom: '2rem' },
  card: { background: '#fff', border: '1px solid #e5e4e0', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' },
  cardTitle: { fontSize: '1rem', fontWeight: '600', color: '#1a1a18', marginBottom: '1rem' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' },
  grid4: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b6b66', marginBottom: '4px' },
  select: { width: '100%', padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: '6px', fontSize: '0.9rem', background: '#fff', color: '#1a1a18', outline: 'none' },
  input: { padding: '6px 8px', border: '1px solid #e5e4e0', borderRadius: '6px', fontSize: '0.875rem', background: '#f9f8f5', color: '#1a1a18', outline: 'none', boxSizing: 'border-box', textAlign: 'center' },
  inputFull: { width: '100%', padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: '6px', fontSize: '0.9rem', background: '#fff', color: '#1a1a18', outline: 'none', boxSizing: 'border-box' },
  inputEdited: { padding: '6px 8px', border: '2px solid #2d6a4f', borderRadius: '6px', fontSize: '0.875rem', background: '#f0fdf4', color: '#166534', outline: 'none', boxSizing: 'border-box', textAlign: 'center', fontWeight: '600' },
  statBox: { background: '#f9f8f5', borderRadius: '8px', padding: '1rem', textAlign: 'center' },
  statNum: { fontSize: '1.8rem', fontWeight: '700', color: '#2d6a4f' },
  statLabel: { fontSize: '0.75rem', color: '#6b6b66', marginTop: '2px' },
  btn: { padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' },
  btnPrimary: { background: '#2d6a4f', color: '#fff' },
  btnDanger: { background: '#fee2e2', color: '#dc2626' },
  btnPDF: { background: '#1d4ed8', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', marginTop: '1rem', marginRight: '0.75rem' },
  btnSave: { background: '#2d6a4f', color: '#fff', padding: '10px 24px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', marginTop: '1rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b6b66', padding: '8px 10px', borderBottom: '2px solid #e5e4e0', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '10px 10px', fontSize: '0.875rem', color: '#1a1a18', borderBottom: '1px solid #f0efeb', verticalAlign: 'middle' },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '500' },
  alert: { padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' },
  successAlert: { background: '#dcfce7', color: '#166534' },
  errorAlert: { background: '#fee2e2', color: '#dc2626' },
  divider: { border: 'none', borderTop: '1px solid #e5e4e0', margin: '1.5rem 0' },
  addRow: { display: 'flex', gap: '1rem', alignItems: 'flex-end' },
  emptyState: { textAlign: 'center', padding: '2rem', color: '#6b6b66', fontSize: '0.875rem' },
  tip: { fontSize: '0.72rem', color: '#6b6b66', marginTop: '2px' },
  recalcBadge: { display: 'inline-block', background: '#fef9c3', color: '#854d0e', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '99px', marginLeft: '4px', fontWeight: '500' },
}

const categoryColors = {
  'entrée':  { background: '#dbeafe', color: '#1e40af' },
  'plat':    { background: '#dcfce7', color: '#166534' },
  'dessert': { background: '#fef9c3', color: '#854d0e' },
  'boisson': { background: '#f3e8ff', color: '#6b21a8' },
}

function getCategoryStyle(cat) {
  if (!cat) return { background: '#f0efeb', color: '#6b6b66' }
  const key = cat.toLowerCase()
  for (const k in categoryColors) { if (key.includes(k)) return categoryColors[k] }
  return { background: '#f0efeb', color: '#6b6b66' }
}

// ─── Quick Event Form ─────────────────────────────────────────────────────────
const emptyQuickForm = {
  client_mode: 'existing',
  client_id: '',
  client_name: '', client_phone: '', client_city: '',
  title: '', event_date: '',
  tables_count: '1',       // min 1 — DB constraint: tables_count > 0
  guests_per_table: '1',   // min 1 — DB constraint: guests_per_table > 0
  waste_buffer_pct: '10',
}

function QuickEventForm({ clients, onCreated, onCancel, profile }) {
  const [form, setForm] = useState(emptyQuickForm)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  async function handleCreate() {
    if (!form.title || !form.event_date) { setErr('Titre et date sont obligatoires.'); return }
    if (form.client_mode === 'existing' && !form.client_id) { setErr('Choisissez un client existant.'); return }
    if (form.client_mode === 'new' && !form.client_name.trim()) { setErr('Le nom du client est obligatoire.'); return }

    const tables = parseInt(form.tables_count) || 1
    const guests = parseInt(form.guests_per_table) || 1
    if (tables < 1 || guests < 1) { setErr('Tables et invités/table doivent être au minimum 1.'); return }

    setSaving(true); setErr(null)

    let clientId = form.client_id
    if (form.client_mode === 'new') {
      const { data: newClient, error: cErr } = await supabase.from('clients').insert({
        full_name: form.client_name.trim(),
        phone: form.client_phone.trim() || null,
        city:  form.client_city.trim()  || null,
        business_id: profile?.business_id,
      }).select().single()
      if (cErr) { setErr('Erreur client: ' + cErr.message); setSaving(false); return }
      clientId = newClient.id
    }

    const { data: newEvent, error: eErr } = await supabase.from('events').insert({
      title:            form.title.trim(),
      client_id:        clientId,
      event_date:       form.event_date,
      tables_count:     tables,
      guests_per_table: guests,
      waste_buffer_pct: parseFloat(form.waste_buffer_pct) || 10,
      status:           'draft',   // DB accepts: draft | confirmed | completed | cancelled
      business_id:      profile?.business_id,
    }).select('*, clients(full_name)').single()

    if (eErr) { setErr('Erreur: ' + eErr.message); setSaving(false); return }
    setSaving(false)
    onCreated(newEvent)
  }

  const totalGuests = parseInt(form.tables_count || 1) * parseInt(form.guests_per_table || 1)
  const withWaste = Math.ceil(totalGuests * (1 + parseFloat(form.waste_buffer_pct || 0) / 100))

  return (
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1.25rem', marginTop: '1rem' }}>
      <div style={{ fontWeight: '600', color: '#166534', marginBottom: '1rem', fontSize: '0.95rem' }}>
        ⚡ Création rapide — Client + Événement
      </div>

      {err && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>{err}</div>}

      {/* Client mode toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {[['existing', '👤 Client existant'], ['new', '+ Nouveau client']].map(([mode, label]) => (
          <button key={mode} onClick={() => f('client_mode', mode)}
            style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
              background: form.client_mode === mode ? '#2d6a4f' : '#e5e4e0',
              color: form.client_mode === mode ? '#fff' : '#6b6b66' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Client fields */}
      {form.client_mode === 'existing' ? (
        <div style={{ marginBottom: '1rem' }}>
          <label style={styles.label}>Client *</label>
          <select style={styles.select} value={form.client_id} onChange={e => f('client_id', e.target.value)}>
            <option value="">-- Choisir --</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}{c.city ? ` — ${c.city}` : ''}</option>)}
          </select>
        </div>
      ) : (
        <div style={{ ...styles.grid3, marginBottom: '1rem' }}>
          <div>
            <label style={styles.label}>Nom complet *</label>
            <input style={styles.inputFull} placeholder="Famille Alaoui" value={form.client_name} onChange={e => f('client_name', e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Téléphone</label>
            <input style={styles.inputFull} placeholder="06 12 34 56 78" value={form.client_phone} onChange={e => f('client_phone', e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Ville</label>
            <input style={styles.inputFull} placeholder="Agadir" value={form.client_city} onChange={e => f('client_city', e.target.value)} />
          </div>
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid #bbf7d0', margin: '0.75rem 0' }} />

      {/* Event fields */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={styles.label}>Titre de l'événement *</label>
        <input style={styles.inputFull} placeholder="ex: Mariage Alaoui — Juillet 2026" value={form.title} onChange={e => f('title', e.target.value)} />
      </div>

      <div style={{ ...styles.grid4, marginBottom: '0.75rem' }}>
        <div>
          <label style={styles.label}>Date *</label>
          <DateInput style={styles.inputFull} value={form.event_date} onChange={e => f('event_date', e.target.value)} />
        </div>
        <div>
          <label style={styles.label}>Nb tables (min 1)</label>
          <input type="number" min="1" style={styles.inputFull} value={form.tables_count} onChange={e => f('tables_count', e.target.value)} />
        </div>
        <div>
          <label style={styles.label}>Invités / table (min 1)</label>
          <input type="number" min="1" style={styles.inputFull} value={form.guests_per_table} onChange={e => f('guests_per_table', e.target.value)} />
        </div>
        <div>
          <label style={styles.label}>Marge %</label>
          <input type="number" min="0" max="50" style={styles.inputFull} value={form.waste_buffer_pct} onChange={e => f('waste_buffer_pct', e.target.value)} />
        </div>
      </div>

      {/* Live preview */}
      <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px 12px', fontSize: '0.82rem', color: '#166534', marginBottom: '0.75rem' }}>
        👥 Total invités : <strong>{totalGuests}</strong> — Avec marge {form.waste_buffer_pct}% : <strong>{withWaste}</strong>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button onClick={handleCreate} disabled={saving}
          style={{ padding: '9px 20px', background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
          {saving ? 'Création...' : '✓ Créer et sélectionner'}
        </button>
        <button onClick={onCancel}
          style={{ padding: '9px 16px', background: '#f0efeb', color: '#6b6b66', border: 'none', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer' }}>
          Annuler
        </button>
      </div>
    </div>
  )
}

// ─── PDF Generator ────────────────────────────────────────────────────────────
function generatePDF(event, eventDishes, totalGuests, totalWithWaste, dishes) {
  const date = event.event_date ? new Date(event.event_date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'
  const printDate = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
  const totalUnits = eventDishes.reduce((s, ed) => s + (ed.units_count || 0), 0)
  const rows = eventDishes.map(ed => {
    const dish = ed.dishes || dishes.find(d => d.id === ed.dish_id)
    const defaultServes = dish?.serves_per_unit || 1
    const isCustom = ed.custom_serves !== defaultServes
    return `<tr>
      <td>${dish?.name_fr || '—'}${dish?.name_ar ? `<br/><span style="font-size:11px;color:#888;direction:rtl">${dish.name_ar}</span>` : ''}</td>
      <td style="text-align:center">${dish?.category || '—'}</td>
      <td style="text-align:center">${ed.custom_serves}${isCustom ? ` <span style="color:#854d0e;font-size:10px">(défaut: ${defaultServes})</span>` : ''}</td>
      <td style="text-align:center;font-weight:700;color:#166534">${ed.units_count}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
<title>Bon de commande — ${event.title}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:13px;color:#1a1a18;padding:32px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:3px solid #2d6a4f;padding-bottom:16px}
  .brand{font-size:22px;font-weight:700;color:#2d6a4f}.brand-sub{font-size:12px;color:#6b6b66;margin-top:2px}
  .doc-title{font-size:18px;font-weight:700;text-align:right}.doc-date{font-size:11px;color:#6b6b66;text-align:right;margin-top:4px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
  .info-box{background:#f9f8f5;border-radius:8px;padding:12px 16px}
  .info-box h3{font-size:11px;color:#6b6b66;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
  .info-row{display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px}
  .info-row span:last-child{font-weight:600}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px}
  .stat{background:#f0fdf4;border-radius:6px;padding:10px;text-align:center;border:1px solid #bbf7d0}
  .stat-num{font-size:22px;font-weight:700;color:#166534}.stat-label{font-size:10px;color:#6b6b66;margin-top:2px}
  table{width:100%;border-collapse:collapse;margin-bottom:24px}
  thead tr{background:#2d6a4f;color:#fff}
  th{padding:10px 12px;font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:.05em;font-weight:600}
  td{padding:10px 12px;border-bottom:1px solid #e5e4e0;font-size:13px}
  tbody tr:nth-child(even){background:#f9f8f5}
  .total-row td{font-weight:700;font-size:14px;background:#f0fdf4}
  .footer{border-top:1px solid #e5e4e0;padding-top:12px;font-size:11px;color:#6b6b66;display:flex;justify-content:space-between}
  @media print{button{display:none}}
</style></head><body>
<div class="header">
  <div><div class="brand">🍽 Traiteur Pro</div><div class="brand-sub">Gestion de traiteur professionnelle</div></div>
  <div><div class="doc-title">BON DE COMMANDE</div><div class="doc-date">Imprimé le ${printDate}</div></div>
</div>
<div class="info-grid">
  <div class="info-box"><h3>Informations événement</h3>
    <div class="info-row"><span>Événement</span><span>${event.title}</span></div>
    <div class="info-row"><span>Client</span><span>${event.clients?.full_name || '—'}</span></div>
    <div class="info-row"><span>Date</span><span>${date}</span></div>
  </div>
  <div class="info-box"><h3>Configuration invités</h3>
    <div class="info-row"><span>Tables</span><span>${event.tables_count || 0}</span></div>
    <div class="info-row"><span>Invités / table</span><span>${event.guests_per_table || 0}</span></div>
    <div class="info-row"><span>Total invités</span><span>${totalGuests}</span></div>
    <div class="info-row"><span>Marge</span><span>${event.waste_buffer_pct || 0}%</span></div>
  </div>
</div>
<div class="stats">
  <div class="stat"><div class="stat-num">${totalGuests}</div><div class="stat-label">Invités</div></div>
  <div class="stat"><div class="stat-num">${totalWithWaste}</div><div class="stat-label">Avec marge</div></div>
  <div class="stat"><div class="stat-num">${eventDishes.length}</div><div class="stat-label">Plats</div></div>
  <div class="stat"><div class="stat-num">${totalUnits}</div><div class="stat-label">Total unités</div></div>
</div>
<table>
  <thead><tr><th>Plat</th><th style="text-align:center">Catégorie</th><th style="text-align:center">Portions/unité</th><th style="text-align:center">Unités</th></tr></thead>
  <tbody>${rows}<tr class="total-row"><td colspan="3">TOTAL UNITÉS</td><td style="text-align:center;color:#166534">${totalUnits}</td></tr></tbody>
</table>
<div class="footer"><span>Traiteur Pro</span><span>${event.title} | ${date}</span></div>
<br/><button onclick="window.print()" style="background:#2d6a4f;color:#fff;padding:10px 24px;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;">🖨 Imprimer / PDF</button>
</body></html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.focus()
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Calculateur() {
  const { profile } = useAuth()
  const [events, setEvents] = useState([])
  const [clients, setClients] = useState([])
  const [dishes, setDishes] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [eventDishes, setEventDishes] = useState([])
  const [selectedDish, setSelectedDish] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [showQuickForm, setShowQuickForm] = useState(false)
  const [dishCosts, setDishCosts] = useState({}) // { dish_id: cost_per_dish_unit (MAD) }

  useEffect(() => {
    async function loadData() {
      const [{ data: eventsData }, { data: dishesData }, { data: clientsData }] = await Promise.all([
        supabase.from('events').select('*, clients(full_name)').eq('business_id', profile.business_id).order('event_date', { ascending: false }),
        supabase.from('dishes').select('*').order('category'),
        supabase.from('clients').select('id, full_name, city').eq('business_id', profile.business_id).order('full_name'),
      ])
      setEvents(eventsData || [])
      setDishes(dishesData || [])
      setClients(clientsData || [])
    }
    loadData()
  }, [])

  // Fetch live ingredient prices and compute cost per dish unit.
  // cost_per_unit = SUM(dish_ingredient.quantity × ingredient.price_per_unit)
  // Recipe quantities are never modified here — only prices change the cost.
  async function loadDishCosts(dishIds) {
    if (!dishIds.length) return
    const { data } = await supabase
      .from('dish_ingredients')
      .select('dish_id, quantity, ingredients(price_per_unit)')
      .in('dish_id', dishIds)
    if (!data) return
    const costs = {}
    for (const row of data) {
      const price = row.ingredients?.price_per_unit
      if (price == null) continue
      costs[row.dish_id] = (costs[row.dish_id] || 0) + (row.quantity || 0) * price
    }
    setDishCosts(prev => ({ ...prev, ...costs }))
  }

  async function handleSelectEvent(eventId) {
    if (!eventId) { setSelectedEvent(null); setEventDishes([]); return }
    setLoading(true)
    const event = events.find(e => e.id === eventId)
    setSelectedEvent(event)
    const { data } = await supabase.from('event_dishes').select('*, dishes(id, name_fr, name_ar, category, serves_per_unit)').eq('event_id', eventId)
    const rows = (data || []).map(ed => ({ ...ed, custom_serves: ed.dishes?.serves_per_unit || 1 }))
    setEventDishes(rows)
    const dishIds = [...new Set(rows.map(ed => ed.dish_id).filter(Boolean))]
    await loadDishCosts(dishIds)
    setLoading(false)
  }

  async function handleEventCreated(newEvent) {
    const { data } = await supabase.from('events').select('*, clients(full_name)').eq('business_id', profile.business_id).order('event_date', { ascending: false })
    setEvents(data || [])
    setSelectedEvent(newEvent)
    setEventDishes([])
    setShowQuickForm(false)
    setMessage({ type: 'success', text: `✓ Événement "${newEvent.title}" créé et sélectionné.` })
    setTimeout(() => setMessage(null), 4000)
  }

  const totalGuests = selectedEvent ? (selectedEvent.tables_count || 0) * (selectedEvent.guests_per_table || 0) : 0
  const wasteMultiplier = selectedEvent ? 1 + (selectedEvent.waste_buffer_pct || 0) / 100 : 1
  const totalWithWaste = Math.ceil(totalGuests * wasteMultiplier)

  function calcUnits(dish, customServes) {
    const serves = customServes || dish?.serves_per_unit || 1
    return Math.ceil(totalWithWaste / serves)
  }

  function handleAddDish() {
    if (!selectedDish) return
    const dish = dishes.find(d => d.id === selectedDish)
    if (!dish) return
    if (eventDishes.find(ed => ed.dish_id === dish.id || ed.dishes?.id === dish.id)) {
      setMessage({ type: 'error', text: 'Ce plat est déjà ajouté.' })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    const customServes = dish.serves_per_unit || 1
    setEventDishes(prev => [...prev, { id: `new_${dish.id}`, dish_id: dish.id, dishes: dish, units_count: calcUnits(dish, customServes), custom_serves: customServes, isNew: true }])
    loadDishCosts([dish.id])
    setSelectedDish('')
  }

  function handleUpdateServes(id, value) {
    const serves = parseInt(value) || 1
    setEventDishes(prev => prev.map(ed => {
      if (ed.id !== id) return ed
      const dish = ed.dishes || dishes.find(d => d.id === ed.dish_id)
      return { ...ed, custom_serves: serves, units_count: calcUnits(dish, serves) }
    }))
  }

  function handleUpdateUnits(id, value) {
    setEventDishes(prev => prev.map(ed => ed.id === id ? { ...ed, units_count: parseInt(value) || 0 } : ed))
  }

  function handleResetServes(id) {
    setEventDishes(prev => prev.map(ed => {
      if (ed.id !== id) return ed
      const dish = ed.dishes || dishes.find(d => d.id === ed.dish_id)
      const def = dish?.serves_per_unit || 1
      return { ...ed, custom_serves: def, units_count: calcUnits(dish, def) }
    }))
  }

  function handleRemoveDish(id) { setEventDishes(prev => prev.filter(ed => ed.id !== id)) }

  async function handleSave() {
    if (!selectedEvent) return
    setSaving(true)
    setMessage(null)
    try {
      await supabase.from('event_dishes').delete().eq('event_id', selectedEvent.id)
      if (eventDishes.length > 0) {
        const toInsert = eventDishes.map(ed => ({ event_id: selectedEvent.id, dish_id: ed.dish_id || ed.dishes?.id, units_count: ed.units_count }))
        const { error } = await supabase.from('event_dishes').insert(toInsert)
        if (error) throw error
      }
      const { data } = await supabase.from('event_dishes').select('*, dishes(id, name_fr, name_ar, category, serves_per_unit)').eq('event_id', selectedEvent.id)
      setEventDishes((data || []).map(ed => ({ ...ed, custom_serves: ed.dishes?.serves_per_unit || 1 })))
      setMessage({ type: 'success', text: '✓ Commande sauvegardée avec succès.' })
      setTimeout(() => setMessage(null), 4000)
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde. Réessayez.' })
    }
    setSaving(false)
  }

  const availableDishes = dishes.filter(d => !eventDishes.find(ed => ed.dish_id === d.id || ed.dishes?.id === d.id))
  const totalUnits = eventDishes.reduce((sum, ed) => sum + (ed.units_count || 0), 0)
  const totalCost = eventDishes.reduce((sum, ed) => {
    const cost = dishCosts[ed.dish_id] ?? 0
    return sum + cost * (ed.units_count || 0)
  }, 0)

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Calculateur de commande</h1>
      <p style={styles.subtitle}>Sélectionnez un événement, ajoutez des plats et calculez automatiquement les quantités nécessaires.</p>

      {message && (
        <div style={{ ...styles.alert, ...(message.type === 'success' ? styles.successAlert : styles.errorAlert) }}>
          {message.text}
        </div>
      )}

      {/* Step 1 */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>① Sélectionner un événement</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
          <label style={{ ...styles.label, marginBottom: 0 }}>Événement existant</label>
          <button onClick={() => setShowQuickForm(v => !v)}
            style={{ fontSize: '13px', fontWeight: '600', color: '#fff', background: showQuickForm ? '#6b6b66' : '#2d6a4f', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer' }}>
            {showQuickForm ? '✕ Annuler' : '+ Nouvel événement'}
          </button>
        </div>
        <select style={styles.select} value={selectedEvent?.id || ''} onChange={e => { handleSelectEvent(e.target.value); setShowQuickForm(false) }}>
          <option value="">-- Choisir un événement --</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>
              {ev.title} — {ev.clients?.full_name || '?'} — {ev.event_date ? new Date(ev.event_date).toLocaleDateString('fr-FR') : ''}
            </option>
          ))}
        </select>
        {showQuickForm && (
          <QuickEventForm clients={clients} onCreated={handleEventCreated} onCancel={() => setShowQuickForm(false)} profile={profile} />
        )}
      </div>

      {/* Step 2 */}
      {selectedEvent && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>② Résumé de l'événement</div>
          <div style={styles.grid3}>
            <div style={styles.statBox}><div style={styles.statNum}>{selectedEvent.tables_count || 0}</div><div style={styles.statLabel}>Tables</div></div>
            <div style={styles.statBox}><div style={styles.statNum}>{selectedEvent.guests_per_table || 0}</div><div style={styles.statLabel}>Invités / table</div></div>
            <div style={styles.statBox}><div style={styles.statNum}>{totalGuests}</div><div style={styles.statLabel}>Total invités</div></div>
            <div style={styles.statBox}><div style={{ ...styles.statNum, color: '#d97706' }}>{selectedEvent.waste_buffer_pct || 0}%</div><div style={styles.statLabel}>Marge gaspillage</div></div>
            <div style={styles.statBox}><div style={{ ...styles.statNum, color: '#7c3aed' }}>{totalWithWaste}</div><div style={styles.statLabel}>Invités + marge</div></div>
            <div style={styles.statBox}><div style={{ ...styles.statNum, color: '#dc2626' }}>{totalUnits}</div><div style={styles.statLabel}>Total unités</div></div>
            <div style={styles.statBox}><div style={{ ...styles.statNum, color: '#1d4ed8', fontSize: '1.4rem' }}>{totalCost > 0 ? totalCost.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</div><div style={styles.statLabel}>Coût total estimé (MAD)</div></div>
          </div>
          <div style={{ marginTop: '1rem', padding: '10px 14px', background: '#f0fdf4', borderRadius: '6px', fontSize: '0.8rem', color: '#166534' }}>
            <strong>Formule:</strong> (Tables × Invités/table) × (1 + Marge%) ÷ Portions/unité = Unités à commander
          </div>
        </div>
      )}

      {/* Step 3 */}
      {selectedEvent && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>③ Ajouter des plats</div>
          <div style={styles.addRow}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Plat</label>
              <select style={styles.select} value={selectedDish} onChange={e => setSelectedDish(e.target.value)}>
                <option value="">-- Choisir un plat --</option>
                {availableDishes.map(d => (
                  <option key={d.id} value={d.id}>{d.name_fr} ({d.category}) — défaut: {d.serves_per_unit} portions/unité</option>
                ))}
              </select>
            </div>
            <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleAddDish} disabled={!selectedDish}>+ Ajouter</button>
          </div>
          <hr style={styles.divider} />
          {loading ? (
            <div style={styles.emptyState}>Chargement...</div>
          ) : eventDishes.length === 0 ? (
            <div style={styles.emptyState}>Aucun plat ajouté. Sélectionnez un plat ci-dessus.</div>
          ) : (
            <>
              <div style={{ fontSize: '0.78rem', color: '#92400e', marginBottom: '0.75rem', padding: '8px 12px', background: '#fef9c3', borderRadius: '6px' }}>
                💡 Modifiez <strong>Portions/unité</strong> pour adapter le calcul. Le bouton ↺ remet la valeur par défaut.
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Plat</th>
                    <th style={styles.th}>Catégorie</th>
                    <th style={{ ...styles.th, minWidth: '120px' }}>Portions/unité<br/><span style={{ fontWeight: '400', textTransform: 'none', fontSize: '0.7rem', color: '#2d6a4f' }}>✎ modifiable</span></th>
                    <th style={styles.th}>Unités calculées</th>
                    <th style={{ ...styles.th, minWidth: '100px' }}>Unités finales</th>
                    <th style={styles.th}>Coût/unité</th>
                    <th style={styles.th}>Coût total</th>
                    <th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {eventDishes.map(ed => {
                    const dish = ed.dishes || dishes.find(d => d.id === ed.dish_id)
                    const defaultServes = dish?.serves_per_unit || 1
                    const isCustom = ed.custom_serves !== defaultServes
                    const calculated = calcUnits(dish, ed.custom_serves)
                    return (
                      <tr key={ed.id}>
                        <td style={styles.td}>
                          <div style={{ fontWeight: '500' }}>{dish?.name_fr}</div>
                          {dish?.name_ar && <div style={{ fontSize: '0.75rem', color: '#6b6b66', direction: 'rtl' }}>{dish.name_ar}</div>}
                        </td>
                        <td style={styles.td}><span style={{ ...styles.badge, ...getCategoryStyle(dish?.category) }}>{dish?.category || '—'}</span></td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input type="number" min="1" style={{ ...(isCustom ? styles.inputEdited : styles.input), width: '64px' }} value={ed.custom_serves} onChange={e => handleUpdateServes(ed.id, e.target.value)} />
                            {isCustom && <button onClick={() => handleResetServes(ed.id)} title={`Réinitialiser (${defaultServes})`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6b66', fontSize: '1rem', padding: '2px' }}>↺</button>}
                          </div>
                          {isCustom && <div style={styles.tip}>défaut: {defaultServes}</div>}
                        </td>
                        <td style={styles.td}>
                          <span style={{ color: '#2d6a4f', fontWeight: '700', fontSize: '1rem' }}>{calculated}</span>
                          {isCustom && <span style={styles.recalcBadge}>recalculé</span>}
                        </td>
                        <td style={styles.td}><input type="number" min="0" style={{ ...styles.input, width: '70px' }} value={ed.units_count} onChange={e => handleUpdateUnits(ed.id, e.target.value)} /></td>
                        <td style={styles.td}>
                          {dishCosts[ed.dish_id] != null
                            ? <span style={{ fontSize: '0.85rem', color: '#6b6b66' }}>{dishCosts[ed.dish_id].toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            : <span style={{ color: '#d1d5db', fontSize: '0.8rem' }}>—</span>}
                        </td>
                        <td style={styles.td}>
                          {dishCosts[ed.dish_id] != null
                            ? <span style={{ fontWeight: '600', color: '#1d4ed8', fontSize: '0.9rem' }}>{(dishCosts[ed.dish_id] * (ed.units_count || 0)).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            : <span style={{ color: '#d1d5db', fontSize: '0.8rem' }}>—</span>}
                        </td>
                        <td style={styles.td}><button style={{ ...styles.btn, ...styles.btnDanger, padding: '6px 10px' }} onClick={() => handleRemoveDish(ed.id)}>✕</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          )}
          {eventDishes.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button style={styles.btnPDF} onClick={() => generatePDF(selectedEvent, eventDishes, totalGuests, totalWithWaste, dishes)}>🖨 Exporter / Imprimer PDF</button>
              <button style={styles.btnSave} onClick={handleSave} disabled={saving}>{saving ? 'Sauvegarde...' : '💾 Sauvegarder la commande'}</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
