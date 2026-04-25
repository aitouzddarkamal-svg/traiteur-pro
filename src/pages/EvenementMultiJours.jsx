import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { canDo } from '../lib/permissions';
import DateInput from '../components/DateInput';

// ─── Day templates ────────────────────────────────────────
const DAY_TEMPLATES = [
  { day_number: 1, day_name: 'Henna',  day_name_ar: 'الحناء',  day_date: null, guest_count: 0, tables_count: 0, margin_percent: 10, status: 'draft', notes: '' },
  { day_number: 2, day_name: 'Nikah',  day_name_ar: 'النكاح',  day_date: null, guest_count: 0, tables_count: 0, margin_percent: 10, status: 'draft', notes: '' },
  { day_number: 3, day_name: 'Walima', day_name_ar: 'الوليمة', day_date: null, guest_count: 0, tables_count: 0, margin_percent: 10, status: 'draft', notes: '' },
];

const STATUS_LABELS = { draft: 'Brouillon', confirmed: 'Confirmé', done: 'Terminé' };
const STATUS_COLORS = { draft: '#f0a500', confirmed: '#2d6a4f', done: '#888' };

const DAY_COLORS = {
  1: { bg: '#fdf4ff', border: '#e0b8f0', text: '#6b21a8', accent: '#a855f7' },
  2: { bg: '#f0fdf4', border: '#86efac', text: '#14532d', accent: '#22c55e' },
  3: { bg: '#fff7ed', border: '#fdba74', text: '#7c2d12', accent: '#f97316' },
};

