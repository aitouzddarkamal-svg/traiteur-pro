import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { canDo } from '../lib/permissions';

const BILLING_LABELS = {
  forfait: 'Forfait',
  daily: 'Par jour',
  hourly: 'Par heure',
};

const BILLING_UNIT_LABEL = {
  forfait: 'prestation(s)',
  daily: 'jour(s)',
  hourly: 'heure(s)',
};

const DEFAULT_ROLES = [
  { name: 'Negafa', name_ar: 'نقافة', billing_type: 'forfait', default_rate: 2500 },
  { name: 'Tiyaba', name_ar: 'طيابة', billing_type: 'daily', default_rate: 400 },
  { name: 'Serveur thé', name_ar: 'قهوجي', billing_type: 'daily', default_rate: 250 },
  { name: 'Porteur Ammaria', name_ar: 'حامل العمارية', billing_type: 'forfait', default_rate: 800 },
  { name: 'Musiciens Gnawa', name_ar: 'كناوة', billing_type: 'forfait', default_rate: 3000 },
];

const S = {
  container: { padding: '0' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 15, fontWeight: 500, color: '#1a1a1a', margin: 0 },
  sub: { fontSize: 13, color: '#666', marginTop: 2 },
  btn: { background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 500 },
  btnGhost: { background: 'transparent', color: '#555', border: '1px solid #ddd', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' },
  btnDanger: { background: 'transparent', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  card: { background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '14px 16px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  roleNameFR: { fontSize: 14, fontWeight: 500, color: '#1a1a1a', margin: 0 },
  roleNameAR: { fontSize: 13, color: '#888', direction: 'rtl', margin: '2px 0 0' },
  badge: { fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500 },
  badgeForfait: { background: '#e8f4fd', color: '#1a6fa0' },
  badgeDaily: { background: '#e8f8f0', color: '#1a7a48' },
  badgeHourly: { background: '#fef4e8', color: '#a06010' },
  rateRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 },
  rate: { fontSize: 18, fontWeight: 500, color: '#2d6a4f' },
  rateUnit: { fontSize: 12, color: '#888' },
  actions: { display: 'flex', gap: 6, marginTop: 10 },
  divider: { height: 1, background: '#f0f0f0', margin: '20px 0' },
  sectionTitle: { fontSize: 12, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: 16, fontWeight: 500, margin: '0 0 20px' },
  formRow: { marginBottom: 14 },
  label: { fontSize: 12, color: '#555', marginBottom: 4, display: 'block' },
  input: { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none' },
  select: { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: '#fff', outline: 'none' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
  emptyBox: { textAlign: 'center', padding: '40px 20px', color: '#888', fontSize: 13 },
  assignTable: { width: '100%', borderCollapse: 'collapse', marginTop: 12 },
  th: { fontSize: 11, fontWeight: 500, color: '#888', textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #f0f0f0', textTransform: 'uppercase' },
  td: { fontSize: 13, padding: '10px 8px', borderBottom: '1px solid #f8f8f8', verticalAlign: 'middle' },
  totalRow: { background: '#f8fffe', fontWeight: 500 },
  totalLabel: { fontSize: 13, fontWeight: 500, color: '#1a1a1a' },
  totalVal: { fontSize: 15, fontWeight: 500, color: '#2d6a4f' },
  eventSelect: { padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, minWidth: 220 },
  infoBox: { background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#666', marginBottom: 16 },
};

function getBadgeStyle(billing_type) {
  if (billing_type === 'daily') return { ...S.badge, ...S.badgeDaily };
  if (billing_type === 'hourly') return { ...S.badge, ...S.badgeHourly };
  return { ...S.badge, ...S.badgeForfait };
}

function calcTotal(rate, quantity, units, billing_type) {
  if (billing_type === 'forfait') return rate * quantity;
  return rate * quantity * units;
}

export default function PersonnelTraditional() {
  const { profile } = useAuth();
  const canCreate = canDo(profile?.role, 'canCreate');
  const canDelete = canDo(profile?.role, 'canDelete');

  const [roles, setRoles] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingAssign, setEditingAssign] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', name_ar: '', billing_type: 'forfait', default_rate: '' });
  const [assignForm, setAssignForm] = useState({ role_id: '', role_name: '', billing_type: 'forfait', rate: '', quantity: 1, units: 1, notes: '' });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('catalog');

  useEffect(() => { loadRoles(); loadEvents(); }, []);
  useEffect(() => { if (selectedEvent) loadAssignments(selectedEvent); else setAssignments([]); }, [selectedEvent]);

  async function loadRoles() {
    setLoading(true);
    const { data } = await supabase.from('traditional_roles')
      .select('*').eq('business_id', profile.business_id).eq('is_active', true).order('name');
    setRoles(data || []);
    setLoading(false);
  }

  async function loadEvents() {
    const { data } = await supabase.from('events')
      .select('id, name, event_date, client_name').eq('business_id', profile.business_id)
      .order('event_date', { ascending: false }).limit(50);
    setEvents(data || []);
  }

  async function loadAssignments(eventId) {
    const { data } = await supabase.from('event_traditional_staff')
      .select('*').eq('event_id', eventId).eq('business_id', profile.business_id).order('created_at');
    setAssignments(data || []);
  }

  function openRoleModal(role = null) {
    if (role) {
      setEditingRole(role);
      setRoleForm({ name: role.name, name_ar: role.name_ar || '', billing_type: role.billing_type, default_rate: role.default_rate });
    } else {
      setEditingRole(null);
      setRoleForm({ name: '', name_ar: '', billing_type: 'forfait', default_rate: '' });
    }
    setShowRoleModal(true);
  }

  function openAssignModal(assign = null) {
    if (assign) {
      setEditingAssign(assign);
      setAssignForm({ role_id: assign.role_id || '', role_name: assign.role_name, billing_type: assign.billing_type, rate: assign.rate, quantity: assign.quantity, units: assign.units, notes: assign.notes || '' });
    } else {
      setEditingAssign(null);
      setAssignForm({ role_id: '', role_name: '', billing_type: 'forfait', rate: '', quantity: 1, units: 1, notes: '' });
    }
    setShowAssignModal(true);
  }

  function handleRoleSelect(roleId) {
    const r = roles.find(x => x.id === roleId);
    if (r) setAssignForm(f => ({ ...f, role_id: r.id, role_name: r.name, billing_type: r.billing_type, rate: r.default_rate }));
    else setAssignForm(f => ({ ...f, role_id: '', role_name: '' }));
  }

  async function saveRole() {
    if (!roleForm.name || !roleForm.default_rate) return;
    setSaving(true);
    const payload = { business_id: profile.business_id, name: roleForm.name, name_ar: roleForm.name_ar, billing_type: roleForm.billing_type, default_rate: parseFloat(roleForm.default_rate) };
    if (editingRole) {
      await supabase.from('traditional_roles').update(payload).eq('id', editingRole.id);
    } else {
      await supabase.from('traditional_roles').insert(payload);
    }
    setSaving(false);
    setShowRoleModal(false);
    loadRoles();
  }

  async function deleteRole(id) {
    if (!window.confirm('Supprimer ce rôle ?')) return;
    await supabase.from('traditional_roles').update({ is_active: false }).eq('id', id);
    loadRoles();
  }

  async function saveAssignment() {
    if (!assignForm.role_name || !assignForm.rate || !selectedEvent) return;
    setSaving(true);
    const payload = {
      business_id: profile.business_id,
      event_id: selectedEvent,
      role_id: assignForm.role_id || null,
      role_name: assignForm.role_name,
      billing_type: assignForm.billing_type,
      rate: parseFloat(assignForm.rate),
      quantity: parseInt(assignForm.quantity),
      units: parseFloat(assignForm.units),
      notes: assignForm.notes,
    };
    if (editingAssign) {
      await supabase.from('event_traditional_staff').update(payload).eq('id', editingAssign.id);
    } else {
      await supabase.from('event_traditional_staff').insert(payload);
    }
    setSaving(false);
    setShowAssignModal(false);
    loadAssignments(selectedEvent);
  }

  async function deleteAssignment(id) {
    if (!window.confirm('Retirer ce poste ?')) return;
    await supabase.from('event_traditional_staff').delete().eq('id', id);
    loadAssignments(selectedEvent);
  }

  async function seedDefaultRoles() {
    const existing = roles.map(r => r.name);
    const toInsert = DEFAULT_ROLES.filter(r => !existing.includes(r.name)).map(r => ({ ...r, business_id: profile.business_id }));
    if (toInsert.length === 0) { alert('Les rôles par défaut existent déjà.'); return; }
    await supabase.from('traditional_roles').insert(toInsert);
    loadRoles();
  }

  const totalCost = assignments.reduce((sum, a) => sum + calcTotal(a.rate, a.quantity, a.units, a.billing_type), 0);

  return (
    <div style={S.container}>
      <div style={S.topBar}>
        <div>
          <p style={S.title}>Personnel traditionnel</p>
          <p style={S.sub}>Negafa, Tiyaba, Porteurs, Musiciens — coûts par événement</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canCreate && activeTab === 'catalog' && <button style={S.btnGhost} onClick={seedDefaultRoles}>+ Rôles par défaut</button>}
          {canCreate && activeTab === 'catalog' && <button style={S.btn} onClick={() => openRoleModal()}>+ Nouveau rôle</button>}
          {canCreate && activeTab === 'event' && selectedEvent && <button style={S.btn} onClick={() => openAssignModal()}>+ Ajouter un poste</button>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {['catalog', 'event'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ ...S.btnGhost, background: activeTab === t ? '#2d6a4f' : 'transparent', color: activeTab === t ? '#fff' : '#555', border: activeTab === t ? 'none' : '1px solid #ddd' }}>
            {t === 'catalog' ? 'Catalogue des rôles' : 'Par événement'}
          </button>
        ))}
      </div>

      {activeTab === 'catalog' && (
        <>
          {loading ? <p style={{ color: '#888', fontSize: 13 }}>Chargement...</p> : roles.length === 0 ? (
            <div style={S.emptyBox}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎭</div>
              <p style={{ margin: '0 0 4px', fontWeight: 500 }}>Aucun rôle défini</p>
              <p style={{ margin: 0 }}>Cliquez sur "Rôles par défaut" pour démarrer rapidement</p>
            </div>
          ) : (
            <div style={S.grid}>
              {roles.map(role => (
                <div key={role.id} style={S.card}>
                  <div style={S.cardHeader}>
                    <div>
                      <p style={S.roleNameFR}>{role.name}</p>
                      {role.name_ar && <p style={S.roleNameAR}>{role.name_ar}</p>}
                    </div>
                    <span style={getBadgeStyle(role.billing_type)}>{BILLING_LABELS[role.billing_type]}</span>
                  </div>
                  <div style={S.rateRow}>
                    <span style={S.rate}>{Number(role.default_rate).toLocaleString('fr-MA')} MAD</span>
                    <span style={S.rateUnit}>/ {BILLING_UNIT_LABEL[role.billing_type]}</span>
                  </div>
                  <div style={S.actions}>
                    {canCreate && <button style={S.btnGhost} onClick={() => openRoleModal(role)}>Modifier</button>}
                    {canDelete && <button style={S.btnDanger} onClick={() => deleteRole(role.id)}>Supprimer</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'event' && (
        <>
          <div style={S.infoBox}>
            Sélectionnez un événement pour voir ou ajouter le personnel traditionnel et calculer la masse salariale cérémoniale.
          </div>
          <div style={{ marginBottom: 20 }}>
            <select style={S.eventSelect} value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
              <option value="">-- Choisir un événement --</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.name || ev.client_name} — {ev.event_date ? new Date(ev.event_date).toLocaleDateString('fr-MA') : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <>
              {assignments.length === 0 ? (
                <div style={S.emptyBox}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>👗</div>
                  <p style={{ margin: '0 0 4px', fontWeight: 500 }}>Aucun poste traditionnel assigné</p>
                  <p style={{ margin: 0 }}>Cliquez sur "+ Ajouter un poste" pour commencer</p>
                </div>
              ) : (
                <>
                  <table style={S.assignTable}>
                    <thead>
                      <tr>
                        <th style={S.th}>Rôle</th>
                        <th style={S.th}>Type</th>
                        <th style={S.th}>Tarif</th>
                        <th style={S.th}>Qté</th>
                        <th style={S.th}>Unités</th>
                        <th style={S.th}>Total</th>
                        <th style={S.th}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map(a => {
                        const total = calcTotal(a.rate, a.quantity, a.units, a.billing_type);
                        return (
                          <tr key={a.id}>
                            <td style={S.td}>
                              <div style={{ fontWeight: 500 }}>{a.role_name}</div>
                              {a.notes && <div style={{ fontSize: 11, color: '#888' }}>{a.notes}</div>}
                            </td>
                            <td style={S.td}><span style={getBadgeStyle(a.billing_type)}>{BILLING_LABELS[a.billing_type]}</span></td>
                            <td style={S.td}>{Number(a.rate).toLocaleString('fr-MA')} MAD</td>
                            <td style={S.td}>{a.quantity}</td>
                            <td style={S.td}>{a.billing_type === 'forfait' ? '—' : `${a.units} ${BILLING_UNIT_LABEL[a.billing_type]}`}</td>
                            <td style={{ ...S.td, fontWeight: 500, color: '#2d6a4f' }}>{Number(total).toLocaleString('fr-MA')} MAD</td>
                            <td style={S.td}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {canCreate && <button style={S.btnGhost} onClick={() => openAssignModal(a)}>✏️</button>}
                                {canDelete && <button style={S.btnDanger} onClick={() => deleteAssignment(a.id)}>✕</button>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={S.totalRow}>
                        <td colSpan={5} style={{ ...S.td, ...S.totalLabel }}>Total masse salariale traditionnelle</td>
                        <td style={{ ...S.td, ...S.totalVal }}>{Number(totalCost).toLocaleString('fr-MA')} MAD</td>
                        <td style={S.td}></td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}
        </>
      )}

      {showRoleModal && (
        <div style={S.overlay} onClick={() => setShowRoleModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <p style={S.modalTitle}>{editingRole ? 'Modifier le rôle' : 'Nouveau rôle traditionnel'}</p>
            <div style={S.formRow}>
              <label style={S.label}>Nom du rôle (français) *</label>
              <input style={S.input} value={roleForm.name} onChange={e => setRoleForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Negafa" />
            </div>
            <div style={S.formRow}>
              <label style={S.label}>Nom en arabe</label>
              <input style={{ ...S.input, direction: 'rtl', textAlign: 'right' }} value={roleForm.name_ar} onChange={e => setRoleForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="نقافة" />
            </div>
            <div style={S.row2}>
              <div style={S.formRow}>
                <label style={S.label}>Type de facturation</label>
                <select style={S.select} value={roleForm.billing_type} onChange={e => setRoleForm(f => ({ ...f, billing_type: e.target.value }))}>
                  <option value="forfait">Forfait</option>
                  <option value="daily">Par jour</option>
                  <option value="hourly">Par heure</option>
                </select>
              </div>
              <div style={S.formRow}>
                <label style={S.label}>Tarif par défaut (MAD)</label>
                <input style={S.input} type="number" value={roleForm.default_rate} onChange={e => setRoleForm(f => ({ ...f, default_rate: e.target.value }))} placeholder="2500" />
              </div>
            </div>
            <div style={S.modalActions}>
              <button style={S.btnGhost} onClick={() => setShowRoleModal(false)}>Annuler</button>
              <button style={S.btn} onClick={saveRole} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div style={S.overlay} onClick={() => setShowAssignModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <p style={S.modalTitle}>{editingAssign ? 'Modifier le poste' : 'Ajouter un poste traditionnel'}</p>
            <div style={S.formRow}>
              <label style={S.label}>Rôle du catalogue</label>
              <select style={S.select} value={assignForm.role_id} onChange={e => handleRoleSelect(e.target.value)}>
                <option value="">-- Choisir un rôle --</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name} {r.name_ar ? `(${r.name_ar})` : ''}</option>)}
                <option value="custom">Rôle personnalisé...</option>
              </select>
            </div>
            {(!assignForm.role_id || assignForm.role_id === 'custom') && (
              <div style={S.formRow}>
                <label style={S.label}>Nom du rôle *</label>
                <input style={S.input} value={assignForm.role_name} onChange={e => setAssignForm(f => ({ ...f, role_name: e.target.value }))} placeholder="ex: Décorateur floral" />
              </div>
            )}
            <div style={S.row2}>
              <div style={S.formRow}>
                <label style={S.label}>Type de facturation</label>
                <select style={S.select} value={assignForm.billing_type} onChange={e => setAssignForm(f => ({ ...f, billing_type: e.target.value }))}>
                  <option value="forfait">Forfait</option>
                  <option value="daily">Par jour</option>
                  <option value="hourly">Par heure</option>
                </select>
              </div>
              <div style={S.formRow}>
                <label style={S.label}>Tarif (MAD)</label>
                <input style={S.input} type="number" value={assignForm.rate} onChange={e => setAssignForm(f => ({ ...f, rate: e.target.value }))} placeholder="2500" />
              </div>
            </div>
            <div style={S.row2}>
              <div style={S.formRow}>
                <label style={S.label}>Nombre de personnes</label>
                <input style={S.input} type="number" min="1" value={assignForm.quantity} onChange={e => setAssignForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              {assignForm.billing_type !== 'forfait' && (
                <div style={S.formRow}>
                  <label style={S.label}>{assignForm.billing_type === 'daily' ? 'Nombre de jours' : 'Nombre d\'heures'}</label>
                  <input style={S.input} type="number" step="0.5" min="0.5" value={assignForm.units} onChange={e => setAssignForm(f => ({ ...f, units: e.target.value }))} />
                </div>
              )}
            </div>
            <div style={{ background: '#f0faf4', border: '1px solid #c3e6d4', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: '#555' }}>Coût total estimé : </span>
              <span style={{ fontSize: 16, fontWeight: 500, color: '#2d6a4f' }}>
                {Number(calcTotal(parseFloat(assignForm.rate) || 0, parseInt(assignForm.quantity) || 1, parseFloat(assignForm.units) || 1, assignForm.billing_type)).toLocaleString('fr-MA')} MAD
              </span>
            </div>
            <div style={S.formRow}>
              <label style={S.label}>Notes (optionnel)</label>
              <input style={S.input} value={assignForm.notes} onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))} placeholder="ex: 2 tenues de rechange incluses" />
            </div>
            <div style={S.modalActions}>
              <button style={S.btnGhost} onClick={() => setShowAssignModal(false)}>Annuler</button>
              <button style={S.btn} onClick={saveAssignment} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
