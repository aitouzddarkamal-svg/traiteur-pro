import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import PersonnelTraditional from './PersonnelTraditional'

const S = {
  page: { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: '600', color: '#1a1a18', marginBottom: '4px' },
  subtitle: { fontSize: '0.9rem', color: '#6b6b66', marginBottom: '2rem' },
  card: { background: '#fff', border: '1px solid #e5e4e0', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b6b66', marginBottom: '4px' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: '6px', fontSize: '0.9rem', background: '#fff', color: '#1a1a18', outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: '6px', fontSize: '0.9rem', background: '#fff', color: '#1a1a18', outline: 'none' },
  textarea: { width: '100%', padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: '6px', fontSize: '0.9rem', background: '#fff', color: '#1a1a18', outline: 'none', boxSizing: 'border-box', resize: 'vertical', minHeight: '60px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b6b66', padding: '8px 12px', borderBottom: '2px solid #e5e4e0', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '11px 12px', fontSize: '0.875rem', color: '#1a1a18', borderBottom: '1px solid #f0efeb', verticalAlign: 'middle' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' },
  statBox: { background: '#f9f8f5', borderRadius: '8px', padding: '1rem', textAlign: 'center' },
  statNum: { fontSize: '1.4rem', fontWeight: '700', color: '#2d6a4f' },
  statLabel: { fontSize: '0.72rem', color: '#6b6b66', marginTop: '2px' },
  btn: { padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' },
  btnPrimary: { background: '#2d6a4f', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
  btnSecondary: { background: '#f0efeb', color: '#1a1a18', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' },
  btnDanger: { background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  alert: { padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' },
  successAlert: { background: '#dcfce7', color: '#166534' },
  errorAlert: { background: '#fee2e2', color: '#dc2626' },
  emptyState: { textAlign: 'center', padding: '2rem', color: '#6b6b66', fontSize: '0.9rem' },
  tabs: { display: 'flex', gap: '0', borderBottom: '2px solid #e5e4e0', marginBottom: '1.5rem' },
  tab: { padding: '10px 20px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', color: '#6b6b66', border: 'none', background: 'none', borderBottom: '2px solid transparent', marginBottom: '-2px' },
  tabActive: { color: '#2d6a4f', borderBottom: '2px solid #2d6a4f', marginBottom: '-2px' },
  staffCard: { background: '#f9f8f5', border: '1px solid #e5e4e0', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
}

const statusLabels = { present: 'Présent', absent: 'Absent', late: 'En retard', half_day: 'Demi-journée' }
const statusColors = {
  present:  { background: '#dcfce7', color: '#166534' },
  absent:   { background: '#fee2e2', color: '#dc2626' },
  late:     { background: '#fef9c3', color: '#854d0e' },
  half_day: { background: '#dbeafe', color: '#1e40af' },
}
const roleLabels = {
  admin: 'Admin', manager: 'Manager', staff: 'Personnel',
  chef: 'Chef', server: 'Serveur', waiter: 'Serveur',
  purchasing: 'Achat', cook: 'Cuisinier', driver: 'Chauffeur', cleaner: 'Nettoyage',
}
const roleColors = {
  admin:      { background: '#f3e8ff', color: '#6b21a8' },
  manager:    { background: '#dbeafe', color: '#1e40af' },
  staff:      { background: '#f0efeb', color: '#6b6b66' },
  chef:       { background: '#fef9c3', color: '#854d0e' },
  server:     { background: '#dcfce7', color: '#166534' },
  waiter:     { background: '#dcfce7', color: '#166534' },
  purchasing: { background: '#dbeafe', color: '#1e40af' },
  cook:       { background: '#fef9c3', color: '#854d0e' },
  driver:     { background: '#f0efeb', color: '#6b6b66' },
  cleaner:    { background: '#f0efeb', color: '#6b6b66' },
}

const emptyAttForm = {
  user_id: '', event_id: '', status: 'present',
  clock_in: new Date().toISOString().slice(0, 16), clock_out: '', notes: '',
}
const emptyMemberForm = { name: '', email: '', role: 'waiter' }

export default function Personnel() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [tab, setTab] = useState('equipe')
  const [staff, setStaff] = useState([])
  const [events, setEvents] = useState([])
  const [attendances, setAttendances] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingMember, setSavingMember] = useState(false)
  const [message, setMessage] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Attendance form
  const [showAttForm, setShowAttForm] = useState(false)
  const [attForm, setAttForm] = useState(emptyAttForm)

  // New member form
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [memberForm, setMemberForm] = useState(emptyMemberForm)

  const [filterEvent, setFilterEvent] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [staffRes, eventsRes, attRes] = await Promise.all([
      supabase.from('users').select('*').eq('business_id', profile.business_id).order('name'),
      supabase.from('events').select('*, clients(full_name)').order('event_date', { ascending: false }),
      supabase.from('staff_attendance').select('*, users(name, role), events(title, event_date)').order('clock_in', { ascending: false }),
    ])
    setStaff(staffRes.data || [])
    setEvents(eventsRes.data || [])
    setAttendances(attRes.data || [])
    setLoading(false)
  }

  async function handleAddMember() {
    if (!memberForm.name.trim() || !memberForm.email.trim()) {
      setMessage({ type: 'error', text: 'Nom et email sont obligatoires.' })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    setSavingMember(true)
    const { error } = await supabase.from('users').insert({
      name:          memberForm.name.trim(),
      email:         memberForm.email.trim().toLowerCase(),
      role:          memberForm.role,
      is_active:     true,
      password_hash: 'placeholder',
      business_id:   profile?.business_id,
    })
    if (error) {
      setMessage({ type: 'error', text: 'Erreur: ' + error.message })
    } else {
      setMessage({ type: 'success', text: `✓ Membre "${memberForm.name}" ajouté.` })
      setMemberForm(emptyMemberForm)
      setShowMemberForm(false)
      await loadAll()
      setTimeout(() => setMessage(null), 3000)
    }
    setSavingMember(false)
  }

  async function handleAddAttendance() {
    if (!attForm.user_id) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un membre du personnel.' })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    setSaving(true)
    const { error } = await supabase.from('staff_attendance').insert({
      user_id:     attForm.user_id,
      event_id:    attForm.event_id || null,
      status:      attForm.status,
      clock_in:    attForm.clock_in ? new Date(attForm.clock_in).toISOString() : new Date().toISOString(),
      clock_out:   attForm.clock_out ? new Date(attForm.clock_out).toISOString() : null,
      notes:       attForm.notes || null,
      business_id: profile?.business_id,
    })
    if (error) {
      setMessage({ type: 'error', text: 'Erreur: ' + error.message })
    } else {
      setMessage({ type: 'success', text: '✓ Présence enregistrée.' })
      setAttForm(emptyAttForm)
      setShowAttForm(false)
      await loadAll()
      setTimeout(() => setMessage(null), 3000)
    }
    setSaving(false)
  }

  async function handleDeleteAtt(id) {
    if (!isAdmin) return
    await supabase.from('staff_attendance').delete().eq('id', id)
    setAttendances(prev => prev.filter(a => a.id !== id))
    setConfirmDelete(null)
    setMessage({ type: 'success', text: '✓ Enregistrement supprimé.' })
    setTimeout(() => setMessage(null), 3000)
  }

  function formatDateTime(ts) {
    if (!ts) return '—'
    return new Date(ts).toLocaleString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function calcDuration(cin, cout) {
    if (!cin || !cout) return '—'
    const diff = new Date(cout) - new Date(cin)
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h${m > 0 ? m + 'min' : ''}`
  }

  const filteredAtt = attendances.filter(a => {
    if (filterEvent && a.event_id !== filterEvent) return false
    if (filterStatus && a.status !== filterStatus) return false
    return true
  })

  const activeStaff    = staff.filter(s => s.is_active).length
  const totalPresent   = attendances.filter(a => a.status === 'present').length
  const totalAbsent    = attendances.filter(a => a.status === 'absent').length
  const totalLate      = attendances.filter(a => a.status === 'late').length

  return (
    <div style={S.page}>
      <h1 style={S.title}>Gestion du personnel</h1>
      <p style={S.subtitle}>Gérez votre équipe et suivez les présences par événement.</p>

      {message && (
        <div style={{ ...S.alert, ...(message.type === 'success' ? S.successAlert : S.errorAlert) }}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div style={S.grid4}>
        <div style={S.statBox}><div style={{ ...S.statNum, color: '#2d6a4f' }}>{activeStaff}</div><div style={S.statLabel}>Personnel actif</div></div>
        <div style={S.statBox}><div style={{ ...S.statNum, color: '#166534' }}>{totalPresent}</div><div style={S.statLabel}>Présences enregistrées</div></div>
        <div style={S.statBox}><div style={{ ...S.statNum, color: '#dc2626' }}>{totalAbsent}</div><div style={S.statLabel}>Absences</div></div>
        <div style={S.statBox}><div style={{ ...S.statNum, color: '#d97706' }}>{totalLate}</div><div style={S.statLabel}>Retards</div></div>
      </div>

      <div style={{ ...S.card, marginTop: '1.5rem' }}>
        <div style={S.tabs}>
          <button style={{ ...S.tab, ...(tab === 'equipe' ? S.tabActive : {}) }} onClick={() => setTab('equipe')}>
            👥 Équipe ({staff.length})
          </button>
          <button style={{ ...S.tab, ...(tab === 'presences' ? S.tabActive : {}) }} onClick={() => setTab('presences')}>
            ✅ Présences ({attendances.length})
          </button>
          <button style={{ ...S.tab, ...(tab === 'traditionnel' ? S.tabActive : {}) }} onClick={() => setTab('traditionnel')}>
            🎭 Traditionnel
          </button>
        </div>

        {loading && tab !== 'traditionnel' ? (
          <div style={S.emptyState}>Chargement...</div>
        ) : tab === 'traditionnel' ? (
          <PersonnelTraditional />
        ) : tab === 'equipe' ? (
          <div>
            {/* Add member button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button style={{ ...S.btnPrimary, whiteSpace: 'nowrap' }} onClick={() => setShowMemberForm(v => !v)}>
                {showMemberForm ? '✕ Annuler' : '+ Nouveau membre'}
              </button>
            </div>

            {/* Add Member Form */}
            {showMemberForm && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: '600', color: '#166534', marginBottom: '1rem' }}>Nouveau membre du personnel</div>
                <div style={S.grid3}>
                  <div>
                    <label style={S.label}>Nom complet *</label>
                    <input style={S.input} placeholder="ex: Karim Serveur" value={memberForm.name} onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>Email *</label>
                    <input type="email" style={S.input} placeholder="karim@traiteur-pro.com" value={memberForm.email} onChange={e => setMemberForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>Rôle</label>
                    <select style={S.select} value={memberForm.role} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))}>
                      <option value="chef">Chef</option>
                      <option value="waiter">Serveur</option>
                      <option value="cook">Cuisinier</option>
                      <option value="purchasing">Achat</option>
                      <option value="driver">Chauffeur</option>
                      <option value="cleaner">Nettoyage</option>
                      <option value="staff">Personnel</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button style={S.btnPrimary} onClick={handleAddMember} disabled={savingMember}>
                    {savingMember ? 'Enregistrement...' : '✓ Ajouter le membre'}
                  </button>
                  <button style={S.btnSecondary} onClick={() => { setShowMemberForm(false); setMemberForm(emptyMemberForm) }}>Annuler</button>
                </div>
              </div>
            )}

            {/* Staff list */}
            {staff.length === 0 ? (
              <div style={S.emptyState}>Aucun membre du personnel trouvé.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {staff.map(member => (
                  <div key={member.id} style={{
                    ...S.staffCard,
                    opacity: member.is_active ? 1 : 0.5,
                    borderLeft: `3px solid ${member.is_active ? '#2d6a4f' : '#e5e4e0'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#2d6a4f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1rem', flexShrink: 0 }}>
                        {member.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1a1a18', fontSize: '0.95rem' }}>{member.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b6b66' }}>{member.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ ...S.badge, ...(roleColors[member.role] || { background: '#f0efeb', color: '#6b6b66' }) }}>
                        {roleLabels[member.role] || member.role}
                      </span>
                      <span style={{ ...S.badge, ...(member.is_active ? { background: '#dcfce7', color: '#166534' } : { background: '#f0efeb', color: '#6b6b66' }) }}>
                        {member.is_active ? 'Actif' : 'Inactif'}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#6b6b66' }}>
                        {attendances.filter(a => a.user_id === member.id).length} présence(s)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Filters + Add button */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={S.label}>Filtrer par événement</label>
                <select style={S.select} value={filterEvent} onChange={e => setFilterEvent(e.target.value)}>
                  <option value="">Tous les événements</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} — {ev.event_date ? new Date(ev.event_date).toLocaleDateString('fr-FR') : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label style={S.label}>Filtrer par statut</label>
                <select style={S.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">Tous les statuts</option>
                  <option value="present">Présent</option>
                  <option value="absent">Absent</option>
                  <option value="late">En retard</option>
                  <option value="half_day">Demi-journée</option>
                </select>
              </div>
              <button style={{ ...S.btnPrimary, whiteSpace: 'nowrap' }} onClick={() => setShowAttForm(v => !v)}>
                {showAttForm ? '✕ Annuler' : '+ Enregistrer une présence'}
              </button>
            </div>

            {/* Add Attendance Form */}
            {showAttForm && (
              <div style={{ background: '#f9f8f5', border: '1px solid #e5e4e0', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: '600', marginBottom: '1rem', color: '#1a1a18' }}>Nouvelle présence</div>
                <div style={S.grid2}>
                  <div>
                    <label style={S.label}>Membre du personnel *</label>
                    <select style={S.select} value={attForm.user_id} onChange={e => setAttForm(f => ({ ...f, user_id: e.target.value }))}>
                      <option value="">-- Choisir un membre --</option>
                      {staff.filter(s => s.is_active).map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({roleLabels[s.role] || s.role})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Événement associé</label>
                    <select style={S.select} value={attForm.event_id} onChange={e => setAttForm(f => ({ ...f, event_id: e.target.value }))}>
                      <option value="">-- Aucun événement --</option>
                      {events.map(ev => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title} — {ev.event_date ? new Date(ev.event_date).toLocaleDateString('fr-FR') : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ ...S.grid3, marginTop: '1rem' }}>
                  <div>
                    <label style={S.label}>Statut *</label>
                    <select style={S.select} value={attForm.status} onChange={e => setAttForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="present">Présent</option>
                      <option value="late">En retard</option>
                      <option value="half_day">Demi-journée</option>
                      <option value="absent">Absent</option>
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Heure d'arrivée</label>
                    <input type="datetime-local" style={S.input} value={attForm.clock_in} onChange={e => setAttForm(f => ({ ...f, clock_in: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>Heure de départ</label>
                    <input type="datetime-local" style={S.input} value={attForm.clock_out} onChange={e => setAttForm(f => ({ ...f, clock_out: e.target.value }))} />
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <label style={S.label}>Notes</label>
                  <textarea style={S.textarea} placeholder="Observations, remarques..." value={attForm.notes} onChange={e => setAttForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button style={S.btnPrimary} onClick={handleAddAttendance} disabled={saving}>
                    {saving ? 'Enregistrement...' : '✓ Enregistrer'}
                  </button>
                  <button style={S.btnSecondary} onClick={() => { setShowAttForm(false); setAttForm(emptyAttForm) }}>Annuler</button>
                </div>
              </div>
            )}

            {/* Attendance Table */}
            {filteredAtt.length === 0 ? (
              <div style={S.emptyState}>Aucune présence enregistrée.</div>
            ) : (
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Membre</th>
                    <th style={S.th}>Événement</th>
                    <th style={S.th}>Statut</th>
                    <th style={S.th}>Arrivée</th>
                    <th style={S.th}>Départ</th>
                    <th style={S.th}>Durée</th>
                    <th style={S.th}>Notes</th>
                    {isAdmin && <th style={S.th}></th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredAtt.map(a => (
                    <tr key={a.id} style={{ background: a.status === 'absent' ? '#fff5f5' : 'transparent' }}>
                      <td style={S.td}>
                        <div style={{ fontWeight: '600' }}>{a.users?.name || '—'}</div>
                        <span style={{ ...S.badge, ...(roleColors[a.users?.role] || { background: '#f0efeb', color: '#6b6b66' }), padding: '1px 6px', fontSize: '0.7rem' }}>
                          {roleLabels[a.users?.role] || a.users?.role || '—'}
                        </span>
                      </td>
                      <td style={{ ...S.td, fontSize: '0.82rem', color: '#6b6b66' }}>
                        {a.events ? (
                          <div>
                            <div>{a.events.title}</div>
                            <div style={{ fontSize: '0.75rem' }}>{a.events.event_date ? new Date(a.events.event_date).toLocaleDateString('fr-FR') : ''}</div>
                          </div>
                        ) : '—'}
                      </td>
                      <td style={S.td}>
                        <span style={{ ...S.badge, ...(statusColors[a.status] || { background: '#f0efeb', color: '#6b6b66' }) }}>
                          {statusLabels[a.status] || a.status}
                        </span>
                      </td>
                      <td style={{ ...S.td, fontSize: '0.82rem' }}>{formatDateTime(a.clock_in)}</td>
                      <td style={{ ...S.td, fontSize: '0.82rem' }}>{formatDateTime(a.clock_out)}</td>
                      <td style={{ ...S.td, fontSize: '0.82rem', color: '#2d6a4f', fontWeight: '600' }}>{calcDuration(a.clock_in, a.clock_out)}</td>
                      <td style={{ ...S.td, fontSize: '0.8rem', color: '#6b6b66' }}>{a.notes || '—'}</td>
                      {isAdmin && (
                        <td style={S.td}><button style={S.btnDanger} onClick={() => setConfirmDelete(a)}>✕</button></td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', width: '400px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#dc2626', marginBottom: '1rem' }}>⚠ Supprimer cette présence ?</div>
            <p style={{ color: '#6b6b66', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Présence de <strong>{confirmDelete.users?.name}</strong> —{' '}
              <span style={{ ...S.badge, ...(statusColors[confirmDelete.status] || {}) }}>{statusLabels[confirmDelete.status]}</span>{' '}
              le {formatDateTime(confirmDelete.clock_in)}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button style={{ ...S.btn, background: '#f9f8f5', color: '#6b6b66' }} onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button style={{ ...S.btn, background: '#dc2626', color: '#fff' }} onClick={() => handleDeleteAtt(confirmDelete.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