const fmt = (n) => Number(n || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Styles ───────────────────────────────────────────────
const S = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '0 0 60px' },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer', padding: '4px 0', marginBottom: 16 },
  eventHeader: { background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  eventName: { fontSize: 20, fontWeight: 600, color: '#1a1a1a', margin: 0 },
  eventMeta: { fontSize: 13, color: '#777', marginTop: 4 },
  badge: { fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500 },
  dayTabs: { display: 'flex', gap: 0, marginBottom: 0, borderBottom: '2px solid #f0f0f0' },
  dayTab: (active, color) => ({
    padding: '12px 24px',
    border: 'none',
    borderBottom: active ? `3px solid ${color.accent}` : '3px solid transparent',
    background: active ? color.bg : 'transparent',
    color: active ? color.text : '#888',
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.15s',
    borderRadius: '8px 8px 0 0',
    marginBottom: -2,
  }),
  dayTabInner: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  dayTabName: { fontSize: 14 },
  dayTabAr: { fontSize: 11, opacity: 0.7 },
  addDayBtn: { padding: '10px 16px', border: '2px dashed #ddd', borderRadius: '8px 8px 0 0', background: 'transparent', color: '#aaa', cursor: 'pointer', fontSize: 18, marginLeft: 4 },
  dayPanel: (color) => ({ background: color.bg, border: `1px solid ${color.border}`, borderTop: 'none', borderRadius: '0 0 16px 16px', padding: 24, marginBottom: 24 }),
  dayInfoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 },
  infoCard: { background: '#fff', borderRadius: 10, padding: '12px 16px', border: '1px solid #e8e8e8' },
  infoLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 },
  infoInput: { width: '100%', border: 'none', outline: 'none', fontSize: 18, fontWeight: 600, color: '#1a1a1a', background: 'transparent', padding: 0 },
  infoInputSmall: { width: '100%', border: 'none', outline: 'none', fontSize: 14, color: '#1a1a1a', background: 'transparent', padding: 0 },
  subTabs: { display: 'flex', gap: 4, marginBottom: 16 },
  subTab: (active) => ({ padding: '6px 14px', borderRadius: 8, border: `1px solid ${active ? '#2d6a4f' : '#ddd'}`, background: active ? '#2d6a4f' : 'transparent', color: active ? '#fff' : '#555', fontSize: 12, fontWeight: active ? 500 : 400, cursor: 'pointer' }),
  sectionTitle: { fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 },
  btn: { background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 500 },
  btnSm: { background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' },
  btnGhost: { background: 'transparent', color: '#555', border: '1px solid #ddd', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' },
  btnDanger: { background: 'transparent', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  dishRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' },
  dishName: { flex: 1, fontSize: 13, fontWeight: 500 },
  dishMeta: { fontSize: 11, color: '#888' },
  dishQtyWrap: { display: 'flex', alignItems: 'center', gap: 6 },
  qtyBtn: { width: 26, height: 26, borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qtyVal: { fontSize: 14, fontWeight: 600, minWidth: 24, textAlign: 'center' },
  dishTotal: { minWidth: 100, textAlign: 'right', fontSize: 13, fontWeight: 500, color: '#2d6a4f' },
  emptyState: { textAlign: 'center', padding: '32px 20px', color: '#888', fontSize: 13 },
  selectDish: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: '#fff' },
  summaryBox: { background: '#fff', border: '1px solid #e8e8e8', borderRadius: 16, padding: '20px 24px', marginTop: 8 },
  summaryTitle: { fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 16 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 },
  summaryTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 0', marginTop: 4, fontSize: 15, fontWeight: 600 },
  totalHighlight: { color: '#2d6a4f', fontSize: 18 },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 460 },
  modalTitle: { fontSize: 16, fontWeight: 600, marginBottom: 20 },
  formRow: { marginBottom: 14 },
  label: { fontSize: 12, color: '#555', marginBottom: 4, display: 'block' },
  input: { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
  courseItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff', borderRadius: 8, marginBottom: 6, border: '1px solid #f0f0f0' },
  courseQty: { fontSize: 13, fontWeight: 600, color: '#2d6a4f' },
  saveBar: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1a1a1a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px', zIndex: 100 },
};

export default function EvenementMultiJours() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const canEdit = canDo(profile?.role, 'canEdit');
  const canCreate = canDo(profile?.role, 'canCreate');
  const canDelete = canDo(profile?.role, 'canDelete');

  const [event, setEvent] = useState(null);
  const [days, setDays] = useState([]);
  const [activeDayNum, setActiveDayNum] = useState(1);
  const [activeSubTab, setActiveSubTab] = useState('menu');
  const [availableDishes, setAvailableDishes] = useState([]);
  const [dayDishes, setDayDishes] = useState({});
  const [dayIngredients, setDayIngredients] = useState({});
  const [showAddDish, setShowAddDish] = useState(false);
  const [selectedDishId, setSelectedDishId] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirtyDays, setDirtyDays] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, [eventId]);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadEvent(), loadDishes()]);
    setLoading(false);
  }

  async function loadEvent() {
    const { data: ev } = await supabase.from('events').select('*').eq('id', eventId).single();
    setEvent(ev);
    if (!ev) return;

    const { data: daysData } = await supabase
      .from('event_days').select('*')
      .eq('event_id', eventId).order('day_number');

    let resolvedDays = daysData || [];

    if (resolvedDays.length === 0) {
      const toInsert = DAY_TEMPLATES.map(d => ({ ...d, business_id: profile.business_id, event_id: eventId }));
      const { data: inserted } = await supabase.from('event_days').insert(toInsert).select();
      resolvedDays = inserted || [];
      await supabase.from('events').update({ is_multi_day: true }).eq('id', eventId);
    }

    setDays(resolvedDays);

    const dishMap = {};
    const ingMap = {};
    for (const day of resolvedDays) {
      const { data: dishes } = await supabase
        .from('event_day_dishes').select('*')
        .eq('event_day_id', day.id).order('created_at');
      dishMap[day.id] = dishes || [];

      if (dishes && dishes.length > 0) {
        const dIds = dishes.filter(d => d.dish_id).map(d => d.dish_id);
        if (dIds.length > 0) {
          const { data: ings } = await supabase
            .from('dish_ingredients')
            .select('dish_id, quantity, unit, ingredients(name, price_per_unit)')
            .in('dish_id', dIds);
          ingMap[day.id] = ings || [];
        }
      }
    }
    setDayDishes(dishMap);
    setDayIngredients(ingMap);
  }

  async function loadDishes() {
    const { data } = await supabase.from('dishes')
      .select('id, name, name_ar, portions_per_unit, price_per_unit')
      .eq('business_id', profile.business_id).eq('is_active', true).order('name');
    setAvailableDishes(data || []);
  }

  const activeDay = days.find(d => d.day_number === activeDayNum);
  const color = DAY_COLORS[activeDayNum] || DAY_COLORS[1];

  function updateDayField(dayId, field, value) {
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, [field]: value } : d));
    setDirtyDays(prev => ({ ...prev, [dayId]: true }));
  }

  async function saveDay(day) {
    setSaving(true);
    await supabase.from('event_days').update({
      day_date: day.day_date || null,
      guest_count: parseInt(day.guest_count) || 0,
      tables_count: parseInt(day.tables_count) || 0,
      margin_percent: parseFloat(day.margin_percent) || 10,
      status: day.status,
      notes: day.notes || '',
    }).eq('id', day.id);
    setDirtyDays(prev => { const n = { ...prev }; delete n[day.id]; return n; });
    setSaving(false);
  }

  async function addDishToDay() {
    if (!selectedDishId || !activeDay) return;
    const dish = availableDishes.find(d => d.id === selectedDishId);
    if (!dish) return;
    setSaving(true);
    const { data } = await supabase.from('event_day_dishes').insert({
      business_id: profile.business_id,
      event_day_id: activeDay.id,
      event_id: eventId,
      dish_id: dish.id,
      dish_name: dish.name,
      dish_name_ar: dish.name_ar || '',
      portions_per_unit: dish.portions_per_unit || 10,
      price_per_unit: dish.price_per_unit || 0,
      quantity_units: Math.ceil((activeDay.tables_count || 1)),
    }).select().single();
    if (data) {
      setDayDishes(prev => ({ ...prev, [activeDay.id]: [...(prev[activeDay.id] || []), data] }));
    }
    setSelectedDishId('');
    setShowAddDish(false);
    setSaving(false);
  }

  async function updateDishQty(dayId, dishId, delta) {
    const dish = (dayDishes[dayId] || []).find(d => d.id === dishId);
    if (!dish) return;
    const newQty = Math.max(1, (dish.quantity_units || 1) + delta);
    await supabase.from('event_day_dishes').update({ quantity_units: newQty }).eq('id', dishId);
    setDayDishes(prev => ({
      ...prev,
      [dayId]: prev[dayId].map(d => d.id === dishId ? { ...d, quantity_units: newQty } : d)
    }));
  }

  async function removeDish(dayId, dishId) {
    if (!window.confirm('Retirer ce plat du menu ?')) return;
    await supabase.from('event_day_dishes').delete().eq('id', dishId);
    setDayDishes(prev => ({ ...prev, [dayId]: prev[dayId].filter(d => d.id !== dishId) }));
  }

  async function addCustomDay() {
    const next = (days[days.length - 1]?.day_number || 0) + 1;
    const name = prompt('Nom de la journée (ex: Lendemain, Ftour...):');
    if (!name) return;
    const nameAr = prompt('Nom en arabe (facultatif):') || '';
    const { data } = await supabase.from('event_days').insert({
      business_id: profile.business_id, event_id: eventId,
      day_number: next, day_name: name, day_name_ar: nameAr,
      guest_count: 0, tables_count: 0, margin_percent: 10
    }).select().single();
    if (data) { setDays(prev => [...prev, data]); setActiveDayNum(next); }
  }

  // ── Shopping list calculation from dish ingredients ──
  function getShoppingList(dayId) {
    const dishes = dayDishes[dayId] || [];
    const ings = dayIngredients[dayId] || [];
    const map = {};
    dishes.forEach(d => {
      if (!d.dish_id) return;
      const dishIngs = ings.filter(i => i.dish_id === d.dish_id);
      const multiplier = d.quantity_units * d.portions_per_unit;
      dishIngs.forEach(i => {
        const key = i.ingredients?.name || 'Inconnu';
        if (!map[key]) map[key] = { name: key, quantity: 0, unit: i.unit, cost: 0 };
        map[key].quantity += (i.quantity || 0) * multiplier;
        map[key].cost += (i.quantity || 0) * multiplier * (i.ingredients?.price_per_unit || 0);
      });
    });
    return Object.values(map);
  }

  // ── Cost calculation per day ──
  function getDayCost(dayId) {
    return (dayDishes[dayId] || []).reduce((s, d) => s + (d.price_per_unit || 0) * (d.quantity_units || 1), 0);
  }

  function getTotalGuests() { return days.reduce((s, d) => s + (d.guest_count || 0), 0); }
  function getTotalCost() { return days.reduce((s, d) => s + getDayCost(d.id), 0); }
  function getTotalDishes() { return Object.values(dayDishes).reduce((s, arr) => s + arr.length, 0); }

  const hasDirty = Object.keys(dirtyDays).length > 0;

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Chargement...</div>;
  if (!event) return <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Événement introuvable</div>;

  const shopping = activeDay ? getShoppingList(activeDay.id) : [];
  const activeDishes = activeDay ? (dayDishes[activeDay.id] || []) : [];
  const activeDayCost = activeDay ? getDayCost(activeDay.id) : 0;

  return (
    <div style={S.page}>
      {/* Back */}
      <button style={S.backBtn} onClick={() => navigate('/evenements')}>
        ← Retour aux événements
      </button>

      {/* Event header */}
      <div style={S.eventHeader}>
        <div>
          <p style={S.eventName}>{event.name || event.client_name}</p>
          <p style={S.eventMeta}>
            {event.client_name && event.name ? `${event.client_name} · ` : ''}
            {event.guest_count} invités · {event.tables_count} tables
            {event.location ? ` · ${event.location}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#2d6a4f' }}>{getTotalGuests()}</div>
            <div style={{ fontSize: 11, color: '#888' }}>invités cumulés</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#2d6a4f' }}>{fmt(getTotalCost())} MAD</div>
            <div style={{ fontSize: 11, color: '#888' }}>total 3 jours</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#2d6a4f' }}>{getTotalDishes()}</div>
            <div style={{ fontSize: 11, color: '#888' }}>plats planifiés</div>
          </div>
        </div>
      </div>

      {/* Day tabs */}
      <div style={S.dayTabs}>
        {days.map(day => {
          const c = DAY_COLORS[day.day_number] || DAY_COLORS[1];
          const isActive = day.day_number === activeDayNum;
          const dishes = dayDishes[day.id] || [];
          return (
            <button key={day.id} style={S.dayTab(isActive, c)} onClick={() => setActiveDayNum(day.day_number)}>
              <div style={S.dayTabInner}>
                <span style={S.dayTabName}>{day.day_name}</span>
                <span style={S.dayTabAr}>{day.day_name_ar}</span>
                {day.day_date && <span style={{ fontSize: 10, opacity: 0.6 }}>{new Date(day.day_date + 'T12:00:00').toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' })}</span>}
                <span style={{ fontSize: 10, background: c.border, color: c.text, borderRadius: 10, padding: '1px 6px', marginTop: 2 }}>{day.guest_count} inv · {dishes.length} plats</span>
              </div>
            </button>
          );
        })}
        {canCreate && days.length < 5 && (
          <button style={S.addDayBtn} onClick={addCustomDay} title="Ajouter un jour">+</button>
        )}
      </div>

      {/* Active day panel */}
      {activeDay && (
        <div style={S.dayPanel(color)}>
          {/* Day info fields */}
          <div style={S.dayInfoGrid}>
            <div style={S.infoCard}>
              <div style={S.infoLabel}>Date</div>
              <DateInput
                style={S.infoInputSmall}
                value={activeDay.day_date || ''}
                onChange={e => updateDayField(activeDay.id, 'day_date', e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div style={S.infoCard}>
              <div style={S.infoLabel}>Invités</div>
              <input style={S.infoInput} type="number" min="0"
                value={activeDay.guest_count || 0}
                onChange={e => updateDayField(activeDay.id, 'guest_count', e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div style={S.infoCard}>
              <div style={S.infoLabel}>Tables</div>
              <input style={S.infoInput} type="number" min="0"
                value={activeDay.tables_count || 0}
                onChange={e => updateDayField(activeDay.id, 'tables_count', e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div style={S.infoCard}>
              <div style={S.infoLabel}>Marge %</div>
              <input style={S.infoInput} type="number" min="0" max="100" step="0.5"
                value={activeDay.margin_percent || 10}
                onChange={e => updateDayField(activeDay.id, 'margin_percent', e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div style={S.infoCard}>
              <div style={S.infoLabel}>Statut</div>
              <select style={{ ...S.infoInputSmall, cursor: 'pointer' }}
                value={activeDay.status || 'draft'}
                onChange={e => updateDayField(activeDay.id, 'status', e.target.value)}
                disabled={!canEdit}
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div style={S.infoCard}>
              <div style={S.infoLabel}>Coût estimé</div>
              <div style={{ ...S.infoInput, color: '#2d6a4f', fontWeight: 700 }}>{fmt(activeDayCost)} MAD</div>
            </div>
          </div>

          {dirtyDays[activeDay.id] && canEdit && (
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button style={S.btn} onClick={() => saveDay(activeDay)} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          )}

          {/* Sub tabs */}
          <div style={S.subTabs}>
            {['menu', 'courses', 'notes'].map(t => (
              <button key={t} style={S.subTab(activeSubTab === t)} onClick={() => setActiveSubTab(t)}>
                {t === 'menu' ? `Menu (${activeDishes.length})` : t === 'courses' ? `Liste de courses (${shopping.length})` : 'Notes'}
              </button>
            ))}
          </div>

          {/* Menu tab */}
          {activeSubTab === 'menu' && (
            <div>
              {activeDishes.length === 0 ? (
                <div style={S.emptyState}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🍽️</div>
                  <p style={{ margin: '0 0 4px', fontWeight: 500 }}>Aucun plat pour {activeDay.day_name}</p>
                  <p style={{ margin: 0 }}>Ajoutez les plats du menu de ce jour</p>
                </div>
              ) : (
                activeDishes.map(d => (
                  <div key={d.id} style={S.dishRow}>
                    <div style={{ flex: 1 }}>
                      <div style={S.dishName}>{d.dish_name}</div>
                      {d.dish_name_ar && <div style={{ ...S.dishMeta, direction: 'rtl', textAlign: 'right' }}>{d.dish_name_ar}</div>}
                      <div style={S.dishMeta}>{d.portions_per_unit} pers/unité · {fmt(d.price_per_unit)} MAD/unité</div>
                    </div>
                    <div style={S.dishQtyWrap}>
                      {canEdit && <button style={S.qtyBtn} onClick={() => updateDishQty(activeDay.id, d.id, -1)}>−</button>}
                      <span style={S.qtyVal}>{d.quantity_units}</span>
                      {canEdit && <button style={S.qtyBtn} onClick={() => updateDishQty(activeDay.id, d.id, 1)}>+</button>}
                      <span style={{ fontSize: 11, color: '#888', marginLeft: 2 }}>unités</span>
                    </div>
                    <div style={S.dishTotal}>{fmt((d.price_per_unit || 0) * (d.quantity_units || 1))} MAD</div>
                    {canDelete && <button style={S.btnDanger} onClick={() => removeDish(activeDay.id, d.id)}>✕</button>}
                  </div>
                ))
              )}

              {activeDishes.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 0', borderTop: '2px solid rgba(0,0,0,0.08)', marginTop: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#2d6a4f' }}>
                    Sous-total {activeDay.day_name} : {fmt(activeDayCost)} MAD
                  </span>
                </div>
              )}

              {canCreate && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select style={{ ...S.selectDish, flex: 1 }} value={selectedDishId} onChange={e => setSelectedDishId(e.target.value)}>
                    <option value="">-- Choisir un plat à ajouter --</option>
                    {availableDishes.map(d => <option key={d.id} value={d.id}>{d.name} {d.name_ar ? `(${d.name_ar})` : ''} — {fmt(d.price_per_unit)} MAD/unité</option>)}
                  </select>
                  <button style={{ ...S.btn, whiteSpace: 'nowrap' }} onClick={addDishToDay} disabled={!selectedDishId || saving}>+ Ajouter</button>
                </div>
              )}
            </div>
          )}

          {/* Shopping list tab */}
          {activeSubTab === 'courses' && (
            <div>
              {shopping.length === 0 ? (
                <div style={S.emptyState}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🛒</div>
                  <p style={{ margin: 0 }}>Ajoutez des plats avec des recettes pour générer la liste automatiquement</p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                    Calculée automatiquement depuis les recettes · {activeDay.guest_count} invités · {activeDay.tables_count} tables
                  </p>
                  {shopping.map((item, i) => (
                    <div key={i} style={S.courseItem}>
                      <span style={{ fontSize: 13 }}>{item.name}</span>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={S.courseQty}>{Number(item.quantity).toFixed(2)} {item.unit}</span>
                        <span style={{ fontSize: 11, color: '#888' }}>{fmt(item.cost)} MAD</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: '2px solid #e8e8e8', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 14 }}>
                    <span>Coût matières — {activeDay.day_name}</span>
                    <span style={{ color: '#2d6a4f' }}>{fmt(shopping.reduce((s, i) => s + i.cost, 0))} MAD</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notes tab */}
          {activeSubTab === 'notes' && (
            <div>
              <label style={S.label}>Notes pour {activeDay.day_name}</label>
              <textarea
                style={{ ...S.input, minHeight: 120, resize: 'vertical', fontFamily: 'inherit' }}
                value={activeDay.notes || ''}
                onChange={e => updateDayField(activeDay.id, 'notes', e.target.value)}
                placeholder={`Notes spécifiques pour le ${activeDay.day_name}...\nEx: Invités VIP, restrictions alimentaires, timing des plats...`}
                disabled={!canEdit}
              />
              {dirtyDays[activeDay.id] && canEdit && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button style={S.btn} onClick={() => saveDay(activeDay)}>Enregistrer</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary box - 3 jours */}
      <div style={S.summaryBox}>
        <p style={S.summaryTitle}>Récapitulatif — {days.length} jours de célébration</p>
        {days.map(day => {
          const c = DAY_COLORS[day.day_number] || DAY_COLORS[1];
          const cost = getDayCost(day.id);
          const dishes = (dayDishes[day.id] || []);
          return (
            <div key={day.id} style={S.summaryRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ ...S.badge, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                  {day.day_name} · {day.day_name_ar}
                </span>
                <span style={{ color: '#888', fontSize: 12 }}>
                  {day.day_date ? new Date(day.day_date + 'T12:00:00').toLocaleDateString('fr-MA', { weekday: 'short', day: 'numeric', month: 'long' }) : 'Date non définie'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: 12 }}>{day.guest_count} inv · {dishes.length} plats</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: cost > 0 ? '#2d6a4f' : '#aaa' }}>
                  {cost > 0 ? fmt(cost) + ' MAD' : '—'}
                </span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: STATUS_COLORS[day.status || 'draft'] + '22', color: STATUS_COLORS[day.status || 'draft'] }}>
                  {STATUS_LABELS[day.status || 'draft']}
                </span>
              </div>
            </div>
          );
        })}
        <div style={S.summaryTotal}>
          <span>Total général mariage</span>
          <span style={S.totalHighlight}>{fmt(getTotalCost())} MAD · {getTotalGuests()} invités</span>
        </div>
      </div>

      {/* Save bar when dirty */}
      {hasDirty && canEdit && (
        <div style={S.saveBar}>
          <span style={{ fontSize: 13 }}>Modifications non enregistrées</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...S.btnGhost, color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => { setDirtyDays({}); loadAll(); }}>Annuler</button>
            <button style={{ ...S.btn, background: '#fff', color: '#1a1a1a' }}
              onClick={async () => { for (const day of days) { if (dirtyDays[day.id]) await saveDay(day); } }}>
              {saving ? 'Enregistrement...' : 'Tout enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
