import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { canDo } from '../lib/permissions'
import HelpGuide from '../components/HelpGuide'

const PLATS_GUIDE = {
  title: 'Comment gérer vos plats',
  steps: [
    { icon: '🥬', title: 'Créez vos ingrédients',  description: 'Allez dans Stock > Ingrédients et ajoutez vos matières premières avec leur coût unitaire.' },
    { icon: '🍽️', title: 'Créez un nouveau plat',  description: "Cliquez sur '+ Nouveau plat', donnez un nom et une catégorie." },
    { icon: '📋', title: 'Ajoutez la recette',      description: "Cliquez sur l'icône loupe, ajoutez les ingrédients et quantités." },
    { icon: '💰', title: 'Consultez la marge',      description: 'Le coût et la marge se calculent automatiquement selon les prix du stock.' },
  ],
}

const S = {
  page: { padding: '2rem', maxWidth: '1000px', margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: '600', color: '#1a1a18', marginBottom: '4px' },
  subtitle: { fontSize: '0.9rem', color: '#6b6b66', marginBottom: '2rem' },
  card: { background: '#fff', border: '1px solid #e5e4e0', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b6b66', marginBottom: '4px' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: '6px', fontSize: '0.9rem', background: '#fff', color: '#1a1a18', outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '8px 12px', border: '1px solid #e5e4e0', borderRadius: '6px', fontSize: '0.9rem', background: '#fff', color: '#1a1a18', outline: 'none' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b6b66', padding: '8px 12px', borderBottom: '2px solid #e5e4e0', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '11px 12px', fontSize: '0.875rem', color: '#1a1a18', borderBottom: '1px solid #f0efeb', verticalAlign: 'middle' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' },
  btn: { padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' },
  btnPrimary: { background: '#2d6a4f', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
  btnEdit: { background: '#eff6ff', color: '#1d4ed8', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', marginRight: '4px' },
  btnGreen: { background: '#dcfce7', color: '#166534', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', marginRight: '4px' },
  btnDanger: { background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  alert: { padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' },
  successAlert: { background: '#dcfce7', color: '#166534' },
  errorAlert: { background: '#fee2e2', color: '#dc2626' },
  emptyState: { textAlign: 'center', padding: '3rem', color: '#6b6b66', fontSize: '0.9rem' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: '#fff', borderRadius: '12px', padding: '2rem', width: '580px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
}

const categoryColors = {
  'entrée':   { background: '#dbeafe', color: '#1e40af' },
  'plat':     { background: '#dcfce7', color: '#166534' },
  'dessert':  { background: '#fef9c3', color: '#854d0e' },
  'boisson':  { background: '#f3e8ff', color: '#6b21a8' },
  'accompagnement': { background: '#f0efeb', color: '#6b6b66' },
}
function getCatStyle(cat) {
  if (!cat) return { background: '#f0efeb', color: '#6b6b66' }
  const key = cat.toLowerCase()
  for (const k in categoryColors) { if (key.includes(k)) return categoryColors[k] }
  return { background: '#f0efeb', color: '#6b6b66' }
}

const UNITS = ['g', 'kg', 'ml', 'l', 'pièce(s)', 'bouquet(s)', 'sachet(s)', 'boîte(s)', 'c.à.s', 'c.à.c', 'verre(s)', 'tranche(s)']

const BASE_CATEGORIES = ['Plat', 'Entrée', 'Dessert', 'Boisson', 'Accompagnement', 'Pâtisserie']

const emptyForm = { name_fr: '', name_ar: '', category: '', serves_per_unit: '1', price_per_unit: '', description: '', is_active: true }
const servesExamples = {
  'plat': { example: 'Ex: Un agneau entier sert 8 → 8', icon: '🍖' },
  'entrée': { example: 'Ex: Plateau briouates (20 pièces) → 20', icon: '🥗' },
  'dessert': { example: 'Ex: Gâteau 12 parts → 12', icon: '🍰' },
  'boisson': { example: 'Ex: Bouteille jus (6 verres) → 6', icon: '🥤' },
  'accompagnement': { example: 'Ex: Grand plat couscous pour 10 → 10', icon: '🍚' },
}

function saveToCache(dishId, items) {
  try { localStorage.setItem(`tp_recipe_${dishId}`, JSON.stringify(items)) } catch {}
}
function loadFromCache(dishId) {
  try { const v = localStorage.getItem(`tp_recipe_${dishId}`); return v ? JSON.parse(v) : null } catch { return null }
}
function loadCustomUnits() {
  try { const v = localStorage.getItem('tp_custom_units'); return v ? JSON.parse(v) : [] } catch { return [] }
}
function saveCustomUnits(units) {
  try { localStorage.setItem('tp_custom_units', JSON.stringify(units)) } catch {}
}

const unitToGrams = { g: 1, kg: 1000, ml: 1, l: 1000 }
function calcTotalGrams(items, mult) {
  return items.reduce((s, i) => s + (parseFloat(i.qty) || 0) * mult * (unitToGrams[i.unit] || 0), 0)
}
function fmtWeight(g) {
  if (!g) return '0 g'
  return g >= 1000 ? `${(g / 1000).toFixed(2).replace(/\.?0+$/, '')} kg` : `${g} g`
}
function fmtQty(qty, unit) {
  if (unit === 'g' && qty >= 1000) return `${(qty / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`
  if (unit === 'ml' && qty >= 1000) return `${(qty / 1000).toFixed(2).replace(/\.?0+$/, '')} l`
  return `${qty % 1 === 0 ? qty : parseFloat(qty.toFixed(2))} ${unit}`
}
let _uid = 0
const gid = () => ++_uid

// ══════════════════════════════════════════════════════════
// UnitManagerModal
// ══════════════════════════════════════════════════════════
function UnitManagerModal({ customUnits, onChange, onClose }) {
  const [newUnit, setNewUnit] = useState('')
  const dk = { bg: '#1c1c1e', panel: '#2c2c2e', border: '#3a3a3c', text: '#fff', muted: '#8e8e93', dim: '#636366', danger: '#ff453a' }

  function handleAdd() {
    const trimmed = newUnit.trim()
    if (!trimmed || customUnits.includes(trimmed) || UNITS.includes(trimmed)) return
    const updated = [...customUnits, trimmed]
    saveCustomUnits(updated)
    onChange(updated)
    setNewUnit('')
  }

  function handleDelete(unit) {
    const updated = customUnits.filter(u => u !== unit)
    saveCustomUnits(updated)
    onChange(updated)
  }

  return (
    <div style={{ ...S.modal, zIndex: 1200 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: dk.bg, borderRadius: '12px', padding: '1.5rem', width: '340px', maxWidth: '95vw', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ color: dk.text, fontWeight: '700', fontSize: '0.95rem' }}>⚙️ Unités personnalisées</div>
          <button onClick={onClose} style={{ background: dk.panel, border: 'none', color: dk.muted, borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
        </div>

        <div style={{ fontSize: '0.7rem', color: dk.dim, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Unités de base</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '1rem' }}>
          {UNITS.map(u => (
            <span key={u} style={{ background: dk.panel, color: dk.muted, borderRadius: '5px', padding: '3px 8px', fontSize: '0.78rem' }}>{u}</span>
          ))}
        </div>

        <div style={{ fontSize: '0.7rem', color: dk.dim, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Unités personnalisées</div>
        {customUnits.length === 0
          ? <div style={{ color: dk.dim, fontSize: '0.82rem', marginBottom: '0.75rem' }}>Aucune unité ajoutée.</div>
          : (
            <div style={{ marginBottom: '0.75rem', border: `1px solid ${dk.border}`, borderRadius: '8px', overflow: 'hidden' }}>
              {customUnits.map((u, i) => (
                <div key={u} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderBottom: i < customUnits.length - 1 ? `1px solid ${dk.border}` : 'none' }}>
                  <span style={{ color: dk.text, fontSize: '0.875rem' }}>{u}</span>
                  <button onClick={() => handleDelete(u)} style={{ background: 'rgba(255,69,58,0.15)', border: 'none', color: dk.danger, borderRadius: '5px', cursor: 'pointer', fontSize: '0.78rem', padding: '3px 8px' }}>✕</button>
                </div>
              ))}
            </div>
          )
        }

        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            value={newUnit}
            onChange={e => setNewUnit(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Ex: portion(s), filet(s)..."
            style={{ flex: 1, background: dk.panel, border: `1px solid ${dk.border}`, borderRadius: '7px', padding: '7px 10px', color: dk.text, fontSize: '0.85rem', outline: 'none' }}
          />
          <button onClick={handleAdd} style={{ background: '#1a5c3a', border: 'none', borderRadius: '7px', color: '#fff', padding: '7px 14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>+</button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// RecipeModal — dark theme, matches reference screenshot
// ══════════════════════════════════════════════════════════
function RecipeModal({ dish, onClose, businessId }) {
  const [dishName, setDishName] = useState(dish.name_fr)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mult, setMult] = useState(1)
  const [customUnits, setCustomUnits] = useState(loadCustomUnits)
  const [showUnitManager, setShowUnitManager] = useState(false)
  const listRef = useRef(null)
  const allUnits = [...UNITS, ...customUnits]

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('dish_ingredients')
        .select('id, quantity, unit, ingredients(name_fr, unit)')
        .eq('dish_id', dish.id)
      if (data && data.length > 0) {
        const rows = data.map(r => ({ id: gid(), name: r.ingredients?.name_fr || '', qty: String(r.quantity || ''), unit: r.unit || r.ingredients?.unit || 'g', dbId: r.id }))
        setItems(rows); saveToCache(dish.id, rows)
      } else {
        const cached = loadFromCache(dish.id)
        setItems(cached || [{ id: gid(), name: '', qty: '', unit: 'g', dbId: null }])
      }
      setLoading(false)
    }
    load()
  }, [])

  function addRow() {
    setItems(p => [...p, { id: gid(), name: '', qty: '', unit: 'g', dbId: null }])
    setTimeout(() => listRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 50)
  }
  function removeRow(id) {
    setItems(p => p.length === 1 ? [{ id: gid(), name: '', qty: '', unit: 'g', dbId: null }] : p.filter(i => i.id !== id))
  }
  function update(id, field, val) {
    setItems(p => p.map(i => i.id === id ? { ...i, [field]: val } : i))
  }

  async function handleSave() {
    const valid = items.filter(i => i.name.trim() && parseFloat(i.qty) > 0)
    if (!valid.length) return
    setSaving(true)
    saveToCache(dish.id, items)
    try {
      const { data: allIng } = await supabase.from('ingredients').select('id, name_fr')
      await supabase.from('dish_ingredients').delete().eq('dish_id', dish.id)
      const toInsert = valid
        .map(row => ({ dish_id: dish.id, ingredient_id: allIng?.find(i => i.name_fr.toLowerCase() === row.name.toLowerCase())?.id || null, quantity: parseFloat(row.qty), unit: row.unit, business_id: businessId }))
        .filter(r => r.ingredient_id)
      if (toInsert.length) await supabase.from('dish_ingredients').insert(toInsert)
    } catch {}
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const validItems = items.filter(i => i.name.trim() && parseFloat(i.qty) > 0)
  const totalGrams = calcTotalGrams(validItems, mult)
  const portions = mult * (dish.serves_per_unit || 1)

  // Dark theme tokens
  const dk = { bg: '#1c1c1e', panel: '#2c2c2e', border: '#3a3a3c', text: '#fff', muted: '#8e8e93', dim: '#636366', green: '#30d158', danger: '#ff453a' }

  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: dk.bg, borderRadius: '14px', width: '90vw', maxWidth: '860px', height: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.55)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${dk.border}`, flexShrink: 0 }}>
          <div style={{ color: dk.text, fontWeight: '700', fontSize: '1rem' }}>🍳 {dish.name_fr}</div>
          <button onClick={onClose} style={{ background: dk.panel, border: 'none', color: dk.muted, borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '0.82rem' }}>✕ Fermer</button>
        </div>

        {/* Body: 2 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden' }}>

          {/* ── LEFT: Editor ── */}
          <div style={{ padding: '18px', borderRight: `1px solid ${dk.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: dk.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Recipe editor</div>

            {/* Dish name */}
            <input value={dishName} onChange={e => setDishName(e.target.value)}
              style={{ background: dk.panel, border: `1px solid ${dk.border}`, borderRadius: '8px', padding: '9px 12px', color: dk.text, fontSize: '0.95rem', fontWeight: '600', marginBottom: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />

            {/* Col headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 68px 78px 28px', gap: '5px', marginBottom: '6px' }}>
              {['Ingredient', 'Qty (1x)', '', ''].map((h, i) => (
                <div key={i} style={{ fontSize: '0.68rem', color: dk.dim, fontWeight: '600', textTransform: 'uppercase' }}>
                  {i === 2
                    ? <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Unit</span>
                        <button onClick={() => setShowUnitManager(true)} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: dk.muted, borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem', padding: '1px 5px', lineHeight: 1.4 }} title="Gérer les unités">⚙️</button>
                      </div>
                    : h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {loading ? <div style={{ color: dk.dim, padding: '1rem 0', fontSize: '0.85rem' }}>Chargement...</div> : (
              <div ref={listRef} style={{ overflowY: 'auto', flex: 1, marginBottom: '10px' }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 68px 78px 28px', gap: '5px', marginBottom: '5px', alignItems: 'center' }}>
                    <input value={item.name} onChange={e => update(item.id, 'name', e.target.value)} placeholder="Ingredient"
                      style={{ background: dk.panel, border: `1px solid ${dk.border}`, borderRadius: '7px', padding: '6px 9px', color: dk.text, fontSize: '0.82rem', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                    <input type="number" min="0" step="0.01" value={item.qty} onChange={e => update(item.id, 'qty', e.target.value)} placeholder="0"
                      style={{ background: dk.panel, border: `1px solid ${dk.border}`, borderRadius: '7px', padding: '6px 4px', color: dk.text, fontSize: '0.82rem', textAlign: 'center', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                    <select value={item.unit} onChange={e => update(item.id, 'unit', e.target.value)}
                      style={{ background: dk.panel, border: `1px solid ${dk.border}`, borderRadius: '7px', padding: '6px 3px', color: dk.text, fontSize: '0.78rem', outline: 'none', width: '100%' }}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      {customUnits.length > 0 && <option disabled>──────</option>}
                      {customUnits.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <button onClick={() => removeRow(item.id)}
                      style={{ background: 'rgba(255,69,58,0.15)', border: 'none', color: dk.danger, borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: '700', width: '28px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={addRow}
              style={{ width: '100%', padding: '8px', background: 'transparent', border: `1.5px dashed ${dk.border}`, borderRadius: '8px', color: dk.muted, fontSize: '0.83rem', cursor: 'pointer', marginBottom: '10px', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = dk.green; e.currentTarget.style.color = dk.green }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = dk.border; e.currentTarget.style.color = dk.muted }}>
              + add ingredient
            </button>

            <button onClick={handleSave} disabled={saving}
              style={{ padding: '10px', background: saved ? '#166534' : '#1a5c3a', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '0.88rem', cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
              {saving ? '⏳ Saving...' : saved ? '✓ Saved!' : 'Save recipe'}
            </button>
          </div>

          {/* ── RIGHT: Calculator ── */}
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: dk.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Order calculator</div>

            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: dk.text, marginBottom: '14px' }}>{dishName}</div>

            {/* Servings row */}
            <div style={{ background: dk.panel, borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.8rem', color: dk.muted, flex: 1 }}>Servings / tables</span>
              <button onClick={() => setMult(v => Math.max(1, v - 1))}
                style={{ width: '26px', height: '26px', background: dk.border, border: 'none', borderRadius: '6px', color: dk.text, fontWeight: '900', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ color: dk.text, fontWeight: '800', fontSize: '1.05rem', minWidth: '22px', textAlign: 'center' }}>{mult}</span>
              <button onClick={() => setMult(v => v + 1)}
                style={{ width: '26px', height: '26px', background: dk.border, border: 'none', borderRadius: '6px', color: dk.text, fontWeight: '900', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              <input type="number" min="1" value={mult} onChange={e => setMult(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: '48px', background: dk.bg, border: `1px solid ${dk.border}`, borderRadius: '6px', padding: '5px 6px', color: dk.text, textAlign: 'center', fontSize: '0.88rem', outline: 'none' }} />
            </div>

            {/* Results */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
              {validItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: dk.dim, fontSize: '0.82rem', lineHeight: 1.6 }}>
                  Add ingredients on the left<br />to see quantities here.
                </div>
              ) : validItems.map(item => {
                const total = (parseFloat(item.qty) || 0) * mult
                return (
                  <div key={item.id} style={{ padding: '9px 12px', background: dk.panel, borderRadius: '9px', marginBottom: '6px' }}>
                    <div style={{ fontWeight: '700', color: dk.text, fontSize: '0.88rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: dk.dim, marginTop: '1px' }}>{item.qty} {item.unit} × {mult}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: dk.green, marginTop: '2px' }}>{fmtQty(total, item.unit)}</div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div style={{ background: dk.panel, borderRadius: '9px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
              <span style={{ fontSize: '0.8rem', color: dk.dim }}>Total weight: <strong style={{ color: dk.text }}>{fmtWeight(totalGrams)}</strong></span>
              <div style={{ width: '1px', height: '14px', background: dk.border }} />
              <span style={{ fontSize: '0.8rem', color: dk.dim }}>Portions: <strong style={{ color: dk.text }}>{portions}</strong></span>
            </div>
          </div>
        </div>
      </div>
      {showUnitManager && (
        <UnitManagerModal
          customUnits={customUnits}
          onChange={setCustomUnits}
          onClose={() => setShowUnitManager(false)}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// CategorySelect — custom dropdown with inline edit/delete
// ══════════════════════════════════════════════════════════
function CategorySelect({ value, onChange, categories, onAdd, onEdit, onDelete, canCreate, canEdit, canDelete }) {
  const [open, setOpen] = useState(false)
  const [addMode, setAddMode] = useState(false)
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function handleOutside(e) { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setAddMode(false) } }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function confirmAdd() {
    if (newName.trim()) { onAdd(newName.trim()); setNewName('') }
    setAddMode(false)
  }

  function confirmEdit(id) {
    if (editName.trim()) onEdit(id, editName.trim())
    setEditId(null)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <div
          onClick={() => setOpen(o => !o)}
          style={{ ...S.select, cursor: 'pointer', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
        >
          <span style={{ color: value ? '#1a1a18' : '#9ca3af' }}>{value || 'Sélectionner...'}</span>
          <span style={{ color: '#6b6b66', fontSize: '0.7rem' }}>▾</span>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setOpen(true); setAddMode(true) }}
            style={{ ...S.btn, background: '#2d6a4f', color: '#fff', padding: '7px 11px', fontSize: '1rem', fontWeight: '700', flexShrink: 0 }}
            title="Ajouter une catégorie"
          >+</button>
        )}
      </div>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 3px)', left: 0, right: 0, background: '#fff', border: '1px solid #e5e4e0', borderRadius: '8px', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', zIndex: 200, maxHeight: '240px', overflowY: 'auto' }}>
          <div
            onClick={() => { onChange(''); setOpen(false) }}
            style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.875rem', color: '#6b6b66', borderBottom: '1px solid #f0efeb' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9f8f5'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
          >— Aucune —</div>

          {categories.map(cat => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', padding: '5px 8px 5px 12px', borderBottom: '1px solid #f0efeb', gap: '4px' }}>
              {editId === cat.id ? (
                <>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') confirmEdit(cat.id); if (e.key === 'Escape') setEditId(null) }}
                    autoFocus
                    style={{ ...S.input, flex: 1, padding: '4px 8px', fontSize: '0.85rem' }}
                    onClick={e => e.stopPropagation()}
                  />
                  <button type="button" onClick={e => { e.stopPropagation(); confirmEdit(cat.id) }} style={{ ...S.btnEdit, padding: '3px 8px', marginRight: 0 }}>✓</button>
                  <button type="button" onClick={e => { e.stopPropagation(); setEditId(null) }} style={{ ...S.btnDanger, padding: '3px 8px' }}>✕</button>
                </>
              ) : (
                <>
                  <span
                    onClick={() => { onChange(cat.name); setOpen(false) }}
                    style={{ flex: 1, cursor: 'pointer', fontSize: '0.875rem', color: value === cat.name ? '#2d6a4f' : '#1a1a18', fontWeight: value === cat.name ? '600' : 'normal', padding: '3px 0' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#2d6a4f'}
                    onMouseLeave={e => e.currentTarget.style.color = value === cat.name ? '#2d6a4f' : '#1a1a18'}
                  >{cat.name}</span>
                  {canEdit && (
                    <button type="button" onClick={e => { e.stopPropagation(); setEditId(cat.id); setEditName(cat.name) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6b66', padding: '3px 6px', fontSize: '0.82rem', borderRadius: '4px' }} title="Renommer">✏</button>
                  )}
                  {canDelete && (
                    <button type="button" onClick={e => { e.stopPropagation(); onDelete(cat.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '3px 6px', fontSize: '0.82rem', borderRadius: '4px' }} title="Supprimer">✕</button>
                  )}
                </>
              )}
            </div>
          ))}

          {addMode && (
            <div style={{ display: 'flex', gap: '4px', padding: '8px', borderTop: '1px solid #e5e4e0' }}>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmAdd(); if (e.key === 'Escape') { setAddMode(false); setNewName('') } }}
                placeholder="Nouvelle catégorie..."
                autoFocus
                style={{ ...S.input, flex: 1, padding: '5px 8px', fontSize: '0.85rem' }}
                onClick={e => e.stopPropagation()}
              />
              <button type="button" onClick={confirmAdd} style={{ ...S.btnPrimary, padding: '5px 12px', fontSize: '0.85rem' }}>+</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// CategoryManagerModal
// ══════════════════════════════════════════════════════════
function CategoryManagerModal({ categories, onAdd, onEdit, onDelete, canCreate, canEdit, canDelete, onClose }) {
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')

  function confirmAdd() {
    if (newName.trim()) { onAdd(newName.trim()); setNewName('') }
  }

  function startEdit(cat) { setEditId(cat.id); setEditName(cat.name) }

  function confirmEdit(id) {
    if (editName.trim()) onEdit(id, editName.trim())
    setEditId(null)
  }

  return (
    <div style={{ ...S.modal, zIndex: 1100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...S.modalBox, maxWidth: '420px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1a1a18' }}>⚙️ Gérer les catégories</div>
          <button type="button" onClick={onClose} style={{ ...S.btn, background: '#f0efeb', color: '#6b6b66', padding: '5px 10px', fontSize: '0.8rem' }}>✕ Fermer</button>
        </div>

        <div style={{ marginBottom: '1rem', maxHeight: '280px', overflowY: 'auto', border: '1px solid #e5e4e0', borderRadius: '8px' }}>
          {categories.length === 0 && (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b6b66', fontSize: '0.85rem' }}>Aucune catégorie.</div>
          )}
          {categories.map((cat, i) => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderBottom: i < categories.length - 1 ? '1px solid #f0efeb' : 'none' }}>
              {editId === cat.id ? (
                <>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') confirmEdit(cat.id); if (e.key === 'Escape') setEditId(null) }}
                    autoFocus
                    style={{ ...S.input, flex: 1, padding: '5px 8px', fontSize: '0.875rem' }}
                  />
                  <button type="button" onClick={() => confirmEdit(cat.id)} style={{ ...S.btnEdit, padding: '5px 10px', marginRight: 0 }}>✓</button>
                  <button type="button" onClick={() => setEditId(null)} style={{ ...S.btnDanger, padding: '5px 10px' }}>✕</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: '0.875rem', color: '#1a1a18' }}>{cat.name}</span>
                  {canEdit && (
                    <button type="button" onClick={() => startEdit(cat)} style={{ ...S.btnEdit, padding: '4px 9px', marginRight: 0 }} title="Renommer">✏</button>
                  )}
                  {canDelete && (
                    <button type="button" onClick={() => onDelete(cat.id)} style={{ ...S.btnDanger, padding: '4px 9px' }} title="Supprimer">✕</button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {canCreate && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmAdd()}
              placeholder="Nouvelle catégorie..."
              style={{ ...S.input, flex: 1 }}
            />
            <button type="button" onClick={confirmAdd} style={{ ...S.btnPrimary, padding: '8px 16px' }}>+ Ajouter</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// Main page
// ══════════════════════════════════════════════════════════
export default function Plats() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterActive, setFilterActive] = useState('true')
  const [recipeFor, setRecipeFor] = useState(null)
  const [categories, setCategories] = useState([])
  const [showCatManager, setShowCatManager] = useState(false)

  useEffect(() => { loadDishes(); loadCategories() }, [])

  async function loadDishes() {
    setLoading(true)
    const { data } = await supabase.from('dishes').select('*').order('category').order('name_fr')
    setDishes(data || [])
    setLoading(false)
  }

  async function loadCategories() {
    try {
      const { data, error } = await supabase.from('dish_categories').select('id, name').order('name')
      if (!error && data) {
        setCategories(data.length > 0 ? data : BASE_CATEGORIES.map((name, i) => ({ id: `base_${i}`, name })))
      } else {
        setCategories(BASE_CATEGORIES.map((name, i) => ({ id: `base_${i}`, name })))
      }
    } catch {
      setCategories(BASE_CATEGORIES.map((name, i) => ({ id: `base_${i}`, name })))
    }
  }

  async function handleAddCategory(name) {
    const trimmed = name.trim()
    if (!trimmed) return
    const { data, error } = await supabase.from('dish_categories').insert({ name: trimmed, business_id: profile?.business_id }).select().single()
    if (!error && data) setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    else setCategories(prev => [...prev, { id: `local_${Date.now()}`, name: trimmed }].sort((a, b) => a.name.localeCompare(b.name)))
  }

  async function handleEditCategory(id, newName) {
    const trimmed = newName.trim()
    if (!trimmed) return
    if (!String(id).startsWith('base_') && !String(id).startsWith('local_')) {
      await supabase.from('dish_categories').update({ name: trimmed }).eq('id', id)
    }
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name: trimmed } : c))
  }

  async function handleDeleteCategory(id) {
    if (!String(id).startsWith('base_') && !String(id).startsWith('local_')) {
      await supabase.from('dish_categories').delete().eq('id', id)
    }
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  function openCreate() { setEditing(null); setForm(emptyForm); setShowModal(true) }
  function openEdit(dish) {
    setEditing(dish)
    setForm({ name_fr: dish.name_fr || '', name_ar: dish.name_ar || '', category: dish.category || '', serves_per_unit: String(dish.serves_per_unit || 1), price_per_unit: dish.price_per_unit != null ? String(dish.price_per_unit) : '', description: dish.description || '', is_active: dish.is_active !== false })
    setShowModal(true)
  }
  function closeModal() { setShowModal(false); setEditing(null); setForm(emptyForm) }

  async function handleSave() {
    if (!form.name_fr.trim()) { setMessage({ type: 'error', text: 'Le nom est obligatoire.' }); setTimeout(() => setMessage(null), 3000); return }
    setSaving(true)
    const payload = { name_fr: form.name_fr.trim(), name_ar: form.name_ar.trim() || null, category: form.category.trim() || null, serves_per_unit: parseInt(form.serves_per_unit) || 1, price_per_unit: form.price_per_unit !== '' ? parseFloat(form.price_per_unit) : null, description: form.description.trim() || null, is_active: form.is_active }
    const { error } = editing ? await supabase.from('dishes').update(payload).eq('id', editing.id) : await supabase.from('dishes').insert({ ...payload, business_id: profile?.business_id })
    if (error) setMessage({ type: 'error', text: 'Erreur: ' + error.message })
    else { setMessage({ type: 'success', text: editing ? '✓ Modifié.' : '✓ Créé.' }); closeModal(); loadDishes() }
    setTimeout(() => setMessage(null), 3000)
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!isAdmin) return
    await supabase.from('dishes').delete().eq('id', id)
    setDishes(prev => prev.filter(d => d.id !== id)); setConfirmDelete(null)
    setMessage({ type: 'success', text: '✓ Supprimé.' }); setTimeout(() => setMessage(null), 3000)
  }

  async function toggleActive(dish) {
    await supabase.from('dishes').update({ is_active: !dish.is_active }).eq('id', dish.id)
    setDishes(prev => prev.map(d => d.id === dish.id ? { ...d, is_active: !d.is_active } : d))
  }

  const filtered = dishes.filter(d => {
    if (search && !d.name_fr.toLowerCase().includes(search.toLowerCase())) return false
    if (filterCat && d.category !== filterCat) return false
    if (filterActive === 'true' && !d.is_active) return false
    if (filterActive === 'false' && d.is_active) return false
    return true
  })
  const catHint = servesExamples[form.category?.toLowerCase()] || null

  return (
    <div style={S.page}>
      <h1 style={S.title}>Gestion des plats</h1>
      <p style={S.subtitle}>Catalogue de plats · Cliquez sur 🍳 pour éditer la recette et calculer les quantités à commander.</p>

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: '700', color: '#166534', marginBottom: '4px', fontSize: '0.95rem' }}>📐 Formule</div>
        <div style={{ fontSize: '0.85rem', color: '#166534' }}><strong>Unités = (Tables × Invités × (1 + Marge%)) ÷ Portions/unité</strong></div>
      </div>

      {message && <div style={{ ...S.alert, ...(message.type === 'success' ? S.successAlert : S.errorAlert) }}>{message.text}</div>}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={S.label}>Rechercher</label>
          <input style={S.input} placeholder="Nom du plat..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ minWidth: '150px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ ...S.label, marginBottom: 0 }}>Catégorie</label>
            <button type="button" onClick={() => setShowCatManager(true)} style={{ background: '#f0efeb', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 7px', color: '#6b6b66', fontWeight: '500' }}>⚙️ Gérer</button>
          </div>
          <select style={S.select} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">Toutes</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ minWidth: '130px' }}>
          <label style={S.label}>Statut</label>
          <select style={S.select} value={filterActive} onChange={e => setFilterActive(e.target.value)}>
            <option value="true">Actifs seulement</option>
            <option value="false">Inactifs</option>
            <option value="">Tous</option>
          </select>
        </div>
        {canDo(profile?.role, 'canCreate') && (
          <button style={S.btnPrimary} onClick={openCreate}>+ Nouveau plat</button>
        )}
      </div>

      <div style={S.card}>
        {loading ? <div style={S.emptyState}>Chargement...</div>
          : filtered.length === 0 ? <div style={S.emptyState}>Aucun plat.<br /><span style={{ fontSize: '0.8rem' }}>Cliquez "+ Nouveau plat".</span></div>
          : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Plat</th>
                <th style={S.th}>Catégorie</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Portions / unité</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Prix / unité (MAD)</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Statut</th>
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(dish => (
                <tr key={dish.id} style={{ opacity: dish.is_active ? 1 : 0.5 }}>
                  <td style={S.td}>
                    <div style={{ fontWeight: '600' }}>{dish.name_fr}</div>
                    {dish.name_ar && <div style={{ fontSize: '0.78rem', color: '#6b6b66', direction: 'rtl' }}>{dish.name_ar}</div>}
                    {dish.description && <div style={{ fontSize: '0.75rem', color: '#6b6b66', marginTop: '2px' }}>{dish.description}</div>}
                  </td>
                  <td style={S.td}>{dish.category ? <span style={{ ...S.badge, ...getCatStyle(dish.category) }}>{dish.category}</span> : '—'}</td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#2d6a4f' }}>{dish.serves_per_unit}</div>
                    <div style={{ fontSize: '0.72rem', color: '#6b6b66' }}>personnes/unité</div>
                  </td>
                  <td style={{ ...S.td, textAlign: 'right', fontWeight: '600' }}>
                    {dish.price_per_unit != null ? Number(dish.price_per_unit).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) : '—'}
                  </td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <button onClick={() => toggleActive(dish)} style={{ ...S.badge, cursor: 'pointer', border: 'none', ...(dish.is_active ? { background: '#dcfce7', color: '#166534' } : { background: '#f0efeb', color: '#6b6b66' }) }}>
                      {dish.is_active ? '✓ Actif' : '✕ Inactif'}
                    </button>
                  </td>
                  <td style={S.td}>
                    <button style={S.btnGreen} onClick={() => setRecipeFor(dish)} title="Recette & Calculateur">🍳</button>
                    {canDo(profile?.role, 'canEdit') && <button style={S.btnEdit} onClick={() => openEdit(dish)}>✏</button>}
                    {canDo(profile?.role, 'canDelete') && <button style={S.btnDanger} onClick={() => setConfirmDelete(dish)}>✕</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {recipeFor && <RecipeModal dish={recipeFor} onClose={() => setRecipeFor(null)} businessId={profile?.business_id} />}

      {showModal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={S.modalBox}>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1a1a18', marginBottom: '1.5rem' }}>{editing ? '✏ Modifier le plat' : '+ Nouveau plat'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div><label style={S.label}>Nom (français) *</label><input style={S.input} placeholder="Méchoui d'agneau" value={form.name_fr} onChange={e => setForm(f => ({ ...f, name_fr: e.target.value }))} /></div>
              <div><label style={S.label}>Nom en arabe</label><input style={{ ...S.input, direction: 'rtl' }} placeholder="مشوي الخروف" value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ ...S.label, marginBottom: 0 }}>Catégorie</label>
                  <button type="button" onClick={() => setShowCatManager(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '0 2px', color: '#6b6b66' }} title="Gérer les catégories">⚙️</button>
                </div>
                <CategorySelect
                  value={form.category}
                  onChange={val => setForm(f => ({ ...f, category: val }))}
                  categories={categories}
                  onAdd={handleAddCategory}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  canCreate={canDo(profile?.role, 'canCreate')}
                  canEdit={canDo(profile?.role, 'canEdit')}
                  canDelete={canDo(profile?.role, 'canDelete')}
                />
              </div>
              <div>
                <label style={S.label}>Statut</label>
                <select style={S.select} value={form.is_active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                  <option value="true">✓ Actif</option><option value="false">✕ Inactif</option>
                </select>
              </div>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
              <label style={{ ...S.label, color: '#166534', fontWeight: '600' }}>📐 Portions par unité *</label>
              <input type="number" min="1" value={form.serves_per_unit} onChange={e => setForm(f => ({ ...f, serves_per_unit: e.target.value }))}
                style={{ ...S.input, fontSize: '1.1rem', fontWeight: '700', textAlign: 'center', maxWidth: '120px' }} />
              <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '8px' }}>{catHint ? `${catHint.icon} ${catHint.example}` : '👉 Ex: agneau pour 8 → entrez 8'}</div>
              {form.serves_per_unit && <div style={{ marginTop: '8px', background: '#dcfce7', borderRadius: '6px', padding: '6px 10px', fontSize: '0.82rem', color: '#166534' }}>✓ Pour 100 personnes (marge 10%) → <strong>{Math.ceil(110 / (parseInt(form.serves_per_unit) || 1))} unité(s)</strong></div>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div><label style={S.label}>Prix / unité (MAD)</label><input type="number" min="0" step="0.01" style={S.input} placeholder="350" value={form.price_per_unit} onChange={e => setForm(f => ({ ...f, price_per_unit: e.target.value }))} /></div>
              <div><label style={S.label}>Description</label><input style={S.input} placeholder="Notes..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button style={{ ...S.btn, background: '#f9f8f5', color: '#6b6b66' }} onClick={closeModal}>Annuler</button>
              <button style={S.btnPrimary} onClick={handleSave} disabled={saving}>{saving ? 'Sauvegarde...' : editing ? '✓ Enregistrer' : '+ Créer'}</button>
            </div>
          </div>
        </div>
      )}

      {showCatManager && (
        <CategoryManagerModal
          categories={categories}
          onAdd={handleAddCategory}
          onEdit={handleEditCategory}
          onDelete={handleDeleteCategory}
          canCreate={canDo(profile?.role, 'canCreate')}
          canEdit={canDo(profile?.role, 'canEdit')}
          canDelete={canDo(profile?.role, 'canDelete')}
          onClose={() => setShowCatManager(false)}
        />
      )}

      {confirmDelete && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ ...S.modalBox, maxWidth: '420px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#dc2626', marginBottom: '1rem' }}>⚠ Supprimer ce plat ?</div>
            <p style={{ color: '#6b6b66', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Supprimer <strong>"{confirmDelete.name_fr}"</strong> ? Action irréversible.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button style={{ ...S.btn, background: '#f9f8f5', color: '#6b6b66' }} onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button style={{ ...S.btn, background: '#dc2626', color: '#fff' }} onClick={() => handleDelete(confirmDelete.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
      <HelpGuide />
    </div>
  )
}
