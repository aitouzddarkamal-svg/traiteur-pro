import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { canDo } from '../lib/permissions';
import CategoryManager from '../components/CategoryManager';

const PRESET_COLORS = [
  { key: 'purple', label: 'Violet',  bg: '#fdf4ff', color: '#6b21a8', border: '#e0b8f0' },
  { key: 'green',  label: 'Vert',    bg: '#f0fdf4', color: '#14532d', border: '#86efac' },
  { key: 'orange', label: 'Orange',  bg: '#fff7ed', color: '#7c2d12', border: '#fdba74' },
  { key: 'blue',   label: 'Bleu',    bg: '#eff6ff', color: '#1e3a8a', border: '#93c5fd' },
  { key: 'pink',   label: 'Rose',    bg: '#fdf2f8', color: '#9d174d', border: '#f9a8d4' },
  { key: 'gray',   label: 'Gris',    bg: '#f9f8f5', color: '#555555', border: '#dddddd' },
];

function getPreset(colorKey) {
  return PRESET_COLORS.find(p => p.key === colorKey) || PRESET_COLORS[5];
}

const S = {
  page:       { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
  title:      { fontSize: '1.5rem', fontWeight: '600', color: '#1a1a18', marginBottom: '4px' },
  subtitle:   { fontSize: '0.9rem', color: '#6b6b66', marginBottom: '2rem' },
  topBar:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
  btn:        { background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer', fontWeight: 500 },
  btnGhost:   { background: 'transparent', color: '#555', border: '1px solid #ddd', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' },
  btnDanger:  { background: 'transparent', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  btnSm:      { background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' },
  tabs:       { display: 'flex', gap: 0, borderBottom: '2px solid #e5e4e0', marginBottom: '1.5rem' },
  tab:        { padding: '10px 20px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', color: '#6b6b66', border: 'none', background: 'none', borderBottom: '2px solid transparent', marginBottom: '-2px' },
  tabActive:  { color: '#2d6a4f', borderBottom: '2px solid #2d6a4f', marginBottom: '-2px' },
  card:       { background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '16px', marginBottom: 10 },
  grid:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  statGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 24 },
  statBox:    { background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '14px', textAlign: 'center' },
  statNum:    { fontSize: 22, fontWeight: 700, color: '#2d6a4f' },
  statLabel:  { fontSize: 11, color: '#888', marginTop: 2 },
  badge:      { display: 'inline-block', fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 500 },
  availOk:    { background: '#e8f8f0', color: '#1a7a48' },
  availWarn:  { background: '#fff8e8', color: '#a06010' },
  availFull:  { background: '#fde8e8', color: '#c0392b' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { fontSize: 11, fontWeight: 600, color: '#888', textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #f0f0f0', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td:         { fontSize: 13, padding: '10px 10px', borderBottom: '1px solid #f8f8f8', verticalAlign: 'middle' },
  emptyState: { textAlign: 'center', padding: '40px 20px', color: '#888', fontSize: 13 },
  overlay:    { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal:      { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: 16, fontWeight: 600, marginBottom: 20 },
  formRow:    { marginBottom: 14 },
  label:      { fontSize: 12, color: '#555', marginBottom: 4, display: 'block' },
  input:      { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none' },
  select:     { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: '#fff', outline: 'none' },
  row2:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  modalFoot:  { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
  warnBox:    { background: '#fff8e8', border: '1px solid #f5c06c', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#a06010', marginBottom: 14 },
  dangerBox:  { background: '#fde8e8', border: '1px solid #f5a6a6', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#c0392b', marginBottom: 14 },
  infoBox:    { background: '#f0faf4', border: '1px solid #c3e6d4', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1a7a48', marginBottom: 14 },
  eventSel:   { padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, minWidth: 260 },
};

export default function ArtDeLaTable() {
  const { profile } = useAuth();
  const canCreate = canDo(profile?.role, 'canCreate');
  const canDelete = canDo(profile?.role, 'canDelete');

  const [tab, setTab]                       = useState('catalog');
  const [items, setItems]                   = useState([]);
  const [events, setEvents]                 = useState([]);
  const [selectedEvent, setSelectedEvent]   = useState('');
  const [assignments, setAssignments]       = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [categories, setCategories]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);

  // Item modal
  const [showItemModal, setShowItemModal]   = useState(false);
  const [editingItem, setEditingItem]       = useState(null);
  const [itemForm, setItemForm]             = useState({ name: '', name_ar: '', category: '', total_quantity: 1, unit: 'pièce', notes: '' });

  // Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm]           = useState({ item_id: '', quantity: 1, date_out: '', date_return: '', notes: '' });
  const [availability, setAvailability]       = useState(null);

  const [showCatManager, setShowCatManager] = useState(false);

  // Category modal
  const [showCatModal, setShowCatModal]     = useState(false);
  const [catForm, setCatForm]               = useState({ name: '', name_ar: '', color: 'green' });
  const [editingCat, setEditingCat]         = useState(null);

  useEffect(() => { loadAll(); loadCategories(); }, []);
  useEffect(() => { if (selectedEvent) loadAssignments(selectedEvent); else setAssignments([]); }, [selectedEvent]);
  useEffect(() => { if (assignForm.item_id && selectedEvent) checkAvailability(assignForm.item_id); }, [assignForm.item_id, selectedEvent]);

  // ── Helpers (use categories state via closure) ──────────────────────────────
  function getCatStyle(catId) {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return { bg: '#f9f8f5', color: '#555', border: '#ddd' };
    return getPreset(cat.color);
  }

  function getCatLabel(catId) {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : catId || '—';
  }

  async function loadCategories() {
    const { data } = await supabase
      .from('item_categories')
      .select('*')
      .eq('business_id', profile.business_id)
      .eq('module', 'rental')
      .eq('is_active', true)
      .order('sort_order');
    setCategories(data || []);
  }

  // ── Data loading ────────────────────────────────────────────────────────────
  async function loadAll() {
    setLoading(true);
    const [itemsRes, eventsRes, allAssRes, catsRes] = await Promise.all([
      supabase.from('rental_items').select('*').eq('business_id', profile.business_id).eq('is_active', true).order('category').order('name'),
      supabase.from('events').select('id, name, client_name, event_date').eq('business_id', profile.business_id).order('event_date', { ascending: false }).limit(60),
      supabase.from('event_rental_items').select('*, rental_items(name), events(event_date, name, client_name)').eq('business_id', profile.business_id).eq('returned', false),
      supabase.from('rental_categories').select('*').eq('business_id', profile.business_id).order('name'),
    ]);
    setItems(itemsRes.data || []);
    setEvents(eventsRes.data || []);
    setAllAssignments(allAssRes.data || []);
    setCategories(catsRes.data || []);
    setLoading(false);
  }

  async function loadAssignments(eventId) {
    const { data } = await supabase.from('event_rental_items')
      .select('*, rental_items(name, name_ar, category, total_quantity, unit)')
      .eq('event_id', eventId).eq('business_id', profile.business_id).order('created_at');
    setAssignments(data || []);
  }

  async function checkAvailability(itemId) {
    if (!itemId || !selectedEvent) return;
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const ev = events.find(e => e.id === selectedEvent);
    if (!ev?.event_date) { setAvailability(null); return; }
    const { data } = await supabase.from('event_rental_items')
      .select('quantity, event_id, events(event_date)')
      .eq('item_id', itemId).eq('returned', false).neq('event_id', selectedEvent);
    const sameDate = (data || []).filter(r => r.events?.event_date === ev.event_date);
    const usedQty  = sameDate.reduce((s, r) => s + (r.quantity || 0), 0);
    setAvailability({ total: item.total_quantity, used: usedQty, free: item.total_quantity - usedQty, conflicts: sameDate.length });
  }

  // ── Item CRUD ────────────────────────────────────────────────────────────────
  function openItemModal(item = null) {
    const defaultCat = categories[0]?.id || '';
    if (item) {
      setEditingItem(item);
      setItemForm({ name: item.name, name_ar: item.name_ar || '', category: item.category, total_quantity: item.total_quantity, unit: item.unit, notes: item.notes || '' });
    } else {
      setEditingItem(null);
      setItemForm({ name: '', name_ar: '', category: defaultCat, total_quantity: 1, unit: 'pièce', notes: '' });
    }
    setShowItemModal(true);
  }

  async function saveItem() {
    if (!itemForm.name) return;
    setSaving(true);
    const payload = { business_id: profile.business_id, name: itemForm.name, name_ar: itemForm.name_ar, category: itemForm.category, total_quantity: parseInt(itemForm.total_quantity) || 1, unit: itemForm.unit, notes: itemForm.notes };
    if (editingItem) await supabase.from('rental_items').update(payload).eq('id', editingItem.id);
    else await supabase.from('rental_items').insert(payload);
    setSaving(false); setShowItemModal(false); loadAll();
  }

  async function deleteItem(id) {
    if (!window.confirm('Supprimer cet article ?')) return;
    await supabase.from('rental_items').update({ is_active: false }).eq('id', id);
    loadAll();
  }

  // ── Category CRUD ────────────────────────────────────────────────────────────
  async function saveCat() {
    if (!catForm.name.trim()) return;
    setSaving(true);
    await supabase.from('rental_categories').insert({
      business_id: profile.business_id,
      name: catForm.name.trim(),
      name_ar: catForm.name_ar.trim() || null,
      color: catForm.color,
    });
    setCatForm({ name: '', name_ar: '', color: 'green' });
    await loadAll();
    setSaving(false);
  }

  async function saveEditCat() {
    if (!editingCat?.name.trim()) return;
    setSaving(true);
    await supabase.from('rental_categories').update({
      name: editingCat.name.trim(),
      name_ar: editingCat.name_ar?.trim() || null,
      color: editingCat.color,
    }).eq('id', editingCat.id);
    setEditingCat(null);
    await loadAll();
    setSaving(false);
  }

  async function deleteCat(id) {
    if (!window.confirm('Supprimer cette catégorie ? Les articles liés perdront leur catégorie.')) return;
    await supabase.from('rental_categories').delete().eq('id', id);
    loadAll();
  }

  // ── Assignment CRUD ──────────────────────────────────────────────────────────
  function openAssignModal() {
    setAssignForm({ item_id: '', quantity: 1, date_out: '', date_return: '', notes: '' });
    setAvailability(null);
    setShowAssignModal(true);
  }

  async function saveAssignment() {
    if (!assignForm.item_id || !selectedEvent) return;
    if (availability && availability.free < assignForm.quantity) {
      if (!window.confirm(`Stock insuffisant (${availability.free} disponible). Confirmer quand même ?`)) return;
    }
    setSaving(true);
    const ev = events.find(e => e.id === selectedEvent);
    await supabase.from('event_rental_items').insert({ business_id: profile.business_id, event_id: selectedEvent, item_id: assignForm.item_id, quantity: parseInt(assignForm.quantity) || 1, date_out: assignForm.date_out || ev?.event_date || null, date_return: assignForm.date_return || null, notes: assignForm.notes, returned: false });
    setSaving(false); setShowAssignModal(false);
    loadAssignments(selectedEvent); loadAll();
  }

  async function toggleReturned(id, current) {
    await supabase.from('event_rental_items').update({ returned: !current }).eq('id', id);
    loadAssignments(selectedEvent); loadAll();
  }

  async function deleteAssignment(id) {
    if (!window.confirm('Retirer cet article ?')) return;
    await supabase.from('event_rental_items').delete().eq('id', id);
    loadAssignments(selectedEvent); loadAll();
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  function getItemUsed(itemId) { return allAssignments.filter(a => a.item_id === itemId).reduce((s, a) => s + (a.quantity || 0), 0); }
  function getItemFree(item) { return item.total_quantity - getItemUsed(item.id); }
  function getAvailBadge(item) {
    const free = getItemFree(item);
    if (free <= 0) return <span style={{ ...S.badge, ...S.availFull }}>Épuisé</span>;
    if (free < item.total_quantity * 0.3) return <span style={{ ...S.badge, ...S.availWarn }}>{free} dispo</span>;
    return <span style={{ ...S.badge, ...S.availOk }}>{free} dispo</span>;
  }

  const grouped          = items.reduce((acc, item) => { const cat = item.category || ''; if (!acc[cat]) acc[cat] = []; acc[cat].push(item); return acc; }, {});
  const totalItems       = items.length;
  const totalEpuise      = items.filter(i => getItemFree(i) <= 0).length;
  const totalEnCours     = allAssignments.length;
  const totalCategories  = categories.length;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <h1 style={S.title}>Art de la Table — Location</h1>
      <p style={S.subtitle}>Inventaire des articles cérémoniaux · Évitez la double réservation entre deux mariages</p>

      <div style={S.statGrid}>
        <div style={S.statBox}><div style={S.statNum}>{totalItems}</div><div style={S.statLabel}>Articles catalogue</div></div>
        <div style={S.statBox}><div style={{ ...S.statNum, color: '#e67e22' }}>{totalEnCours}</div><div style={S.statLabel}>En cours de location</div></div>
        <div style={S.statBox}><div style={{ ...S.statNum, color: '#c0392b' }}>{totalEpuise}</div><div style={S.statLabel}>Articles épuisés</div></div>
        <div style={S.statBox}><div style={{ ...S.statNum, color: '#6b21a8' }}>{totalCategories}</div><div style={S.statLabel}>Catégories</div></div>
      </div>

      <div style={S.tabs}>
        <button style={{ ...S.tab, ...(tab === 'catalog'  ? S.tabActive : {}) }} onClick={() => setTab('catalog')}>Catalogue</button>
        <button style={{ ...S.tab, ...(tab === 'event'    ? S.tabActive : {}) }} onClick={() => setTab('event')}>Par événement</button>
        <button style={{ ...S.tab, ...(tab === 'overview' ? S.tabActive : {}) }} onClick={() => setTab('overview')}>Vue d'ensemble</button>
      </div>

      {/* ── CATALOG TAB ── */}
      {tab === 'catalog' && (
        <>
          <div style={S.topBar}>
            <span style={{ fontSize: 13, color: '#888' }}>{totalItems} articles · {totalCategories} catégories</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {canCreate && (
                <button style={S.btnGhost} onClick={() => setShowCatManager(true)}>
                  ⚙ Gérer catégories
                </button>
              )}
              {canCreate && <button style={S.btn} onClick={() => openItemModal()}>+ Nouvel article</button>}
            </div>
          </div>
          {loading ? <p style={{ color: '#888' }}>Chargement...</p> : items.length === 0 ? (
            <div style={S.emptyState}><div style={{ fontSize: 32, marginBottom: 8 }}>🫖</div><p style={{ fontWeight: 500, marginBottom: 4 }}>Aucun article dans le catalogue</p><p>Cliquez sur "+ Nouvel article" pour commencer</p></div>
          ) : Object.entries(grouped).map(([catId, catItems]) => {
            const cs = getCatStyle(catId);
            return (
              <div key={catId} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: cs.color, background: cs.bg, border: `1px solid ${cs.border}`, borderRadius: 6, padding: '4px 12px', display: 'inline-block', marginBottom: 10 }}>
                  {getCatLabel(catId)}
                </div>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Article</th><th style={S.th}>Qté totale</th><th style={S.th}>En location</th><th style={S.th}>Disponible</th><th style={S.th}></th></tr></thead>
                  <tbody>
                    {catItems.map(item => {
                      const used = getItemUsed(item.id);
                      return (
                        <tr key={item.id}>
                          <td style={S.td}><div style={{ fontWeight: 500 }}>{item.name}</div>{item.name_ar && <div style={{ fontSize: 11, color: '#888', direction: 'rtl' }}>{item.name_ar}</div>}{item.notes && <div style={{ fontSize: 11, color: '#aaa' }}>{item.notes}</div>}</td>
                          <td style={S.td}>{item.total_quantity} {item.unit}</td>
                          <td style={{ ...S.td, color: used > 0 ? '#e67e22' : '#aaa', fontWeight: used > 0 ? 600 : 400 }}>{used > 0 ? used : '—'}</td>
                          <td style={S.td}>{getAvailBadge(item)}</td>
                          <td style={S.td}><div style={{ display: 'flex', gap: 6 }}>{canCreate && <button style={S.btnGhost} onClick={() => openItemModal(item)}>✏️</button>}{canDelete && <button style={S.btnDanger} onClick={() => deleteItem(item.id)}>✕</button>}</div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </>
      )}

      {/* ── EVENT TAB ── */}
      {tab === 'event' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <select style={S.eventSel} value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
              <option value="">-- Choisir un événement --</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name || ev.client_name} — {ev.event_date ? new Date(ev.event_date).toLocaleDateString('fr-MA') : ''}</option>)}
            </select>
            {canCreate && selectedEvent && <button style={S.btn} onClick={openAssignModal}>+ Ajouter un article</button>}
          </div>
          {!selectedEvent ? <div style={S.emptyState}><div style={{ fontSize: 28, marginBottom: 8 }}>📋</div><p>Sélectionnez un événement pour gérer sa liste d'articles</p></div>
          : assignments.length === 0 ? <div style={S.emptyState}><div style={{ fontSize: 28, marginBottom: 8 }}>🫖</div><p style={{ fontWeight: 500, marginBottom: 4 }}>Aucun article assigné</p><p>Cliquez sur "+ Ajouter un article"</p></div>
          : <>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Article</th><th style={S.th}>Catégorie</th><th style={S.th}>Quantité</th><th style={S.th}>Date sortie</th><th style={S.th}>Date retour</th><th style={S.th}>Statut</th><th style={S.th}></th></tr></thead>
              <tbody>
                {assignments.map(a => {
                  const cs = getCatStyle(a.rental_items?.category);
                  return (
                    <tr key={a.id} style={{ opacity: a.returned ? 0.5 : 1 }}>
                      <td style={S.td}><div style={{ fontWeight: 500 }}>{a.rental_items?.name}</div>{a.notes && <div style={{ fontSize: 11, color: '#aaa' }}>{a.notes}</div>}</td>
                      <td style={S.td}><span style={{ ...S.badge, background: cs.bg, color: cs.color }}>{getCatLabel(a.rental_items?.category)}</span></td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{a.quantity} {a.rental_items?.unit}</td>
                      <td style={{ ...S.td, fontSize: 12 }}>{a.date_out ? new Date(a.date_out).toLocaleDateString('fr-MA') : '—'}</td>
                      <td style={{ ...S.td, fontSize: 12 }}>{a.date_return ? new Date(a.date_return).toLocaleDateString('fr-MA') : '—'}</td>
                      <td style={S.td}><button onClick={() => toggleReturned(a.id, a.returned)} style={{ ...S.badge, cursor: 'pointer', border: 'none', ...(a.returned ? S.availOk : S.availWarn) }}>{a.returned ? '✓ Retourné' : '⏳ En cours'}</button></td>
                      <td style={S.td}>{canDelete && <button style={S.btnDanger} onClick={() => deleteAssignment(a.id)}>✕</button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', padding: '12px 0', fontSize: 13, color: '#888' }}>{assignments.filter(a => !a.returned).length} en cours · {assignments.filter(a => a.returned).length} retourné(s)</div>
          </>}
        </>
      )}

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>Articles en location (non retournés) — détection des conflits entre mariages</p>
          {allAssignments.length === 0 ? <div style={S.emptyState}><div style={{ fontSize: 28, marginBottom: 8 }}>✅</div><p>Aucun article en location actuellement</p></div>
          : <table style={S.table}>
            <thead><tr><th style={S.th}>Article</th><th style={S.th}>Événement</th><th style={S.th}>Date</th><th style={S.th}>Quantité</th><th style={S.th}>Stock</th></tr></thead>
            <tbody>
              {allAssignments.map(a => {
                const item = items.find(i => i.id === a.item_id);
                const used = getItemUsed(a.item_id);
                const over = item && used > item.total_quantity;
                return (
                  <tr key={a.id} style={{ background: over ? '#fff5f5' : 'transparent' }}>
                    <td style={S.td}><div style={{ fontWeight: 500 }}>{a.rental_items?.name}</div></td>
                    <td style={{ ...S.td, fontSize: 12 }}>{a.events?.name || a.events?.client_name || '—'}</td>
                    <td style={{ ...S.td, fontSize: 12 }}>{a.events?.event_date ? new Date(a.events.event_date).toLocaleDateString('fr-MA') : '—'}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{a.quantity}</td>
                    <td style={S.td}>{item ? (over ? <span style={{ ...S.badge, ...S.availFull }}>⚠ Conflit ({used}/{item.total_quantity})</span> : <span style={{ ...S.badge, ...S.availOk }}>{item.total_quantity - used} restant(s)</span>) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>}
        </>
      )}

      {/* ── ITEM MODAL ── */}
      {showItemModal && (
        <div style={S.overlay} onClick={() => setShowItemModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <p style={S.modalTitle}>{editingItem ? "Modifier l'article" : 'Nouvel article'}</p>
            <div style={S.formRow}><label style={S.label}>Nom (français) *</label><input style={S.input} value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: B'rad (théière)" /></div>
            <div style={S.formRow}><label style={S.label}>Nom en arabe</label><input style={{ ...S.input, direction: 'rtl', textAlign: 'right' }} value={itemForm.name_ar} onChange={e => setItemForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="براد" /></div>
            <div style={S.row2}>
              <div style={S.formRow}>
                <label style={S.label}>Catégorie</label>
                <select style={S.select} value={itemForm.category}
                  onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))}>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div style={S.formRow}><label style={S.label}>Unité</label><input style={S.input} value={itemForm.unit} onChange={e => setItemForm(f => ({ ...f, unit: e.target.value }))} placeholder="pièce, set, lot..." /></div>
            </div>
            <div style={S.formRow}><label style={S.label}>Quantité totale en stock *</label><input style={S.input} type="number" min="1" value={itemForm.total_quantity} onChange={e => setItemForm(f => ({ ...f, total_quantity: e.target.value }))} /></div>
            <div style={S.formRow}><label style={S.label}>Notes</label><input style={S.input} value={itemForm.notes} onChange={e => setItemForm(f => ({ ...f, notes: e.target.value }))} placeholder="ex: Doré, grande taille..." /></div>
            <div style={S.modalFoot}><button style={S.btnGhost} onClick={() => setShowItemModal(false)}>Annuler</button><button style={S.btn} onClick={saveItem} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button></div>
          </div>
        </div>
      )}

      {/* ── ASSIGN MODAL ── */}
      {showAssignModal && (
        <div style={S.overlay} onClick={() => setShowAssignModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <p style={S.modalTitle}>Ajouter un article à l'événement</p>
            <div style={S.formRow}><label style={S.label}>Article *</label>
              <select style={S.select} value={assignForm.item_id} onChange={e => setAssignForm(f => ({ ...f, item_id: e.target.value }))}>
                <option value="">-- Choisir un article --</option>
                {Object.entries(grouped).map(([catId, catItems]) => (
                  <optgroup key={catId} label={getCatLabel(catId)}>
                    {catItems.map(item => { const free = getItemFree(item); return <option key={item.id} value={item.id}>{item.name} — {free > 0 ? `${free} dispo` : '⚠ Épuisé'}</option>; })}
                  </optgroup>
                ))}
              </select>
            </div>
            {availability !== null && (
              availability.free <= 0
                ? <div style={S.dangerBox}>⚠ Stock épuisé — tous les {availability.total} articles sont déjà réservés ce jour-là ({availability.conflicts} autre(s) événement(s)).</div>
                : availability.free < availability.total
                  ? <div style={S.warnBox}>⚠ Stock partiel — {availability.free} dispo sur {availability.total} ({availability.conflicts} autre(s) événement(s) ce jour).</div>
                  : <div style={S.infoBox}>✓ {availability.free} article(s) disponible(s) — aucun conflit ce jour.</div>
            )}
            <div style={S.formRow}><label style={S.label}>Quantité *</label><input style={S.input} type="number" min="1" value={assignForm.quantity} onChange={e => setAssignForm(f => ({ ...f, quantity: e.target.value }))} /></div>
            <div style={S.row2}>
              <div style={S.formRow}><label style={S.label}>Date de sortie</label><input style={S.input} type="date" value={assignForm.date_out} onChange={e => setAssignForm(f => ({ ...f, date_out: e.target.value }))} /></div>
              <div style={S.formRow}><label style={S.label}>Date de retour prévue</label><input style={S.input} type="date" value={assignForm.date_return} onChange={e => setAssignForm(f => ({ ...f, date_return: e.target.value }))} /></div>
            </div>
            <div style={S.formRow}><label style={S.label}>Notes</label><input style={S.input} value={assignForm.notes} onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))} placeholder="ex: Vérifier état avant sortie" /></div>
            <div style={S.modalFoot}><button style={S.btnGhost} onClick={() => setShowAssignModal(false)}>Annuler</button><button style={S.btn} onClick={saveAssignment} disabled={saving}>{saving ? 'Enregistrement...' : 'Confirmer'}</button></div>
          </div>
        </div>
      )}

      {showCatManager && (
        <CategoryManager
          module="rental"
          onClose={() => setShowCatManager(false)}
          onUpdate={() => { loadCategories(); loadAll(); }}
        />
      )}

      {/* ── CATEGORY MODAL ── */}
      {showCatModal && (
        <div style={S.overlay} onClick={() => { setShowCatModal(false); setEditingCat(null); }}>
          <div style={{ ...S.modal, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <p style={S.modalTitle}>Gérer les catégories</p>

            {/* Existing categories */}
            {categories.length === 0 ? (
              <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Aucune catégorie pour l'instant.</p>
            ) : (
              <div style={{ marginBottom: 20 }}>
                {categories.map(cat => {
                  const ps = getPreset(cat.color);
                  const isEditing = editingCat?.id === cat.id;
                  return (
                    <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
                      {/* Color swatch */}
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: ps.bg, border: `2px solid ${ps.border}`, flexShrink: 0 }} />

                      {isEditing ? (
                        <>
                          <input
                            style={{ ...S.input, flex: 1, minWidth: 100 }}
                            value={editingCat.name}
                            onChange={e => setEditingCat(f => ({ ...f, name: e.target.value }))}
                            placeholder="Nom (FR)"
                          />
                          <input
                            style={{ ...S.input, flex: 1, minWidth: 80, direction: 'rtl', textAlign: 'right' }}
                            value={editingCat.name_ar || ''}
                            onChange={e => setEditingCat(f => ({ ...f, name_ar: e.target.value }))}
                            placeholder="العربية"
                          />
                          {/* Mini color picker */}
                          <div style={{ display: 'flex', gap: 4 }}>
                            {PRESET_COLORS.map(pc => (
                              <button
                                key={pc.key}
                                onClick={() => setEditingCat(f => ({ ...f, color: pc.key }))}
                                title={pc.label}
                                style={{ width: 18, height: 18, borderRadius: 3, background: pc.bg, border: `2px solid ${editingCat.color === pc.key ? pc.color : pc.border}`, cursor: 'pointer', padding: 0 }}
                              />
                            ))}
                          </div>
                          <button style={S.btnSm} onClick={saveEditCat} disabled={saving}>✓</button>
                          <button style={S.btnGhost} onClick={() => setEditingCat(null)}>✕</button>
                        </>
                      ) : (
                        <>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{cat.name}</span>
                          {cat.name_ar && <span style={{ fontSize: 12, color: '#888', direction: 'rtl' }}>{cat.name_ar}</span>}
                          {canCreate && <button style={S.btnGhost} onClick={() => setEditingCat({ ...cat })}>✏️</button>}
                          {canDelete && <button style={S.btnDanger} onClick={() => deleteCat(cat.id)}>✕</button>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add new category */}
            {canCreate && (
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 12 }}>Nouvelle catégorie</p>
                <div style={S.row2}>
                  <div style={S.formRow}>
                    <label style={S.label}>Nom (français) *</label>
                    <input style={S.input} value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Décoration" />
                  </div>
                  <div style={S.formRow}>
                    <label style={S.label}>Nom en arabe</label>
                    <input style={{ ...S.input, direction: 'rtl', textAlign: 'right' }} value={catForm.name_ar} onChange={e => setCatForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="زخرفة" />
                  </div>
                </div>
                <div style={S.formRow}>
                  <label style={S.label}>Couleur</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PRESET_COLORS.map(pc => (
                      <button
                        key={pc.key}
                        onClick={() => setCatForm(f => ({ ...f, color: pc.key }))}
                        title={pc.label}
                        style={{
                          width: 32, height: 32, borderRadius: 6,
                          background: pc.bg,
                          border: `2px solid ${catForm.color === pc.key ? pc.color : pc.border}`,
                          cursor: 'pointer',
                          outline: catForm.color === pc.key ? `2px solid ${pc.color}` : 'none',
                          outlineOffset: 2,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <button style={S.btn} onClick={saveCat} disabled={saving || !catForm.name.trim()}>
                  {saving ? 'Enregistrement...' : '+ Ajouter la catégorie'}
                </button>
              </div>
            )}

            <div style={S.modalFoot}>
              <button style={S.btnGhost} onClick={() => { setShowCatModal(false); setEditingCat(null); }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
