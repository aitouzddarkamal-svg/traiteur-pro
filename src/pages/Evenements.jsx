import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { canDo } from '../lib/permissions'
import DateInput from '../components/DateInput'
import HelpGuide from '../components/HelpGuide'
import { useLang } from '../context/LangContext'
import { t } from '../lib/i18n'

const EVENEMENTS_GUIDE = {
  title: 'Comment gérer vos événements',
  steps: [
    { icon: '👤', title: 'Créez le client',          description: 'Chaque événement est lié à un client. Créez-le si nécessaire.' },
    { icon: '📅', title: 'Définissez les détails',   description: 'Date, nombre de tables, invités par table, marge souhaitée.' },
    { icon: '🍽️', title: 'Ajoutez les plats',        description: 'Utilisez le Calculateur pour choisir les plats et quantités.' },
    { icon: '💳', title: 'Suivez les paiements',     description: "Enregistrez les acomptes et soldes dans l'onglet Paiements." },
  ],
}

const S = {
  page: { padding: '2rem', maxWidth: '1000px', margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: '600', color: '#1a1a18', marginBottom: '4px' },
  subtitle: { fontSize: '0.9rem', color: '#6b6b66', marginBottom: '2rem' },
  card: { background: '#fff', border: '1px solid #e5e4e0', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b6b66', marginBottom: '4px' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: '6px', fontSize: '0.9rem', background: '#fff', color: '#1a1a18', outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: '6px', fontSize: '0.9rem', background: '#fff', color: '#1a1a18', outline: 'none' },
  textarea: { width: '100%', padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: '6px', fontSize: '0.9rem', background: '#fff', color: '#1a1a18', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b6b66', padding: '8px 12px', borderBottom: '2px solid #e5e4e0', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '12px 12px', fontSize: '0.875rem', color: '#1a1a18', borderBottom: '1px solid #f0efeb', verticalAlign: 'middle' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' },
  btn: { padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' },
  btnPrimary: { background: '#2d6a4f', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
  btnDanger: { background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  btnEdit: { background: '#eff6ff', color: '#1d4ed8', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', marginRight: '6px' },
  btnGreen: { background: '#f0fdf4', color: '#2d6a4f', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', marginRight: '6px' },
  alert: { padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' },
  successAlert: { background: '#dcfce7', color: '#166534' },
  errorAlert: { background: '#fee2e2', color: '#dc2626' },
  emptyState: { textAlign: 'center', padding: '3rem', color: '#6b6b66', fontSize: '0.9rem' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: '#fff', borderRadius: '12px', padding: '2rem', width: '600px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: '1.1rem', fontWeight: '600', color: '#1a1a18', marginBottom: '1.5rem' },
  divider: { border: 'none', borderTop: '1px solid #e5e4e0', margin: '1rem 0' },
  searchBar: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' },
}

// DB accepts: draft | confirmed | completed | cancelled
const statusColors = {
  draft:     { background: '#f0efeb', color: '#6b6b66' },
  confirmed: { background: '#dcfce7', color: '#166534' },
  completed: { background: '#dbeafe', color: '#1e40af' },
  cancelled: { background: '#fee2e2', color: '#dc2626' },
}

function statusLabel(s) {
  const map = { draft: 'Brouillon', confirmed: 'Confirmé', completed: 'Terminé', cancelled: 'Annulé' }
  return map[s] || s
}

const emptyForm = {
  title: '', client_id: '', event_date: '',
  tables_count: '1', guests_per_table: '1',
  waste_buffer_pct: '10', status: 'draft', notes: ''
}

const emptyClientForm = { full_name: '', phone: '', city: '' }

export default function Evenements() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const { lang } = useLang()
  const [events, setEvents] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showNewClient, setShowNewClient] = useState(false)
  const [clientForm, setClientForm] = useState(emptyClientForm)
  const [savingClient, setSavingClient] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: evData }, { data: clData }] = await Promise.all([
      supabase.from('events').select('*, clients(id, full_name, phone, city)').order('event_date', { ascending: false }),
      supabase.from('clients').select('id, full_name, city').order('full_name')
    ])
    setEvents(evData || [])
    setClients(clData || [])
    setLoading(false)
  }

  function openCreate() { setEditingEvent(null); setForm(emptyForm); setShowModal(true); setShowNewClient(false) }

  function openEdit(event) {
    setEditingEvent(event)
    setForm({
      title: event.title || '', client_id: event.client_id || '',
      event_date: event.event_date || '',
      tables_count: event.tables_count || '1',
      guests_per_table: event.guests_per_table || '1',
      waste_buffer_pct: event.waste_buffer_pct || '10',
      status: event.status || 'draft', notes: event.notes || ''
    })
    setShowModal(true)
    setShowNewClient(false)
  }

  function closeModal() { setShowModal(false); setEditingEvent(null); setForm(emptyForm); setShowNewClient(false); setErrors({}) }

  async function handleCreateClient() {
    if (!clientForm.full_name.trim()) {
      setMessage({ type: 'error', text: 'Le nom du client est obligatoire.' })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    setSavingClient(true)
    const { data, error } = await supabase.from('clients').insert({
      full_name: clientForm.full_name.trim(),
      phone: clientForm.phone.trim() || null,
      city: clientForm.city.trim() || null,
      business_id: profile?.business_id,
    }).select().single()
    if (error) {
      setMessage({ type: 'error', text: 'Erreur: ' + error.message })
    } else {
      setClients(prev => [...prev, data].sort((a, b) => a.full_name.localeCompare(b.full_name)))
      setForm(f => ({ ...f, client_id: data.id }))
      setClientForm(emptyClientForm)
      setShowNewClient(false)
      setMessage({ type: 'success', text: `✓ Client "${data.full_name}" créé et sélectionné.` })
      setTimeout(() => setMessage(null), 3000)
    }
    setSavingClient(false)
  }

  function validateEvent(f) {
    const e = {}
    if (!f.title?.trim() || f.title.trim().length < 2)
      e.title = 'Le nom doit contenir au moins 2 caractères'
    if (!f.client_id)
      e.client_id = 'Le client est obligatoire'
    if (!f.event_date)
      e.event_date = 'La date est obligatoire'
    const guests = parseInt(f.guests_per_table) || 0
    if (!f.guests_per_table || guests <= 0 || guests > 10000)
      e.guests_per_table = "Nombre d'invités invalide (1-10000)"
    const tables = parseInt(f.tables_count) || 0
    if (!f.tables_count || tables <= 0)
      e.tables_count = 'Nombre de tables invalide'
    return e
  }

  async function handleSave() {
    const e = validateEvent(form)
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    const tables = parseInt(form.tables_count) || 1
    const guests = parseInt(form.guests_per_table) || 1
    setSaving(true)
    const payload = {
      title: form.title, client_id: form.client_id, event_date: form.event_date,
      tables_count: tables, guests_per_table: guests,
      waste_buffer_pct: parseFloat(form.waste_buffer_pct) || 10,
      status: form.status, notes: form.notes,
    }
    let error
    if (editingEvent) {
      ;({ error } = await supabase.from('events').update(payload).eq('id', editingEvent.id))
    } else {
      ;({ error } = await supabase.from('events').insert({ ...payload, created_by: user?.id ?? profile?.id, business_id: profile?.business_id }))
    }
    if (error) {
      setMessage({ type: 'error', text: 'Erreur: ' + error.message })
    } else {
      setMessage({ type: 'success', text: editingEvent ? '✓ Événement modifié.' : '✓ Événement créé.' })
      closeModal()
      loadData()
      setTimeout(() => setMessage(null), 3000)
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    // Guard: seuls les rôles avec canDelete peuvent supprimer
    if (!canDo(profile?.role, 'canDelete')) return
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (!error) {
      setEvents(prev => prev.filter(e => e.id !== id))
      setMessage({ type: 'success', text: '✓ Événement supprimé.' })
      setTimeout(() => setMessage(null), 3000)
    }
    setConfirmDelete(null)
  }

  const filtered = events.filter(ev => {
    const matchSearch = !search || ev.title?.toLowerCase().includes(search.toLowerCase()) || ev.clients?.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || ev.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalGuests = (ev) => (ev.tables_count || 0) * (ev.guests_per_table || 0)

  return (
    <div style={S.page}>
      <h1 style={S.title}>{t(lang,'evenements')}</h1>
      <p style={S.subtitle}>Créez et gérez tous vos événements. Chaque événement est lié à un client et configure le calculateur automatiquement.</p>

      {message && (
        <div style={{ ...S.alert, ...(message.type === 'success' ? S.successAlert : S.errorAlert) }}>
          {message.text}
        </div>
      )}

      <div style={S.searchBar}>
        <input
          style={{ ...S.input, maxWidth: '300px' }}
          placeholder={t(lang,'searchEvent')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={{ ...S.select, maxWidth: '180px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">{t(lang,'allStatuses')}</option>
          <option value="draft">{t(lang,'draft')}</option>
          <option value="confirmed">{t(lang,'confirmed')}</option>
          <option value="completed">Terminé</option>
          <option value="cancelled">{t(lang,'cancelled')}</option>
        </select>
        {/* PRIORITÉ 1 — Protéger le bouton Créer */}
        {canDo(profile?.role, 'canCreate') && (
          <button style={S.btnPrimary} onClick={openCreate}>{`+ ${t(lang,'newEvent')}`}</button>
        )}
      </div>

      <div style={S.card}>
        {loading ? (
          <div style={S.emptyState}>{t(lang,'loading')}</div>
        ) : filtered.length === 0 ? (
          <div style={S.emptyState}>
            Aucun événement trouvé.<br/>
            {canDo(profile?.role, 'canCreate') && (
              <span style={{ fontSize: '0.8rem' }}>Cliquez sur "+ Nouvel événement" pour commencer.</span>
            )}
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Événement</th>
                <th style={S.th}>Client</th>
                <th style={S.th}>{t(lang,'eventDate')}</th>
                <th style={{ ...S.th, textAlign: 'center' }}>{t(lang,'guests')}</th>
                <th style={{ ...S.th, textAlign: 'center' }}>{t(lang,'tables')}</th>
                <th style={{ ...S.th, textAlign: 'center' }}>{t(lang,'margin')}</th>
                <th style={{ ...S.th, textAlign: 'center' }}>{t(lang,'status')}</th>
                {/* Afficher la colonne actions seulement si au moins une action est permise */}
                {(canDo(profile?.role, 'canEdit') || canDo(profile?.role, 'canDelete')) && (
                  <th style={S.th}></th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ev => (
                <tr key={ev.id}>
                  <td style={S.td}>
                    <div style={{ fontWeight: '600' }}>{ev.title}</div>
                    {ev.notes && (
                      <div style={{ fontSize: '0.72rem', color: '#6b6b66', marginTop: '2px' }}>
                        {ev.notes.substring(0, 40)}{ev.notes.length > 40 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td style={S.td}>
                    <div>{ev.clients?.full_name || '—'}</div>
                    {ev.clients?.city && <div style={{ fontSize: '0.72rem', color: '#6b6b66' }}>{ev.clients.city}</div>}
                  </td>
                  <td style={S.td}>
                    <div style={{ fontWeight: '500' }}>
                      {ev.event_date ? new Date(ev.event_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6b6b66' }}>
                      {ev.event_date ? new Date(ev.event_date).toLocaleDateString('fr-FR', { weekday: 'long' }) : ''}
                    </div>
                  </td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <span style={{ fontWeight: '700', color: '#2d6a4f', fontSize: '1rem' }}>{totalGuests(ev)}</span>
                  </td>
                  <td style={{ ...S.td, textAlign: 'center' }}>{ev.tables_count || 0}</td>
                  <td style={{ ...S.td, textAlign: 'center' }}>{ev.waste_buffer_pct || 0}%</td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <span style={{ ...S.badge, ...(statusColors[ev.status] || { background: '#f0efeb', color: '#6b6b66' }) }}>
                      {statusLabel(ev.status)}
                    </span>
                  </td>
                  {/* Colonne actions — affichée seulement si au moins une action est permise */}
                  {(canDo(profile?.role, 'canEdit') || canDo(profile?.role, 'canDelete')) && (
                    <td style={S.td}>
                      {/* PRIORITÉ 1 — Protéger le bouton Modifier */}
                      <button style={S.btnGreen} onClick={() => navigate(`/evenements/${ev.id}/jours`)}>🎭 Jours</button>
                      {canDo(profile?.role, 'canEdit') && (
                        <button style={S.btnEdit} onClick={() => openEdit(ev)}>✏ Modifier</button>
                      )}
                      {/* PRIORITÉ 1 — Protéger le bouton Supprimer */}
                      {canDo(profile?.role, 'canDelete') && (
                        <button style={S.btnDanger} onClick={() => setConfirmDelete(ev)}>✕</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={S.modalBox}>
            <div style={S.modalTitle}>{editingEvent ? '✏ Modifier l\'événement' : `+ ${t(lang,'newEvent')}`}</div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={S.label}>Titre de l'événement *</label>
              <input
                style={{ ...S.input, ...(errors.title ? { borderColor: '#c0392b' } : {}) }}
                placeholder="ex: Mariage Bennani — Juin 2026"
                value={form.title}
                onChange={ev => { setForm(f => ({ ...f, title: ev.target.value })); setErrors(e => ({ ...e, title: '' })) }}
              />
              {errors.title && <span style={{ color: '#c0392b', fontSize: 11, marginTop: 3, display: 'block' }}>{errors.title}</span>}
            </div>

            {/* Client selector */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ ...S.label, marginBottom: 0 }}>Client *</label>
                {/* Nouveau client inline — accessible à ceux qui peuvent créer */}
                {canDo(profile?.role, 'canCreate') && (
                  <button
                    onClick={() => { setShowNewClient(v => !v); setClientForm(emptyClientForm) }}
                    style={{ fontSize: '12px', color: '#2d6a4f', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {showNewClient ? '✕ Annuler' : '+ Nouveau client'}
                  </button>
                )}
              </div>
              {!showNewClient && (
                <select style={{ ...S.select, ...(errors.client_id ? { borderColor: '#c0392b' } : {}) }} value={form.client_id} onChange={ev => { setForm(f => ({ ...f, client_id: ev.target.value })); setErrors(e => ({ ...e, client_id: '' })) }}>
                  <option value="">-- Choisir un client --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}{c.city ? ` — ${c.city}` : ''}</option>)}
                </select>
              )}
              {errors.client_id && <span style={{ color: '#c0392b', fontSize: 11, marginTop: 3, display: 'block' }}>{errors.client_id}</span>}
              {showNewClient && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', marginTop: '4px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#166534', marginBottom: '0.75rem' }}>Créer un nouveau client</div>
                  <div style={S.grid3}>
                    <div>
                      <label style={S.label}>Nom complet *</label>
                      <input style={S.input} placeholder="Famille Alaoui" value={clientForm.full_name} onChange={e => setClientForm(f => ({ ...f, full_name: e.target.value }))} />
                    </div>
                    <div>
                      <label style={S.label}>Téléphone</label>
                      <input style={S.input} placeholder="06 12 34 56 78" value={clientForm.phone} onChange={e => setClientForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div>
                      <label style={S.label}>Ville</label>
                      <input style={S.input} placeholder="Agadir" value={clientForm.city} onChange={e => setClientForm(f => ({ ...f, city: e.target.value }))} />
                    </div>
                  </div>
                  <button
                    style={{ ...S.btnPrimary, marginTop: '0.75rem', padding: '8px 16px', fontSize: '0.85rem' }}
                    onClick={handleCreateClient}
                    disabled={savingClient}
                  >
                    {savingClient ? 'Création...' : '✓ Créer et sélectionner'}
                  </button>
                </div>
              )}
            </div>

            {/* Date + Status */}
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Date de l'événement *</label>
                <DateInput style={{ ...S.input, ...(errors.event_date ? { borderColor: '#c0392b' } : {}) }} value={form.event_date} onChange={ev => { setForm(f => ({ ...f, event_date: ev.target.value })); setErrors(e => ({ ...e, event_date: '' })) }} />
                {errors.event_date && <span style={{ color: '#c0392b', fontSize: 11, marginTop: 3, display: 'block' }}>{errors.event_date}</span>}
              </div>
              <div>
                <label style={S.label}>Statut</label>
                {/* DB accepts: draft | confirmed | completed | cancelled */}
                <select style={S.select} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="draft">{t(lang,'draft')}</option>
                  <option value="confirmed">{t(lang,'confirmed')}</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">{t(lang,'cancelled')}</option>
                </select>
              </div>
            </div>

            <hr style={S.divider} />

            <div style={S.grid3}>
              <div>
                <label style={S.label}>Nombre de tables (min 1)</label>
                <input type="number" min="1" style={{ ...S.input, ...(errors.tables_count ? { borderColor: '#c0392b' } : {}) }} value={form.tables_count} onChange={ev => { setForm(f => ({ ...f, tables_count: ev.target.value })); setErrors(e => ({ ...e, tables_count: '' })) }} />
                {errors.tables_count && <span style={{ color: '#c0392b', fontSize: 11, marginTop: 3, display: 'block' }}>{errors.tables_count}</span>}
              </div>
              <div>
                <label style={S.label}>Invités / table (min 1)</label>
                <input type="number" min="1" style={{ ...S.input, ...(errors.guests_per_table ? { borderColor: '#c0392b' } : {}) }} value={form.guests_per_table} onChange={ev => { setForm(f => ({ ...f, guests_per_table: ev.target.value })); setErrors(e => ({ ...e, guests_per_table: '' })) }} />
                {errors.guests_per_table && <span style={{ color: '#c0392b', fontSize: 11, marginTop: 3, display: 'block' }}>{errors.guests_per_table}</span>}
              </div>
              <div>
                <label style={S.label}>Marge gaspillage (%)</label>
                <input type="number" min="0" max="50" style={S.input} value={form.waste_buffer_pct} onChange={e => setForm(f => ({ ...f, waste_buffer_pct: e.target.value }))} />
              </div>
            </div>

            {form.tables_count && form.guests_per_table && parseInt(form.tables_count) > 0 && parseInt(form.guests_per_table) > 0 && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px 14px', fontSize: '0.8rem', color: '#166534', margin: '0.75rem 0' }}>
                Total invités: <strong>{parseInt(form.tables_count) * parseInt(form.guests_per_table)}</strong> — Avec marge: <strong>{Math.ceil(parseInt(form.tables_count) * parseInt(form.guests_per_table) * (1 + parseFloat(form.waste_buffer_pct || 0) / 100))}</strong>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={S.label}>Notes</label>
              <textarea style={S.textarea} placeholder="Instructions spéciales, allergies, préférences..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button style={{ ...S.btn, background: '#f9f8f5', color: '#6b6b66' }} onClick={closeModal}>Annuler</button>
              <button style={S.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? 'Sauvegarde...' : editingEvent ? '✓ Enregistrer' : '+ Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ ...S.modalBox, maxWidth: '420px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#dc2626' }}>⚠ Confirmer la suppression</div>
            <p style={{ color: '#6b6b66', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Êtes-vous sûr de vouloir supprimer <strong>"{confirmDelete.title}"</strong> ? Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button style={{ ...S.btn, background: '#f9f8f5', color: '#6b6b66' }} onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button style={{ ...S.btn, background: '#dc2626', color: '#fff' }} onClick={() => handleDelete(confirmDelete.id)}>
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
      <HelpGuide />
    </div>
  )
}
