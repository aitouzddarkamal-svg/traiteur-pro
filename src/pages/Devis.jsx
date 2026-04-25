import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const S = {
  page: { padding: '2rem', maxWidth: '960px', margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: '600', color: '#1a1a18', marginBottom: '4px' },
  subtitle: { fontSize: '0.9rem', color: '#6b6b66', marginBottom: '2rem' },
  card: { background: '#fff', border: '1px solid #e5e4e0', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' },
  cardTitle: { fontSize: '1rem', fontWeight: '600', color: '#1a1a18', marginBottom: '1rem' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b6b66', marginBottom: '4px' },
  select: { width: '100%', padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: '6px', fontSize: '0.9rem', background: '#fff', color: '#1a1a18', outline: 'none' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: '6px', fontSize: '0.9rem', background: '#f9f8f5', color: '#1a1a18', outline: 'none', boxSizing: 'border-box' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b6b66', padding: '8px 12px', borderBottom: '2px solid #e5e4e0', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '10px 12px', fontSize: '0.875rem', color: '#1a1a18', borderBottom: '1px solid #f0efeb', verticalAlign: 'middle' },
  statBox: { background: '#f9f8f5', borderRadius: '8px', padding: '1rem', textAlign: 'center' },
  statNum: { fontSize: '1.6rem', fontWeight: '700', color: '#2d6a4f' },
  statLabel: { fontSize: '0.72rem', color: '#6b6b66', marginTop: '2px' },
  badge: { display: 'inline-block', padding: '2px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' },
  alert: { padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' },
  emptyState: { textAlign: 'center', padding: '3rem', color: '#6b6b66', fontSize: '0.9rem' },
  btnPDF: { background: '#1d4ed8', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
  divider: { border: 'none', borderTop: '2px dashed #e5e4e0', margin: '1.5rem 0' },
  btnShare: { background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  linkBanner: { background: '#f0fdf4', border: '1px solid #c3e6d4', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#166534', marginTop: 10, wordBreak: 'break-all' },
}

function fmt(n) { return Number(n || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

function generatePDF(event, dishes, extraServices, discount, tva, notes, totalGuests) {
  const date = event.event_date
    ? new Date(event.event_date).toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
    : '—'
  const printDate = new Date().toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'numeric' })
  const devisNum = `DEV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`

  const dishRows = dishes.map(ed => {
    const dish = ed.dishes
    const unitPrice = ed.custom_price ?? dish?.price_per_unit ?? 0
    const qty = ed.units_count || 0
    const total = unitPrice * qty
    return `<tr>
      <td>${dish?.name_fr || '—'}${dish?.name_ar ? `<br/><span style="font-size:10px;color:#888;direction:rtl">${dish.name_ar}</span>` : ''}</td>
      <td style="text-align:center">${dish?.category || '—'}</td>
      <td style="text-align:center">${qty} unités</td>
      <td style="text-align:right">${fmt(unitPrice)} MAD</td>
      <td style="text-align:right;font-weight:700;color:#166534">${fmt(total)} MAD</td>
    </tr>`
  }).join('')

  const dishTotal = dishes.reduce((s, ed) => {
    const unitPrice = ed.custom_price ?? ed.dishes?.price_per_unit ?? 0
    return s + unitPrice * (ed.units_count || 0)
  }, 0)

  const extrasTotal = extraServices.reduce((s, e) => s + (parseFloat(e.price) || 0), 0)
  const subtotal = dishTotal + extrasTotal
  const discountAmt = subtotal * (parseFloat(discount) || 0) / 100
  const afterDiscount = subtotal - discountAmt
  const tvaAmt = afterDiscount * (parseFloat(tva) || 0) / 100
  const grandTotal = afterDiscount + tvaAmt
  const perPerson = totalGuests > 0 ? grandTotal / totalGuests : 0

  const extrasRows = extraServices.filter(e => e.label && e.price).map(e =>
    `<tr><td>${e.label}</td><td colspan="3"></td><td style="text-align:right;font-weight:700">${fmt(e.price)} MAD</td></tr>`
  ).join('')

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
  <title>Devis — ${event.title}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;font-size:13px;color:#1a1a18;padding:32px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:3px solid #2d6a4f;padding-bottom:16px}
    .brand{font-size:22px;font-weight:700;color:#2d6a4f}
    .brand-sub{font-size:12px;color:#6b6b66;margin-top:2px}
    .doc-meta{text-align:right}
    .doc-title{font-size:20px;font-weight:700;color:#1a1a18}
    .doc-num{font-size:13px;color:#2d6a4f;font-weight:700;margin-top:4px}
    .doc-date{font-size:11px;color:#6b6b66;margin-top:2px}
    .parties{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}
    .party-box{background:#f9f8f5;border-radius:8px;padding:14px 16px}
    .party-box h3{font-size:11px;color:#6b6b66;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;border-bottom:1px solid #e5e4e0;padding-bottom:6px}
    .party-row{display:flex;justify-content:space-between;margin-bottom:5px;font-size:13px}
    .party-row span:last-child{font-weight:600}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
    .stat{background:#f0fdf4;border-radius:6px;padding:10px;text-align:center;border:1px solid #bbf7d0}
    .stat-num{font-size:18px;font-weight:700;color:#166534}
    .stat-label{font-size:10px;color:#6b6b66;margin-top:2px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    thead tr{background:#2d6a4f;color:#fff}
    th{padding:10px 12px;font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:.05em;font-weight:600}
    td{padding:9px 12px;border-bottom:1px solid #e5e4e0;font-size:13px}
    tbody tr:nth-child(even){background:#f9f8f5}
    .totals{width:350px;margin-left:auto;background:#f9f8f5;border-radius:8px;padding:14px 16px;margin-bottom:20px}
    .total-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid #e5e4e0}
    .total-row:last-child{border-bottom:none;font-size:16px;font-weight:700;color:#2d6a4f;padding-top:10px;margin-top:4px}
    .notes-box{background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#92400e}
    .footer{border-top:1px solid #e5e4e0;padding-top:12px;font-size:11px;color:#6b6b66;display:flex;justify-content:space-between}
    .validity{font-size:11px;color:#6b6b66;margin-bottom:16px;font-style:italic}
    @media print{button{display:none}}
  </style></head><body>
  <div class="header">
    <div><div class="brand">🍽 Traiteur Pro</div><div class="brand-sub">Gestion de traiteur professionnelle</div></div>
    <div class="doc-meta">
      <div class="doc-title">DEVIS</div>
      <div class="doc-num">${devisNum}</div>
      <div class="doc-date">Émis le ${printDate}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party-box">
      <h3>Prestataire</h3>
      <div class="party-row"><span>Société</span><span>Traiteur Pro</span></div>
      <div class="party-row"><span>Service</span><span>Traiteur événementiel</span></div>
    </div>
    <div class="party-box">
      <h3>Client</h3>
      <div class="party-row"><span>Nom</span><span>${event.clients?.full_name || '—'}</span></div>
      <div class="party-row"><span>Événement</span><span>${event.title}</span></div>
      <div class="party-row"><span>Date</span><span>${date}</span></div>
      <div class="party-row"><span>Statut</span><span>${event.status || '—'}</span></div>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-num">${totalGuests}</div><div class="stat-label">Invités</div></div>
    <div class="stat"><div class="stat-num">${event.tables_count || 0}</div><div class="stat-label">Tables</div></div>
    <div class="stat"><div class="stat-num">${dishes.length}</div><div class="stat-label">Plats</div></div>
    <div class="stat"><div class="stat-num">${fmt(perPerson)}</div><div class="stat-label">MAD / personne</div></div>
  </div>

  <table>
    <thead><tr>
      <th>Plat / Prestation</th><th style="text-align:center">Catégorie</th>
      <th style="text-align:center">Quantité</th>
      <th style="text-align:right">Prix unitaire</th>
      <th style="text-align:right">Total</th>
    </tr></thead>
    <tbody>
      ${dishRows}
      ${extrasRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row"><span>Sous-total plats</span><span>${fmt(dishTotal)} MAD</span></div>
    ${extrasTotal > 0 ? `<div class="total-row"><span>Services supplémentaires</span><span>${fmt(extrasTotal)} MAD</span></div>` : ''}
    <div class="total-row"><span>Sous-total</span><span>${fmt(subtotal)} MAD</span></div>
    ${discountAmt > 0 ? `<div class="total-row" style="color:#dc2626"><span>Remise (${discount}%)</span><span>- ${fmt(discountAmt)} MAD</span></div>` : ''}
    ${tvaAmt > 0 ? `<div class="total-row"><span>TVA (${tva}%)</span><span>${fmt(tvaAmt)} MAD</span></div>` : ''}
    <div class="total-row"><span>TOTAL TTC</span><span>${fmt(grandTotal)} MAD</span></div>
  </div>

  ${notes ? `<div class="notes-box"><strong>Notes:</strong> ${notes}</div>` : ''}

  <p class="validity">Ce devis est valable 30 jours à compter de sa date d'émission.</p>

  <div class="footer">
    <span>Traiteur Pro — Devis généré automatiquement</span>
    <span>${devisNum} | ${printDate}</span>
  </div>
  <br/>
  <button onclick="window.print()" style="background:#2d6a4f;color:#fff;padding:10px 24px;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600">🖨 Imprimer / Enregistrer en PDF</button>
  </body></html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.focus()
}

export default function Devis() {
  const { profile } = useAuth()
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [tva, setTva] = useState(0)
  const [notes, setNotes] = useState('')
  const [extraServices, setExtraServices] = useState([{ label: '', price: '' }])
  const [shareBanner, setShareBanner] = useState(null)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (!profile?.business_id) return
    supabase.from('events').select('*, clients(full_name, phone, city)')
      .eq('business_id', profile.business_id)
      .order('event_date', { ascending: false })
      .then(({ data }) => setEvents(data || []))
  }, [profile?.business_id])

  async function handleSelectEvent(eventId) {
    if (!eventId) { setSelectedEvent(null); setDishes([]); return }
    setLoading(true)
    const event = events.find(e => e.id === eventId)
    setSelectedEvent(event)
    const { data } = await supabase
      .from('event_dishes')
      .select('*, dishes(id, name_fr, name_ar, category, serves_per_unit, price_per_unit)')
      .eq('event_id', eventId)
    setDishes((data || []).map(ed => ({ ...ed, custom_price: ed.dishes?.price_per_unit || 0 })))
    setLoading(false)
  }

  function handlePriceChange(id, value) {
    setDishes(prev => prev.map(ed => ed.id === id ? { ...ed, custom_price: parseFloat(value) || 0 } : ed))
  }

  function addExtra() { setExtraServices(prev => [...prev, { label: '', price: '' }]) }
  function updateExtra(i, field, val) {
    setExtraServices(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e))
  }
  function removeExtra(i) { setExtraServices(prev => prev.filter((_, idx) => idx !== i)) }

  async function handleShareLink() {
    if (!selectedEvent) return
    setSharing(true)
    setShareBanner(null)
    const { data: saved, error } = await supabase
      .from('devis')
      .insert({
        business_id: profile.business_id,
        event_id: selectedEvent?.id,
        client_name: selectedEvent?.clients?.full_name || selectedEvent?.title,
        event_date: selectedEvent?.event_date,
        total_ht: afterDiscount,
        tva_rate: String(tva || 0),
        total_ttc: grandTotal,
        items: dishes.map(d => ({
          name: d.dishes?.name_fr,
          description: d.dishes?.name_fr,
          quantity: d.units_count || 1,
          unit_price: d.custom_price || 0,
        })),
        notes: notes || null,
        status: 'sent',
      })
      .select('token')
      .single()
    if (error || !saved?.token) {
      setShareBanner({ type: 'error', text: 'Erreur lors de la génération du lien.' })
      setSharing(false)
      return
    }
    const url = window.location.origin + '/devis/' + saved.token
    try { await navigator.clipboard.writeText(url) } catch {}
    setShareBanner({ type: 'success', url })
    setSharing(false)
  }

  const totalGuests = selectedEvent
    ? (selectedEvent.tables_count || 0) * (selectedEvent.guests_per_table || 0) : 0

  const dishTotal = dishes.reduce((s, ed) => s + (ed.custom_price || 0) * (ed.units_count || 0), 0)
  const extrasTotal = extraServices.reduce((s, e) => s + (parseFloat(e.price) || 0), 0)
  const subtotal = dishTotal + extrasTotal
  const discountAmt = subtotal * (parseFloat(discount) || 0) / 100
  const afterDiscount = subtotal - discountAmt
  const tvaAmt = afterDiscount * (parseFloat(tva) || 0) / 100
  const grandTotal = afterDiscount + tvaAmt
  const perPerson = totalGuests > 0 ? grandTotal / totalGuests : 0

  return (
    <div style={S.page}>
      <h1 style={S.title}>Devis client</h1>
      <p style={S.subtitle}>Générez un devis professionnel basé sur la commande de l'événement. Ajustez les prix et ajoutez des services supplémentaires.</p>

      {/* Event Selection */}
      <div style={S.card}>
        <div style={S.cardTitle}>① Sélectionner un événement</div>
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

      {loading && <div style={S.emptyState}>Chargement...</div>}

      {!loading && selectedEvent && dishes.length === 0 && (
        <div style={S.emptyState}>
          Aucune commande sauvegardée pour cet événement.<br/>
          <span style={{ fontSize: '0.8rem' }}>Allez dans le Calculateur, ajoutez des plats et sauvegardez d'abord.</span>
        </div>
      )}

      {!loading && dishes.length > 0 && (
        <>
          {/* Summary stats */}
          <div style={S.card}>
            <div style={S.cardTitle}>② Résumé</div>
            <div style={S.grid3}>
              <div style={S.statBox}><div style={S.statNum}>{totalGuests}</div><div style={S.statLabel}>Invités</div></div>
              <div style={S.statBox}><div style={S.statNum}>{dishes.length}</div><div style={S.statLabel}>Plats</div></div>
              <div style={S.statBox}><div style={{ ...S.statNum, color: '#1d4ed8' }}>{fmt(perPerson)}</div><div style={S.statLabel}>MAD / personne</div></div>
            </div>
          </div>

          {/* Dish pricing */}
          <div style={S.card}>
            <div style={S.cardTitle}>③ Prix des plats <span style={{ fontSize: '0.8rem', fontWeight: '400', color: '#6b6b66' }}>(modifiables)</span></div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Plat</th>
                  <th style={S.th}>Catégorie</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>Unités</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>Prix/unité (MAD)</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Total (MAD)</th>
                </tr>
              </thead>
              <tbody>
                {dishes.map(ed => {
                  const dish = ed.dishes
                  const total = (ed.custom_price || 0) * (ed.units_count || 0)
                  return (
                    <tr key={ed.id}>
                      <td style={S.td}>
                        <div style={{ fontWeight: '500' }}>{dish?.name_fr}</div>
                        {dish?.name_ar && <div style={{ fontSize: '0.72rem', color: '#6b6b66', direction: 'rtl' }}>{dish.name_ar}</div>}
                      </td>
                      <td style={S.td}>
                        <span style={{ ...S.badge, background: '#f0fdf4', color: '#166534' }}>{dish?.category}</span>
                      </td>
                      <td style={{ ...S.td, textAlign: 'center', fontWeight: '600' }}>{ed.units_count}</td>
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <input
                          type="number" min="0" step="0.01"
                          style={{ ...S.input, width: '100px', textAlign: 'center' }}
                          value={ed.custom_price}
                          onChange={e => handlePriceChange(ed.id, e.target.value)}
                        />
                      </td>
                      <td style={{ ...S.td, textAlign: 'right', fontWeight: '700', color: '#2d6a4f' }}>
                        {fmt(total)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Extra services */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={S.cardTitle}>④ Services supplémentaires</div>
              <button onClick={addExtra} style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}>
                + Ajouter
              </button>
            </div>
            {extraServices.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                <input
                  placeholder="Service (ex: Location salle, Décoration...)"
                  style={{ ...S.input, flex: 2 }}
                  value={e.label}
                  onChange={v => updateExtra(i, 'label', v.target.value)}
                />
                <input
                  type="number" placeholder="Prix MAD"
                  style={{ ...S.input, width: '120px' }}
                  value={e.price}
                  onChange={v => updateExtra(i, 'price', v.target.value)}
                />
                <button onClick={() => removeExtra(i)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
          </div>

          {/* Adjustments */}
          <div style={S.card}>
            <div style={S.cardTitle}>⑤ Remise, TVA & Notes</div>
            <div style={S.grid3}>
              <div>
                <label style={S.label}>Remise (%)</label>
                <input type="number" min="0" max="100" style={S.input} value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label style={S.label}>TVA (%)</label>
                <input type="number" min="0" style={S.input} value={tva} onChange={e => setTva(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label style={S.label}>Notes pour le client</label>
                <input type="text" style={S.input} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Conditions de paiement, remarques..." />
              </div>
            </div>
          </div>

          {/* Total summary */}
          <div style={S.card}>
            <div style={S.cardTitle}>⑥ Récapitulatif financier</div>
            <div style={{ maxWidth: '400px', marginLeft: 'auto' }}>
              {[
                { label: 'Sous-total plats', value: dishTotal },
                ...(extrasTotal > 0 ? [{ label: 'Services supplémentaires', value: extrasTotal }] : []),
                { label: 'Sous-total', value: subtotal, bold: true },
                ...(discountAmt > 0 ? [{ label: `Remise (${discount}%)`, value: -discountAmt, red: true }] : []),
                ...(tvaAmt > 0 ? [{ label: `TVA (${tva}%)`, value: tvaAmt }] : []),
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0efeb', fontWeight: row.bold ? '600' : '400', color: row.red ? '#dc2626' : '#1a1a18' }}>
                  <span>{row.label}</span>
                  <span>{row.red ? '- ' : ''}{fmt(Math.abs(row.value))} MAD</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '1.1rem', fontWeight: '700', color: '#2d6a4f', borderTop: '2px solid #2d6a4f', marginTop: '4px' }}>
                <span>TOTAL TTC</span>
                <span>{fmt(grandTotal)} MAD</span>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#6b6b66', marginTop: '4px' }}>
                soit {fmt(perPerson)} MAD par personne
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                style={S.btnPDF}
                onClick={() => generatePDF(selectedEvent, dishes, extraServices.filter(e => e.label && e.price), discount, tva, notes, totalGuests)}
              >
                🖨 Générer le Devis PDF
              </button>
              <button onClick={() => {
                const msg = `Devis Traiteur Pro\nClient: ${selectedEvent?.clients?.full_name || selectedEvent?.client_name}\nMontant: ${fmt(grandTotal)} MAD\nPour confirmer, répondez OUI.`;
                window.open('https://wa.me/?text=' + encodeURIComponent(msg));
              }} style={{ background:'#25D366', color:'#fff', border:'none',
                borderRadius:8, padding:'10px 18px', cursor:'pointer', fontSize:13 }}>
                📲 Envoyer via WhatsApp
              </button>
              <button style={S.btnShare} onClick={handleShareLink} disabled={sharing}>
                {sharing ? '⏳ Génération...' : '🔗 Générer lien partage'}
              </button>
              {shareBanner && (
                shareBanner.type === 'success' ? (
                  <div style={S.linkBanner}>
                    ✅ Lien copié ! Partagez-le via WhatsApp.<br />
                    <span style={{ opacity: 0.75 }}>{shareBanner.url}</span>
                  </div>
                ) : (
                  <div style={{ ...S.linkBanner, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                    {shareBanner.text}
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
