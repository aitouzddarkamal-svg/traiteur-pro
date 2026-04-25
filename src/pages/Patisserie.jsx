import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { canDo } from '../lib/permissions';
import CategoryManager from '../components/CategoryManager';

const CATEGORY_LABELS = { friture: 'Friture', feuillete: 'Feuilleté', biscuit: 'Biscuit', gateau: 'Gâteau', autre: 'Autre' };
const CATEGORY_COLORS = {
  friture:   { bg: '#fff7ed', color: '#7c2d12', border: '#fdba74' },
  feuillete: { bg: '#fdf4ff', color: '#6b21a8', border: '#e0b8f0' },
  biscuit:   { bg: '#f0fdf4', color: '#14532d', border: '#86efac' },
  gateau:    { bg: '#eff6ff', color: '#1e3a8a', border: '#93c5fd' },
  autre:     { bg: '#f9f8f5', color: '#555',    border: '#ddd'    },
};
const S = {
  page:      { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
  title:     { fontSize: '1.5rem', fontWeight: '600', color: '#1a1a18', marginBottom: '4px' },
  subtitle:  { fontSize: '0.9rem', color: '#6b6b66', marginBottom: '2rem' },
  btn:       { background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer', fontWeight: 500 },
  btnGhost:  { background: 'transparent', color: '#555', border: '1px solid #ddd', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' },
  btnDanger: { background: 'transparent', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  tabs:      { display: 'flex', gap: 0, borderBottom: '2px solid #e5e4e0', marginBottom: '1.5rem' },
  tab:       { padding: '10px 20px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', color: '#6b6b66', border: 'none', background: 'none', borderBottom: '2px solid transparent', marginBottom: '-2px' },
  tabActive: { color: '#2d6a4f', borderBottom: '2px solid #2d6a4f', marginBottom: '-2px' },
  statGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 24 },
  statBox:   { background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '14px', textAlign: 'center' },
  statNum:   { fontSize: 22, fontWeight: 700, color: '#2d6a4f' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  table:     { width: '100%', borderCollapse: 'collapse' },
  th:        { fontSize: 11, fontWeight: 600, color: '#888', textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #f0f0f0', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td:        { fontSize: 13, padding: '10px 10px', borderBottom: '1px solid #f8f8f8', verticalAlign: 'middle' },
  badge:     { display: 'inline-block', fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 500 },
  topBar:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
  empty:     { textAlign: 'center', padding: '40px 20px', color: '#888', fontSize: 13 },
  overlay:   { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal:     { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' },
  modalTitle:{ fontSize: 16, fontWeight: 600, marginBottom: 20 },
  formRow:   { marginBottom: 14 },
  label:     { fontSize: 12, color: '#555', marginBottom: 4, display: 'block' },
  input:     { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none' },
  select:    { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: '#fff', outline: 'none' },
  row2:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
  greenBox:  { background: '#f0faf4', border: '1px solid #c3e6d4', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1a7a48', marginBottom: 14, fontWeight: 500 },
  eventSel:  { padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, minWidth: 260 },
};
const fmt = n => Number(n || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Patisserie() {
  const { profile } = useAuth();
  const canCreate = canDo(profile?.role, 'canCreate');
  const canDelete = canDo(profile?.role, 'canDelete');

  const [tab, setTab] = useState('recipes');
  const [recipes, setRecipes] = useState([]);
  const [events, setEvents] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventOrders, setEventOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeForm, setRecipeForm] = useState({ name: '', name_ar: '', category: 'biscuit', unit: 'pièce', batch_size: 50, selling_price: '', notes: '' });
  const [showIngModal, setShowIngModal] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [ingForm, setIngForm] = useState({ ingredient_name: '', quantity: '', unit: 'g', cost_per_unit: '' });
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [categories, setCategories] = useState([]);
  const [orderForm, setOrderForm] = useState({ recipe_id: '', quantity_batches: 1, is_external: false, external_cost: '', notes: '' });

  useEffect(() => { loadAll(); loadCategories(); }, []);
  useEffect(() => { if (selectedEvent) loadEventOrders(selectedEvent); else setEventOrders([]); }, [selectedEvent]);

  async function loadCategories() {
    const { data } = await supabase
      .from('item_categories')
      .select('*')
      .eq('business_id', profile.business_id)
      .eq('module', 'pastry')
      .eq('is_active', true)
      .order('sort_order');
    setCategories(data || []);
  }

  async function loadAll() {
    setLoading(true);
    const [recRes, evRes, ordRes] = await Promise.all([
      supabase.from('pastry_recipes').select('*').eq('business_id', profile.business_id).eq('is_active', true).order('category').order('name'),
      supabase.from('events').select('id, name, client_name, event_date').eq('business_id', profile.business_id).order('event_date', { ascending: false }).limit(60),
      supabase.from('event_pastry_orders').select('*').eq('business_id', profile.business_id).order('created_at', { ascending: false }),
    ]);
    setRecipes(recRes.data || []);
    setEvents(evRes.data || []);
    setOrders(ordRes.data || []);
    setLoading(false);
  }

  async function loadEventOrders(eventId) {
    const { data } = await supabase.from('event_pastry_orders').select('*, pastry_recipes(name, name_ar, category)').eq('event_id', eventId).eq('business_id', profile.business_id).order('created_at');
    setEventOrders(data || []);
  }

  async function loadIngredients(recipeId) {
    const { data } = await supabase.from('pastry_ingredients').select('*').eq('recipe_id', recipeId).order('created_at');
    setIngredients(data || []);
  }

  function openRecipeModal(recipe = null) {
    if (recipe) { setEditingRecipe(recipe); setRecipeForm({ name: recipe.name, name_ar: recipe.name_ar || '', category: recipe.category, unit: recipe.unit, batch_size: recipe.batch_size, selling_price: recipe.selling_price, notes: recipe.notes || '' }); }
    else { setEditingRecipe(null); setRecipeForm({ name: '', name_ar: '', category: 'biscuit', unit: 'pièce', batch_size: 50, selling_price: '', notes: '' }); }
    setShowRecipeModal(true);
  }

  async function saveRecipe() {
    if (!recipeForm.name) return;
    setSaving(true);
    const payload = { business_id: profile.business_id, name: recipeForm.name, name_ar: recipeForm.name_ar, category: recipeForm.category, unit: recipeForm.unit, batch_size: parseInt(recipeForm.batch_size) || 1, selling_price: parseFloat(recipeForm.selling_price) || 0, notes: recipeForm.notes };
    if (editingRecipe) await supabase.from('pastry_recipes').update(payload).eq('id', editingRecipe.id);
    else await supabase.from('pastry_recipes').insert(payload);
    setSaving(false); setShowRecipeModal(false); loadAll();
  }

  async function deleteRecipe(id) {
    if (!window.confirm('Supprimer cette recette ?')) return;
    await supabase.from('pastry_recipes').update({ is_active: false }).eq('id', id);
    loadAll();
  }

  async function openIngModal(recipe) {
    setActiveRecipe(recipe);
    await loadIngredients(recipe.id);
    setIngForm({ ingredient_name: '', quantity: '', unit: 'g', cost_per_unit: '' });
    setShowIngModal(true);
  }

  async function addIngredient() {
    if (!ingForm.ingredient_name || !ingForm.quantity) return;
    setSaving(true);
    await supabase.from('pastry_ingredients').insert({ business_id: profile.business_id, recipe_id: activeRecipe.id, ingredient_name: ingForm.ingredient_name, quantity: parseFloat(ingForm.quantity), unit: ingForm.unit, cost_per_unit: parseFloat(ingForm.cost_per_unit) || 0 });
    setIngForm({ ingredient_name: '', quantity: '', unit: 'g', cost_per_unit: '' });
    await loadIngredients(activeRecipe.id);
    setSaving(false);
  }

  async function deleteIngredient(id) {
    await supabase.from('pastry_ingredients').delete().eq('id', id);
    loadIngredients(activeRecipe.id);
  }

  function openOrderModal() {
    setOrderForm({ recipe_id: '', quantity_batches: 1, is_external: false, external_cost: '', notes: '' });
    setShowOrderModal(true);
  }

  async function saveOrder() {
    if (!orderForm.recipe_id || !selectedEvent) return;
    const recipe = recipes.find(r => r.id === orderForm.recipe_id);
    if (!recipe) return;
    setSaving(true);
    const batches = parseInt(orderForm.quantity_batches) || 1;
    const totalPieces = batches * recipe.batch_size;
    await supabase.from('event_pastry_orders').insert({ business_id: profile.business_id, event_id: selectedEvent, recipe_id: orderForm.recipe_id, recipe_name: recipe.name, quantity_batches: batches, batch_size: recipe.batch_size, total_pieces: totalPieces, unit_cost: recipe.selling_price, selling_price: recipe.selling_price, is_external: orderForm.is_external, external_cost: parseFloat(orderForm.external_cost) || 0, notes: orderForm.notes });
    setSaving(false); setShowOrderModal(false);
    loadEventOrders(selectedEvent); loadAll();
  }

  async function deleteOrder(id) {
    if (!window.confirm('Supprimer cette commande ?')) return;
    await supabase.from('event_pastry_orders').delete().eq('id', id);
    loadEventOrders(selectedEvent); loadAll();
  }

  const totalRecipes = recipes.length;
  const totalOrders = orders.length;
  const totalPieces = orders.reduce((s, o) => s + (o.total_pieces || 0), 0);
  const totalRevenue = orders.reduce((s, o) => s + ((o.total_pieces || 0) * (o.selling_price || 0)), 0);
  const grouped = recipes.reduce((acc, r) => { const cat = r.category || 'autre'; if (!acc[cat]) acc[cat] = []; acc[cat].push(r); return acc; }, {});
  const eventTotal = eventOrders.reduce((s, o) => s + ((o.total_pieces || 0) * (o.selling_price || 0)), 0);
  const eventExternal = eventOrders.filter(o => o.is_external).length;

  return (
    <div style={S.page}>
      <h1 style={S.title}>Pâtisserie Orientale</h1>
      <p style={S.subtitle}>Recettes, coûts et marges — Chebakia, Cornes de gazelle, Briouates et plus</p>
      <div style={S.statGrid}>
        <div style={S.statBox}><div style={S.statNum}>{totalRecipes}</div><div style={S.statLabel}>Recettes catalogue</div></div>
        <div style={S.statBox}><div style={{ ...S.statNum, color: '#e67e22' }}>{totalOrders}</div><div style={S.statLabel}>Commandes totales</div></div>
        <div style={S.statBox}><div style={{ ...S.statNum, color: '#6b21a8' }}>{totalPieces.toLocaleString('fr-MA')}</div><div style={S.statLabel}>Pièces produites</div></div>
        <div style={S.statBox}><div style={{ ...S.statNum, color: '#2d6a4f' }}>{fmt(totalRevenue)} MAD</div><div style={S.statLabel}>Chiffre d'affaires</div></div>
      </div>
      <div style={S.tabs}>
        <button style={{ ...S.tab, ...(tab === 'recipes' ? S.tabActive : {}) }} onClick={() => setTab('recipes')}>Catalogue recettes</button>
        <button style={{ ...S.tab, ...(tab === 'event' ? S.tabActive : {}) }} onClick={() => setTab('event')}>Par événement</button>
      </div>

      {tab === 'recipes' && (
        <>
          <div style={S.topBar}>
            <span style={{ fontSize: 13, color: '#888' }}>{totalRecipes} recettes</span>
            {canCreate && (
              <button style={S.btnGhost} onClick={() => setShowCatManager(true)}>
                ⚙ Gérer catégories
              </button>
            )}
            {canCreate && <button style={S.btn} onClick={() => openRecipeModal()}>+ Nouvelle recette</button>}
          </div>
          {loading ? <p style={{ color: '#888' }}>Chargement...</p> : recipes.length === 0 ? (
            <div style={S.empty}><div style={{ fontSize: 32, marginBottom: 8 }}>🍯</div><p style={{ fontWeight: 500, marginBottom: 4 }}>Aucune recette</p><p>Cliquez sur "+ Nouvelle recette"</p></div>
          ) : (
            <table style={S.table}>
              <thead><tr><th style={S.th}>Recette</th><th style={S.th}>Catégorie</th><th style={S.th}>Fournée</th><th style={S.th}>Prix vente/pièce</th><th style={S.th}></th></tr></thead>
              <tbody>
                {recipes.map(r => {
                  const cs = CATEGORY_COLORS[r.category] || CATEGORY_COLORS.autre;
                  return (
                    <tr key={r.id}>
                      <td style={S.td}><div style={{ fontWeight: 500 }}>{r.name}</div>{r.name_ar && <div style={{ fontSize: 11, color: '#888', direction: 'rtl' }}>{r.name_ar}</div>}{r.notes && <div style={{ fontSize: 11, color: '#aaa' }}>{r.notes}</div>}</td>
                      <td style={S.td}><span style={{ ...S.badge, background: cs.bg, color: cs.color }}>{CATEGORY_LABELS[r.category] || r.category}</span></td>
                      <td style={S.td}>{r.batch_size} {r.unit}s</td>
                      <td style={{ ...S.td, fontWeight: 500, color: '#2d6a4f' }}>{fmt(r.selling_price)} MAD</td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {canCreate && <button style={S.btnGhost} onClick={() => openIngModal(r)} title="Ingrédients">🧾</button>}
                          {canCreate && <button style={S.btnGhost} onClick={() => openRecipeModal(r)}>✏️</button>}
                          {canDelete && <button style={S.btnDanger} onClick={() => deleteRecipe(r.id)}>✕</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === 'event' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <select style={S.eventSel} value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
              <option value="">-- Choisir un événement --</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name || ev.client_name} — {ev.event_date ? new Date(ev.event_date).toLocaleDateString('fr-MA') : ''}</option>)}
            </select>
            {canCreate && selectedEvent && <button style={S.btn} onClick={openOrderModal}>+ Ajouter une pâtisserie</button>}
          </div>
          {!selectedEvent ? <div style={S.empty}><div style={{ fontSize: 28, marginBottom: 8 }}>🍯</div><p>Sélectionnez un événement</p></div>
          : eventOrders.length === 0 ? <div style={S.empty}><div style={{ fontSize: 28, marginBottom: 8 }}>🍯</div><p style={{ fontWeight: 500, marginBottom: 4 }}>Aucune pâtisserie planifiée</p><p>Cliquez sur "+ Ajouter une pâtisserie"</p></div>
          : <>
            {eventTotal > 0 && <div style={S.greenBox}>Total pâtisserie cet événement : {fmt(eventTotal)} MAD · {eventExternal > 0 ? `${eventExternal} externalisé(s)` : 'Production interne'}</div>}
            <table style={S.table}>
              <thead><tr><th style={S.th}>Recette</th><th style={S.th}>Fournées</th><th style={S.th}>Pièces</th><th style={S.th}>Prix/pièce</th><th style={S.th}>Total</th><th style={S.th}>Source</th><th style={S.th}></th></tr></thead>
              <tbody>
                {eventOrders.map(o => (
                  <tr key={o.id}>
                    <td style={S.td}><div style={{ fontWeight: 500 }}>{o.recipe_name}</div>{o.notes && <div style={{ fontSize: 11, color: '#aaa' }}>{o.notes}</div>}</td>
                    <td style={S.td}>{o.quantity_batches}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{(o.total_pieces || 0).toLocaleString('fr-MA')}</td>
                    <td style={S.td}>{fmt(o.selling_price)} MAD</td>
                    <td style={{ ...S.td, fontWeight: 600, color: '#2d6a4f' }}>{fmt((o.total_pieces || 0) * (o.selling_price || 0))} MAD</td>
                    <td style={S.td}><span style={{ ...S.badge, ...(o.is_external ? { background: '#fff8e8', color: '#a06010' } : { background: '#e8f8f0', color: '#1a7a48' }) }}>{o.is_external ? '🔗 Externe' : '✓ Interne'}</span></td>
                    <td style={S.td}>{canDelete && <button style={S.btnDanger} onClick={() => deleteOrder(o.id)}>✕</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>}
        </>
      )}

      {showRecipeModal && (
        <div style={S.overlay} onClick={() => setShowRecipeModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <p style={S.modalTitle}>{editingRecipe ? 'Modifier la recette' : 'Nouvelle recette pâtisserie'}</p>
            <div style={S.formRow}><label style={S.label}>Nom (français) *</label><input style={S.input} value={recipeForm.name} onChange={e => setRecipeForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Chebakia" /></div>
            <div style={S.formRow}><label style={S.label}>Nom en arabe</label><input style={{ ...S.input, direction: 'rtl', textAlign: 'right' }} value={recipeForm.name_ar} onChange={e => setRecipeForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="شباكية" /></div>
            <div style={S.row2}>
              <div style={S.formRow}><label style={S.label}>Catégorie</label>
                <select style={S.select} value={recipeForm.category}
                  onChange={e => setRecipeForm(f => ({ ...f, category: e.target.value }))}>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div style={S.formRow}><label style={S.label}>Unité</label><input style={S.input} value={recipeForm.unit} onChange={e => setRecipeForm(f => ({ ...f, unit: e.target.value }))} placeholder="pièce" /></div>
            </div>
            <div style={S.row2}>
              <div style={S.formRow}><label style={S.label}>Taille de la fournée</label><input style={S.input} type="number" min="1" value={recipeForm.batch_size} onChange={e => setRecipeForm(f => ({ ...f, batch_size: e.target.value }))} /></div>
              <div style={S.formRow}><label style={S.label}>Prix de vente / pièce (MAD)</label><input style={S.input} type="number" step="0.5" value={recipeForm.selling_price} onChange={e => setRecipeForm(f => ({ ...f, selling_price: e.target.value }))} placeholder="3.50" /></div>
            </div>
            <div style={S.formRow}><label style={S.label}>Notes</label><input style={S.input} value={recipeForm.notes} onChange={e => setRecipeForm(f => ({ ...f, notes: e.target.value }))} placeholder="ex: Sésame, miel, eau de fleur d'oranger" /></div>
            <div style={S.modalFoot}><button style={S.btnGhost} onClick={() => setShowRecipeModal(false)}>Annuler</button><button style={S.btn} onClick={saveRecipe} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button></div>
          </div>
        </div>
      )}

      {showIngModal && activeRecipe && (
        <div style={S.overlay} onClick={() => setShowIngModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <p style={S.modalTitle}>Ingrédients — {activeRecipe.name}</p>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>Fournée de {activeRecipe.batch_size} {activeRecipe.unit}s</p>
            {ingredients.length > 0 && (
              <table style={{ ...S.table, marginBottom: 16 }}>
                <thead><tr><th style={S.th}>Ingrédient</th><th style={S.th}>Quantité</th><th style={S.th}>Coût/unité</th><th style={S.th}>Coût total</th><th style={S.th}></th></tr></thead>
                <tbody>
                  {ingredients.map(i => (
                    <tr key={i.id}>
                      <td style={S.td}>{i.ingredient_name}</td>
                      <td style={S.td}>{i.quantity} {i.unit}</td>
                      <td style={S.td}>{fmt(i.cost_per_unit)} MAD</td>
                      <td style={{ ...S.td, color: '#2d6a4f', fontWeight: 500 }}>{fmt(i.quantity * i.cost_per_unit)} MAD</td>
                      <td style={S.td}>{canDelete && <button style={S.btnDanger} onClick={() => deleteIngredient(i.id)}>✕</button>}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} style={{ ...S.td, fontWeight: 600 }}>Coût total fournée</td>
                    <td style={{ ...S.td, fontWeight: 700, color: '#2d6a4f' }}>{fmt(ingredients.reduce((s, i) => s + i.quantity * i.cost_per_unit, 0))} MAD</td>
                    <td style={S.td}></td>
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ ...S.td, fontWeight: 600 }}>Coût / pièce</td>
                    <td style={{ ...S.td, fontWeight: 700, color: '#2d6a4f' }}>{fmt(ingredients.reduce((s, i) => s + i.quantity * i.cost_per_unit, 0) / (activeRecipe.batch_size || 1))} MAD</td>
                    <td style={S.td}></td>
                  </tr>
                  {activeRecipe.selling_price > 0 && (
                    <tr style={{ background: '#f0faf4' }}>
                      <td colSpan={3} style={{ ...S.td, fontWeight: 600, color: '#2d6a4f' }}>Marge / pièce</td>
                      <td style={{ ...S.td, fontWeight: 700, color: '#2d6a4f' }}>
                        {fmt(activeRecipe.selling_price - ingredients.reduce((s, i) => s + i.quantity * i.cost_per_unit, 0) / (activeRecipe.batch_size || 1))} MAD
                        ({Math.round((1 - (ingredients.reduce((s, i) => s + i.quantity * i.cost_per_unit, 0) / (activeRecipe.batch_size || 1)) / activeRecipe.selling_price) * 100)}%)
                      </td>
                      <td style={S.td}></td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            {canCreate && (
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 10 }}>Ajouter un ingrédient</p>
                <div style={S.row2}>
                  <div style={S.formRow}><label style={S.label}>Nom *</label><input style={S.input} value={ingForm.ingredient_name} onChange={e => setIngForm(f => ({ ...f, ingredient_name: e.target.value }))} placeholder="ex: Farine" /></div>
                  <div style={S.formRow}><label style={S.label}>Unité</label><select style={S.select} value={ingForm.unit} onChange={e => setIngForm(f => ({ ...f, unit: e.target.value }))}><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="L">L</option><option value="pièce">pièce</option><option value="cuillère">cuillère</option></select></div>
                </div>
                <div style={S.row2}>
                  <div style={S.formRow}><label style={S.label}>Quantité *</label><input style={S.input} type="number" step="0.01" value={ingForm.quantity} onChange={e => setIngForm(f => ({ ...f, quantity: e.target.value }))} placeholder="500" /></div>
                  <div style={S.formRow}><label style={S.label}>Coût/unité (MAD)</label><input style={S.input} type="number" step="0.01" value={ingForm.cost_per_unit} onChange={e => setIngForm(f => ({ ...f, cost_per_unit: e.target.value }))} placeholder="0.05" /></div>
                </div>
                <button style={S.btn} onClick={addIngredient} disabled={saving}>+ Ajouter</button>
              </div>
            )}
            <div style={S.modalFoot}><button style={S.btnGhost} onClick={() => setShowIngModal(false)}>Fermer</button></div>
          </div>
        </div>
      )}

      {showCatManager && (
        <CategoryManager
          module="pastry"
          onClose={() => setShowCatManager(false)}
          onUpdate={() => { loadCategories(); loadAll(); }}
        />
      )}

      {showOrderModal && (
        <div style={S.overlay} onClick={() => setShowOrderModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <p style={S.modalTitle}>Ajouter une pâtisserie à l'événement</p>
            <div style={S.formRow}><label style={S.label}>Recette *</label>
              <select style={S.select} value={orderForm.recipe_id} onChange={e => setOrderForm(f => ({ ...f, recipe_id: e.target.value }))}>
                <option value="">-- Choisir une recette --</option>
                {Object.entries(grouped).map(([cat, catRecipes]) => (
                  <optgroup key={cat} label={CATEGORY_LABELS[cat] || cat}>
                    {catRecipes.map(r => <option key={r.id} value={r.id}>{r.name} — {r.batch_size} pièces/fournée · {fmt(r.selling_price)} MAD/pièce</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            {orderForm.recipe_id && (() => {
              const r = recipes.find(x => x.id === orderForm.recipe_id);
              if (!r) return null;
              const total = parseInt(orderForm.quantity_batches || 1) * r.batch_size;
              return <div style={S.greenBox}>{total} pièces · {fmt(total * r.selling_price)} MAD estimé</div>;
            })()}
            <div style={S.row2}>
              <div style={S.formRow}><label style={S.label}>Nombre de fournées</label><input style={S.input} type="number" min="1" value={orderForm.quantity_batches} onChange={e => setOrderForm(f => ({ ...f, quantity_batches: e.target.value }))} /></div>
              <div style={S.formRow}><label style={S.label}>Source</label>
                <select style={S.select} value={orderForm.is_external ? 'externe' : 'interne'} onChange={e => setOrderForm(f => ({ ...f, is_external: e.target.value === 'externe' }))}>
                  <option value="interne">✓ Production interne</option>
                  <option value="externe">🔗 Externalisé</option>
                </select>
              </div>
            </div>
            {orderForm.is_external && <div style={S.formRow}><label style={S.label}>Coût externe (MAD)</label><input style={S.input} type="number" value={orderForm.external_cost} onChange={e => setOrderForm(f => ({ ...f, external_cost: e.target.value }))} placeholder="ex: 500" /></div>}
            <div style={S.formRow}><label style={S.label}>Notes</label><input style={S.input} value={orderForm.notes} onChange={e => setOrderForm(f => ({ ...f, notes: e.target.value }))} placeholder="ex: Livraison 1h avant l'événement" /></div>
            <div style={S.modalFoot}><button style={S.btnGhost} onClick={() => setShowOrderModal(false)}>Annuler</button><button style={S.btn} onClick={saveOrder} disabled={saving}>{saving ? 'Enregistrement...' : 'Confirmer'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
