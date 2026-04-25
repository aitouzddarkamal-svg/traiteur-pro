import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import DateInput from '../components/DateInput'
import { canDo } from '../lib/permissions'
import { useLang } from '../context/LangContext'
import { t } from '../lib/i18n'

const S = {
  page: { padding: '2rem', maxWidth: '1000px', margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: '600', color: '#1a1a18', marginBottom: '4px' },
  subtitle: { fontSize: '0.9rem', color: '#6b6b66', marginBottom: '2rem' },
  card: { background: '#fff', border: '1px solid #e5e4e0', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' },
  cardTitle: { fontSize: '1rem', fontWeight: '600', color: '#1a1a18', marginBottom: '1rem' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  grid4: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b6b66', marginBottom: '4px' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: '6px', fontSize: '0.9rem', background: '#fff', color: '#1a1a18', outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: '6px', fontSize: '0.9rem', background: '#fff', color: '#1a1a18', outline: 'none' },
  textarea: { width: '100%', padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: '6px', fontSize: '0.9rem', background: '#fff', color: '#1a1a18', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: '60px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b6b66', padding: '8px 12px', borderBottom: '2px solid #e5e4e0', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '11px 12px', fontSize: '0.875rem', color: '#1a1a18', borderBottom: '1px solid #f0efeb', verticalAlign: 'middle' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' },
  statBox: { background: '#f9f8f5', borderRadius: '8px', padding: '1rem', textAlign: 'center' },
  statNum: { fontSize: '1.5rem', fontWeight: '700', color: '#2d6a4f' },
  statLabel: { fontSize: '0.72rem', color: '#6b6b66', marginTop: '2px' },
  btn: { padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' },
  btnPrimary: { background: '#2d6a4f', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
  btnDanger: { background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  alert: { padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' },
  successAlert: { background: '#dcfce7', color: '#166534' },
  errorAlert: { background: '#fee2e2', color: '#dc2626' },
  emptyState: { textAlign: 'center', padding: '2rem', color: '#6b6b66', fontSize: '0.9rem' },
  progressBar: { height: '8px', borderRadius: '4px', background: '#e5e4e0', overflow: 'hidden', marginTop: '6px' },
}

// ─── DB value → French label mappings ────────────────────────────────────────
// payment_type: DB accepts  deposit | balance | partial | refund
const typeLabels = {
  deposit: 'Acompte',
  partial: 'Avance',
  balance: 'Solde',
  refund:  'Remboursement',
}
const typeColors = {
  deposit: { background: '#fef9c3', color: '#854d0e' },
  partial: { background: '#dbeafe', color: '#1e40af' },
  balance: { background: '#dcfce7', color: '#166534' },
  refund:  { background: '#fee2e2', color: '#dc2626' },
}

// method: DB accepts  cash | bank_transfer | cheque | other
const methodLabels = {
  cash:          'Espèces',
  bank_transfer: 'Virement bancaire',
  cheque:        'Chèque',
  other:         'Carte / Autre',
}
const methodColors = {
  cash:          { background: '#dcfce7', color: '#166534' },
  bank_transfer: { background: '#dbeafe', color: '#1e40af' },
  cheque:        { background: '#fef9c3', color: '#854d0e' },
  other:         { background: '#f3e8ff', color: '#6b21a8' },
}

function fmt(n) {
  return Number(n || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const emptyForm = {
  payment_type: 'deposit',
  amount: '',
  payment_date: new Date().toISOString().split('T')[0],
  method: 'cash',
  notes: '',
}

export default function Paiements() {
  const { profile } = useAuth()
  const { lang } = useLang()
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [payments, setPayments] = useState([])
  const [totalDue, setTotalDue] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const isAdmin = profile?.role === 'admin'
  const canViewFinances = canDo(profile?.role, 'canViewFinances')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!profile?.business_id) return
    supabase
      .from('events')
      .select('*, clients(full_name)')
      .eq('business_id', profile.business_id)
      .order('event_date', { ascending: false })
      .then(({ data }) => setEvents(data || []))
  }, [profile?.business_id])

  async function handleSelectEvent(eventId) {
    if (!eventId) { setSelectedEvent(null); setPayments([]); setTotalDue(0); return }
    setLoading(true)
    const event = events.find(e => e.id === eventId)
    setSelectedEvent(event)
    await loadPayments(eventId)
    await loadTotalDue(eventId)
    setLoading(false)
  }

  async function loadPayments(eventId) {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('event_id', eventId)
      .order('payment_date', { ascending: false })
    setPayments(data || [])
  }

  async function loadTotalDue(eventId) {
    const { data } = await supabase
      .from('event_dishes')
      .select('units_count, dishes(price_per_unit)')
      .eq('event_id', eventId)
    const total = (data || []).reduce(
      (s, ed) => s + (ed.units_count || 0) * (ed.dishes?.price_per_unit || 0), 0
    )
    setTotalDue(total)
  }

  function validatePayment(f) {
    const e = {}
    if (!f.amount || isNaN(f.amount) || Number(f.amount) <= 0)
      e.amount = 'Montant invalide — doit être supérieur à 0'
    if (Number(f.amount) > 1000000)
      e.amount = 'Montant trop élevé'
    if (!f.payment_date)
      e.payment_date = 'La date est obligatoire'
    return e
  }

  async function handleAddPayment() {
    const e = validatePayment(form)
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    setSaving(true)
    const { error } = await supabase.from('payments').insert({
      event_id:     selectedEvent.id,
      recorded_by:  profile.id,
      payment_type: form.payment_type,   // deposit | balance | partial | refund
      amount:       parseFloat(form.amount),
      payment_date: form.payment_date,
      method:       form.method,         // cash | bank_transfer | cheque | other
      notes:        form.notes,
      business_id:  profile.business_id,
    })
    if (error) {
      setMessage({ type: 'error', text: 'Erreur: ' + error.message })
    } else {
      setMessage({ type: 'success', text: '✓ Paiement enregistré.' })
      setForm(emptyForm)
      await loadPayments(selectedEvent.id)
      setTimeout(() => setMessage(null), 3000)
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!isAdmin) return
    await supabase.from('payments').delete().eq('id', id)
    setPayments(prev => prev.filter(p => p.id !== id))
    setConfirmDelete(null)
    setMessage({ type: 'success', text: '✓ Paiement supprimé.' })
    setTimeout(() => setMessage(null), 3000)
  }

  const totalPaid     = payments.filter(p => p.payment_type !== 'refund').reduce((s, p) => s + (p.amount || 0), 0)
  const totalRefunded = payments.filter(p => p.payment_type === 'refund').reduce((s, p) => s + (p.amount || 0), 0)
  const netPaid       = totalPaid - totalRefunded
  const remaining     = totalDue - netPaid
  const pct           = totalDue > 0 ? Math.min((netPaid / totalDue) * 100, 100) : 0
  const isPaid        = remaining <= 0 && totalDue > 0

  return (
    <div style={S.page}>
      <h1 style={S.title}>{t(lang,'paymentTracking')}</h1>
      <p style={S.subtitle}><div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#166534' }}>
  💡 <strong>Comment ajouter un paiement :</strong> Sélectionnez un événement ci-dessous → le formulaire d'enregistrement apparaît automatiquement.
</div>
        Enregistrez les acomptes et soldes de chaque événement. Suivez le statut de paiement en temps réel.
      </p>

      {message && (
        <div style={{ ...S.alert, ...(message.type === 'success' ? S.successAlert : S.errorAlert) }}>
          {message.text}
        </div>
      )}

      {/* Event Selection */}
      <div style={S.card}>
        <div style={S.cardTitle}>Sélectionner un événement</div>
        <label style={S.label}>Événement</label>
        <select style={S.select} value={selectedEvent?.id || ''} onChange={e => handleSelectEvent(e.target.value)}>
          <option value="">{t(lang,'chooseEvent')}</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>
              {ev.title} — {ev.clients?.full_name || '?'} — {ev.event_date ? new Date(ev.event_date).toLocaleDateString('fr-FR') : ''}
            </option>
          ))}
        </select>
      </div>

      {loading && <div style={S.emptyState}>{t(lang,'loading')}</div>}

      {!loading && selectedEvent && (
        <>
          {/* Financial Summary */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={S.cardTitle}>Récapitulatif financier</div>
              <span style={{
                ...S.badge,
                ...(isPaid
                  ? { background: '#dcfce7', color: '#166534' }
                  : remaining > 0
                    ? { background: '#fef9c3', color: '#854d0e' }
                    : { background: '#fee2e2', color: '#dc2626' })
              }}>
                {isPaid ? `✓ ${t(lang,'paid')}` : `Reste: ${fmt(remaining)} MAD`}
              </span>
            </div>
            <div style={S.grid4}>
              <div style={S.statBox}>
                <div style={{ ...S.statNum, color: '#1d4ed8' }}>{fmt(totalDue)}</div>
                <div style={S.statLabel}>Total devis (MAD)</div>
              </div>
              <div style={S.statBox}>
                <div style={{ ...S.statNum, color: '#166534' }}>{fmt(netPaid)}</div>
                <div style={S.statLabel}>Payé (MAD)</div>
              </div>
              <div style={S.statBox}>
                <div style={{ ...S.statNum, color: remaining > 0 ? '#d97706' : '#166534' }}>
                  {fmt(remaining > 0 ? remaining : 0)}
                </div>
                <div style={S.statLabel}>Reste à payer (MAD)</div>
              </div>
              <div style={S.statBox}>
                <div style={{ ...S.statNum, color: pct >= 100 ? '#166534' : '#d97706' }}>
                  {pct.toFixed(0)}%
                </div>
                <div style={S.statLabel}>Progression</div>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b6b66', marginBottom: '4px' }}>
                <span>0 MAD</span>
                <span>{fmt(totalDue)} MAD</span>
              </div>
              <div style={S.progressBar}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: pct >= 100 ? '#2d6a4f' : pct >= 50 ? '#d97706' : '#dc2626',
                  borderRadius: '4px',
                  transition: 'width 0.5s',
                }} />
              </div>
            </div>
            {totalDue === 0 && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#6b6b66' }}>
                ℹ Total calculé depuis le Devis. Sauvegardez une commande dans le Calculateur pour voir le montant.
              </div>
            )}
            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={() => {
                  const msg = remaining <= 0
                    ? `✅ Paiement reçu — ${selectedEvent?.title || 'Événement'}\nMontant total : ${fmt(totalDue)} MAD\nStatut : Soldé. Merci !`
                    : `💰 Rappel paiement — ${selectedEvent?.title || 'Événement'}\nMontant total : ${fmt(totalDue)} MAD\nDéjà payé : ${fmt(netPaid)} MAD\nReste à payer : ${fmt(remaining)} MAD`;
                  window.open('https://wa.me/?text=' + encodeURIComponent(msg));
                }}
                style={{
                  background: '#25D366', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '10px 18px', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500, display: 'flex',
                  alignItems: 'center', gap: 6,
                }}>
                📲 Envoyer récapitulatif WhatsApp
              </button>
            </div>
          </div>

          {/* Add Payment Form */}
          <div style={S.card}>
            <div style={S.cardTitle}>Enregistrer un paiement</div>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Type de paiement</label>
                {/* French labels in UI — DB values as option value */}
                <select style={S.select} value={form.payment_type} onChange={e => setForm(f => ({ ...f, payment_type: e.target.value }))}>
                  <option value="deposit">Acompte</option>
                  <option value="partial">Avance</option>
                  <option value="balance">Solde (paiement final)</option>
                  <option value="refund">Remboursement</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Méthode de paiement</label>
                {/* French labels in UI — DB values as option value */}
                <select style={S.select} value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                  <option value="cash">Espèces</option>
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="cheque">Chèque</option>
                  <option value="other">Carte bancaire</option>
                </select>
              </div>
            </div>
            <div style={{ ...S.grid2, marginTop: '1rem' }}>
              <div>
                <label style={S.label}>Montant (MAD) *</label>
                <input
                  type="number" min="0" step="0.01"
                  style={{ ...S.input, ...(errors.amount ? { borderColor: '#c0392b' } : {}) }}
                  placeholder="ex: 5000"
                  value={form.amount}
                  onChange={ev => { setForm(f => ({ ...f, amount: ev.target.value })); setErrors(e => ({ ...e, amount: '' })) }}
                />
                {errors.amount && <span style={{ color: '#c0392b', fontSize: 11, marginTop: 3, display: 'block' }}>{errors.amount}</span>}
              </div>
              <div>
                <label style={S.label}>Date du paiement</label>
                <DateInput style={{ ...S.input, ...(errors.payment_date ? { borderColor: '#c0392b' } : {}) }} value={form.payment_date} onChange={ev => { setForm(f => ({ ...f, payment_date: ev.target.value })); setErrors(e => ({ ...e, payment_date: '' })) }} />
                {errors.payment_date && <span style={{ color: '#c0392b', fontSize: 11, marginTop: 3, display: 'block' }}>{errors.payment_date}</span>}
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label style={S.label}>Notes</label>
              <textarea
                style={S.textarea}
                placeholder="Référence chèque, numéro virement..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <button
              style={{ ...S.btnPrimary, marginTop: '1rem' }}
              onClick={handleAddPayment}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : '+ Enregistrer le paiement'}
            </button>
          </div>

          {/* Payment History */}
          <div style={S.card}>
            <div style={S.cardTitle}>Historique des paiements ({payments.length})</div>
            {payments.length === 0 ? (
              <div style={S.emptyState}>Aucun paiement enregistré pour cet événement.</div>
            ) : (
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Date</th>
                    <th style={S.th}>Type</th>
                    <th style={S.th}>Méthode</th>
                    {canViewFinances && <th style={{ ...S.th, textAlign: 'right' }}>Montant (MAD)</th>}
                    <th style={S.th}>Notes</th>
                    {isAdmin && <th style={S.th}></th>}
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} style={{ background: p.payment_type === 'refund' ? '#fff5f5' : 'transparent' }}>
                      <td style={S.td}>
                        {p.payment_date
                          ? new Date(p.payment_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td style={S.td}>
                        <span style={{ ...S.badge, ...(typeColors[p.payment_type] || { background: '#f0efeb', color: '#6b6b66' }) }}>
                          {typeLabels[p.payment_type] || p.payment_type}
                        </span>
                      </td>
                      <td style={S.td}>
                        <span style={{ ...S.badge, ...(methodColors[p.method] || { background: '#f0efeb', color: '#6b6b66' }) }}>
                          {methodLabels[p.method] || p.method}
                        </span>
                      </td>
                      {canViewFinances && (
                        <td style={{ ...S.td, textAlign: 'right', fontWeight: '700', color: p.payment_type === 'refund' ? '#dc2626' : '#166534', fontSize: '1rem' }}>
                          {p.payment_type === 'refund' ? '- ' : '+ '}{fmt(p.amount)}
                        </td>
                      )}
                      <td style={{ ...S.td, fontSize: '0.8rem', color: '#6b6b66' }}>{p.notes || '—'}</td>
                      {isAdmin && (
                        <td style={S.td}>
                          <button style={S.btnDanger} onClick={() => setConfirmDelete(p)}>✕</button>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr style={{ background: '#f9f8f5' }}>
                    <td colSpan={canViewFinances ? 3 : 4} style={{ ...S.td, fontWeight: '700' }}>TOTAL NET PAYÉ</td>
                    {canViewFinances && (
                      <td style={{ ...S.td, textAlign: 'right', fontWeight: '700', color: '#2d6a4f', fontSize: '1.1rem' }}>
                        {fmt(netPaid)} MAD
                      </td>
                    )}
                    <td colSpan={isAdmin ? 2 : 1}></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', width: '400px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#dc2626', marginBottom: '1rem' }}>
              ⚠ Supprimer ce paiement ?
            </div>
            <p style={{ color: '#6b6b66', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Paiement de <strong>{fmt(confirmDelete.amount)} MAD</strong> ({typeLabels[confirmDelete.payment_type] || confirmDelete.payment_type}) du{' '}
              {confirmDelete.payment_date ? new Date(confirmDelete.payment_date).toLocaleDateString('fr-FR') : '—'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button style={{ ...S.btn, background: '#f9f8f5', color: '#6b6b66' }} onClick={() => setConfirmDelete(null)}>
                Annuler
              </button>
              <button style={{ ...S.btn, background: '#dc2626', color: '#fff' }} onClick={() => handleDelete(confirmDelete.id)}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
