import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { canDo } from '../lib/permissions'
import HelpGuide from '../components/HelpGuide'
import { useLang } from '../context/LangContext'
import { t } from '../lib/i18n'

const STOCK_GUIDE = {
  title: 'Comment gérer votre stock',
  steps: [
    { icon: '📦', title: 'Ajoutez vos ingrédients',      description: 'Créez chaque ingrédient avec unité, prix d\'achat et stock minimum.' },
    { icon: '🔄', title: 'Enregistrez les mouvements',   description: 'Chaque achat ou utilisation met à jour le stock automatiquement.' },
    { icon: '⚠️', title: 'Alertes de stock bas',          description: 'Le dashboard vous avertit quand un ingrédient passe sous le seuil minimum.' },
    { icon: '🏪', title: 'Gérez vos fournisseurs',        description: 'Associez chaque ingrédient à un fournisseur pour les réapprovisionnements.' },
  ],
}

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
  td: { padding: '10px 12px', fontSize: '0.875rem', color: '#1a1a18', borderBottom: '1px solid #f0efeb', verticalAlign: 'middle' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' },
  statBox: { background: '#f9f8f5', borderRadius: '8px', padding: '1rem', textAlign: 'center' },
  statNum: { fontSize: '1.4rem', fontWeight: '700' },
  statLabel: { fontSize: '0.72rem', color: '#6b6b66', marginTop: '2px' },
  btn: { padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' },
  btnPrimary: { background: '#2d6a4f', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
  btnSecondary: { background: '#f0efeb', color: '#1a1a18', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' },
  btnEdit: { background: 'transparent', color: '#2d6a4f', border: '1px solid #c3e6d4', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  btnDanger: { background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  alert: { padding: '12px 16px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' },
  successAlert: { background: '#dcfce7', color: '#166534' },
  errorAlert: { background: '#fee2e2', color: '#dc2626' },
  emptyState: { textAlign: 'center', padding: '2rem', color: '#6b6b66', fontSize: '0.9rem' },
  tab: { padding: '10px 20px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', color: '#6b6b66', border: 'none', background: 'none', borderBottom: '2px solid transparent', marginBottom: '-2px' },
  tabActive: { color: '#2d6a4f', borderBottom: '2px solid #2d6a4f' },
}

const movementLabels = { purchase: 'Achat', consumption: 'Consommation', waste: 'Gaspillage', adjustment: 'Ajustement', theft_flag: 'Signalement vol' }
const movementColors = {
  purchase:    { background: '#dcfce7', color: '#166534' },
  consumption: { background: '#dbeafe', color: '#1e40af' },
  waste:       { background: '#fef9c3', color: '#854d0e' },
  adjustment:  { background: '#f3e8ff', color: '#6b21a8' },
  theft_flag:  { background: '#fee2e2', color: '#dc2626' },
}

const emptyMovForm = { ingredient_id: '', event_id: '', movement_type: 'purchase', quantity: '', reason: '' }
const emptyIngForm = { name_fr: '', name_ar: '', unit: 'kg', category: '', current_stock: '0', alert_threshold: '0' }
const emptySupForm = { name: '', contact_name: '', phone: '', email: '', city: '', specialty: '', is_active: true }

function fmt(n, decimals = 2) {
  return Number(n || 0).toLocaleString('fr-MA', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export default function Stock() {
  const { profile } = useAuth()
  const { lang } = useLang()
  const isAdmin = profile?.role === 'admin'

  const [tab, setTab] = useState('stock')
  const [ingredients, setIngredients] = useState([])
  const [movements, setMovements] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Ingredient form
  const [showIngForm, setShowIngForm] = useState(false)
  const [ingForm, setIngForm] = useState(emptyIngForm)
  const [savingIng, setSavingIng] = useState(false)
  const [ingErrors, setIngErrors] = useState({})

  // Movement form
  const [showMovForm, setShowMovForm] = useState(false)
  const [movForm, setMovForm] = useState(emptyMovForm)
  const [savingMov, setSavingMov] = useState(false)

  // Supplier form
  const [supForm, setSupForm] = useState(emptySupForm)
  const [savingSup, setSavingSup] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)

  // Ingredient edit
  const [editingIngredient, setEditingIngredient] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [savingEdit, setSavingEdit] = useState(false)

  // Filters
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState('')
  const [searchIngredient, setSearchIngredient] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [ingRes, movRes, supRes, evRes] = await Promise.all([
      // ✅ No join on suppliers — avoids 400 if FK missing
      supabase.from('ingredients').select('id, name_fr, name_ar, unit, category, current_stock, alert_threshold, price_per_unit').order('name_fr'),
      // ✅ Safe joins — only tables with confirmed FKs
      supabase.from('stock_movements').select('id, movement_type, quantity, reason, created_at, ingredient_id, event_id, ingredients(name_fr, unit), events(title)').order('created_at', { ascending: false }),
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('events').select('id, title, event_date').order('event_date', { ascending: false }),
    ])
    setIngredients(ingRes.data || [])
    setMovements(movRes.data || [])
    setSuppliers(supRes.data || [])
    setEvents(evRes.data || [])
    setLoading(false)
  }

  function showMsg(type, text) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // ── Ingredient ──────────────────────────────────────────────────────────
  function validateIngredient(f) {
    const e = {}
    if (!f.name_fr?.trim() || f.name_fr.trim().length < 2)
      e.name_fr = 'Le nom doit contenir au moins 2 caractères'
    if (!f.unit?.trim())
      e.unit = "L'unité est obligatoire"
    if (f.current_stock !== '' && Number(f.current_stock) < 0)
      e.current_stock = 'Stock ne peut pas être négatif'
    if (f.alert_threshold !== '' && Number(f.alert_threshold) < 0)
      e.alert_threshold = 'Seuil ne peut pas être négatif'
    return e
  }

  async function handleAddIngredient() {
    const e = validateIngredient(ingForm)
    if (Object.keys(e).length > 0) { setIngErrors(e); return }
    setIngErrors({})
    setSavingIng(true)
    const { error } = await supabase.from('ingredients').insert({
      name_fr: ingForm.name_fr.trim(),
      name_ar: ingForm.name_ar.trim() || null,
      unit: ingForm.unit,
      category: ingForm.category.trim() || null,
      current_stock: parseFloat(ingForm.current_stock) || 0,
      alert_threshold: parseFloat(ingForm.alert_threshold) || 0,
      business_id: profile?.business_id,
    })
    if (error) showMsg('error', 'Erreur: ' + error.message)
    else { showMsg('success', '✓ Ingrédient ajouté.'); setIngForm(emptyIngForm); setShowIngForm(false); await loadAll() }
    setSavingIng(false)
  }

  async function handleSaveIngredient() {
    if (!editingIngredient) return
    setSavingEdit(true)
    const { error } = await supabase.from('ingredients').update({
      name_fr: editForm.name,
      name_ar: editForm.name_ar || null,
      category: editForm.category || null,
      unit: editForm.unit,
      current_stock: parseFloat(editForm.stock_actuel) || 0,
      alert_threshold: parseFloat(editForm.seuil_alerte) || 0,
      price_per_unit: parseFloat(editForm.price_per_unit) || 0,
    }).eq('id', editingIngredient.id)
    if (error) showMsg('error', 'Erreur: ' + error.message)
    else { showMsg('success', '✓ Ingrédient mis à jour.'); setEditingIngredient(null); await loadAll() }
    setSavingEdit(false)
  }

  // ── Movement ────────────────────────────────────────────────────────────
  async function handleAddMovement() {
    if (!movForm.ingredient_id || !movForm.quantity || parseFloat(movForm.quantity) <= 0) {
      showMsg('error', 'Sélectionnez un ingrédient et entrez une quantité valide.'); return
    }
    setSavingMov(true)
    const { error } = await supabase.from('stock_movements').insert({
      ingredient_id: movForm.ingredient_id,
      user_id: profile.id,
      event_id: movForm.event_id || null,
      movement_type: movForm.movement_type,
      quantity: parseFloat(movForm.quantity),
      reason: movForm.reason || null,
      business_id: profile?.business_id,
    })
    if (error) showMsg('error', 'Erreur: ' + error.message)
    else { showMsg('success', '✓ Mouvement enregistré.'); setMovForm(emptyMovForm); setShowMovForm(false); await loadAll() }
    setSavingMov(false)
  }

  async function handleDeleteMov(id) {
    await supabase.from('stock_movements').delete().eq('id', id)
    setMovements(prev => prev.filter(m => m.id !== id))
    setConfirmDelete(null)
    showMsg('success', '✓ Mouvement supprimé.')
  }

  // ── Supplier ────────────────────────────────────────────────────────────
  async function handleAddSupplier() {
    if (!supForm.name.trim()) { showMsg('error', "Le nom du fournisseur est obligatoire."); return }
    setSavingSup(true)
    const payload = {
      name: supForm.name.trim(),
      contact_name: supForm.contact_name.trim() || null,
      phone: supForm.phone.trim() || null,
      email: supForm.email.trim() || null,
      city: supForm.city.trim() || null,
      specialty: supForm.specialty.trim() || null,
      is_active: supForm.is_active,
    }
    const { error } = editingSupplier
      ? await supabase.from('suppliers').update(payload).eq('id', editingSupplier.id)
      : await supabase.from('suppliers').insert({ ...payload, business_id: profile?.business_id })

    if (error) showMsg('error', 'Erreur: ' + error.message)
    else {
      showMsg('success', editingSupplier ? '✓ Fournisseur modifié.' : '✓ Fournisseur ajouté.')
      setSupForm(emptySupForm)
      setEditingSupplier(null)
      await loadAll()
    }
    setSavingSup(false)
  }

  function startEditSupplier(s) {
    setEditingSupplier(s)
    setSupForm({ name: s.name || '', contact_name: s.contact_name || '', phone: s.phone || '', email: s.email || '', city: s.city || '', specialty: s.specialty || '', is_active: s.is_active !== false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEditSupplier() {
    setEditingSupplier(null)
    setSupForm(emptySupForm)
  }

  async function handleDeleteSupplier(id) {
    await supabase.from('suppliers').delete().eq('id', id)
    setSuppliers(prev => prev.filter(s => s.id !== id))
    setConfirmDelete(null)
    showMsg('success', '✓ Fournisseur supprimé.')
  }

  // ── Derived ─────────────────────────────────────────────────────────────
  const categories = [...new Set(ingredients.map(i => i.category).filter(Boolean))]
  const filteredIng = ingredients.filter(i => {
    if (filterCategory && i.category !== filterCategory) return false
    if (searchIngredient && !i.name_fr.toLowerCase().includes(searchIngredient.toLowerCase())) return false
    return true
  })
  const filteredMov = movements.filter(m => !filterType || m.movement_type === filterType)
  const alertItems = ingredients.filter(i => Number(i.current_stock) <= Number(i.alert_threshold))

  return (
    <div style={S.page}>
      <h1 style={S.title}>📦 Stock & Approvisionnement</h1>
      <p style={S.subtitle}>Suivez vos stocks, enregistrez les mouvements et gérez vos fournisseurs.</p>

      {message && <div style={{ ...S.alert, ...(message.type === 'success' ? S.successAlert : S.errorAlert) }}>{message.text}</div>}

      {/* KPIs */}
      <div style={S.grid4}>
        <div style={S.statBox}><div style={{ ...S.statNum, color: '#2d6a4f' }}>{ingredients.length}</div><div style={S.statLabel}>Ingrédients</div></div>
        <div style={S.statBox}><div style={{ ...S.statNum, color: alertItems.length > 0 ? '#dc2626' : '#166534' }}>{alertItems.length}</div><div style={S.statLabel}>Stocks bas ⚠</div></div>
        <div style={S.statBox}><div style={{ ...S.statNum, color: '#1d4ed8' }}>{suppliers.filter(s => s.is_active).length}</div><div style={S.statLabel}>Fournisseurs actifs</div></div>
        <div style={S.statBox}><div style={{ ...S.statNum, color: '#6b6b66' }}>{movements.length}</div><div style={S.statLabel}>Mouvements</div></div>
      </div>

      {alertItems.length > 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '1rem', marginTop: '1rem' }}>
          <div style={{ fontWeight: '600', color: '#c2410c', marginBottom: '0.5rem' }}>⚠ {alertItems.length} ingrédient(s) en stock bas</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {alertItems.map(i => (
              <span key={i.id} style={{ background: '#fee2e2', color: '#dc2626', padding: '3px 10px', borderRadius: '99px', fontSize: '0.78rem', fontWeight: '600' }}>
                {i.name_fr} ({fmt(i.current_stock, 0)} {i.unit})
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ ...S.card, marginTop: '1.5rem' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e4e0', marginBottom: '1.5rem' }}>
          {[
            { key: 'stock', label: `📦 Stock (${ingredients.length})` },
            { key: 'mouvements', label: `🔄 Mouvements (${movements.length})` },
            { key: 'fournisseurs', label: `🏪 Fournisseurs (${suppliers.length})` },
          ].map(t => (
            <button key={t.key} style={{ ...S.tab, ...(tab === t.key ? S.tabActive : {}) }} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>

        {loading ? <div style={S.emptyState}>{t(lang,'loading')}</div> : (

          // ══════════════════════════════════════
          // TAB: STOCK
          // ══════════════════════════════════════
          tab === 'stock' ? (
            <div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={S.label}>Rechercher</label>
                  <input style={S.input} placeholder="Nom de l'ingrédient..." value={searchIngredient} onChange={e => setSearchIngredient(e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={S.label}>Catégorie</label>
                  <select style={S.select} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="">Toutes</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {canDo(profile?.role, 'canCreate') && (
                  <button style={{ ...S.btnPrimary, whiteSpace: 'nowrap' }} onClick={() => { setShowIngForm(v => !v); setIngForm(emptyIngForm) }}>
                    {showIngForm ? '✕ Annuler' : '+ Nouvel ingrédient'}
                  </button>
                )}
              </div>

              {showIngForm && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontWeight: '600', color: '#166534', marginBottom: '1rem' }}>Nouvel ingrédient</div>
                  <div style={S.grid2}>
                    <div>
                      <label style={S.label}>Nom français *</label>
                      <input style={{ ...S.input, ...(ingErrors.name_fr ? { borderColor: '#c0392b' } : {}) }} placeholder="ex: Agneau épaule" value={ingForm.name_fr} onChange={ev => { setIngForm(f => ({ ...f, name_fr: ev.target.value })); setIngErrors(e => ({ ...e, name_fr: '' })) }} />
                      {ingErrors.name_fr && <span style={{ color: '#c0392b', fontSize: 11, marginTop: 3, display: 'block' }}>{ingErrors.name_fr}</span>}
                    </div>
                    <div><label style={S.label}>Nom arabe</label><input style={{ ...S.input, direction: 'rtl' }} placeholder="كتف الخروف" value={ingForm.name_ar} onChange={e => setIngForm(f => ({ ...f, name_ar: e.target.value }))} /></div>
                  </div>
                  <div style={{ ...S.grid3, marginTop: '1rem' }}>
                    <div>
                      <label style={S.label}>Unité</label>
                      <select style={{ ...S.select, ...(ingErrors.unit ? { borderColor: '#c0392b' } : {}) }} value={ingForm.unit} onChange={ev => { setIngForm(f => ({ ...f, unit: ev.target.value })); setIngErrors(e => ({ ...e, unit: '' })) }}>
                        {['kg','g','L','ml','pcs','boite','sachet'].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      {ingErrors.unit && <span style={{ color: '#c0392b', fontSize: 11, marginTop: 3, display: 'block' }}>{ingErrors.unit}</span>}
                    </div>
                    <div>
                      <label style={S.label}>Catégorie</label>
                      <input style={S.input} placeholder="ex: Viande, Épicerie..." value={ingForm.category} onChange={e => setIngForm(f => ({ ...f, category: e.target.value }))} list="cat-ing-list" />
                      <datalist id="cat-ing-list">{['Viande','Poisson','Légumes','Épicerie','Pâtisserie','Boisson'].map(c => <option key={c} value={c} />)}</datalist>
                    </div>
                    <div>
                      <label style={S.label}>Stock actuel</label>
                      <input type="number" min="0" step="0.01" style={{ ...S.input, ...(ingErrors.current_stock ? { borderColor: '#c0392b' } : {}) }} value={ingForm.current_stock} onChange={ev => { setIngForm(f => ({ ...f, current_stock: ev.target.value })); setIngErrors(e => ({ ...e, current_stock: '' })) }} />
                      {ingErrors.current_stock && <span style={{ color: '#c0392b', fontSize: 11, marginTop: 3, display: 'block' }}>{ingErrors.current_stock}</span>}
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem', maxWidth: '220px' }}>
                    <label style={S.label}>Seuil d'alerte</label>
                    <input type="number" min="0" step="0.01" style={{ ...S.input, ...(ingErrors.alert_threshold ? { borderColor: '#c0392b' } : {}) }} value={ingForm.alert_threshold} onChange={ev => { setIngForm(f => ({ ...f, alert_threshold: ev.target.value })); setIngErrors(e => ({ ...e, alert_threshold: '' })) }} />
                    {ingErrors.alert_threshold && <span style={{ color: '#c0392b', fontSize: 11, marginTop: 3, display: 'block' }}>{ingErrors.alert_threshold}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button style={S.btnPrimary} onClick={handleAddIngredient} disabled={savingIng}>{savingIng ? 'Enregistrement...' : "✓ Ajouter l'ingrédient"}</button>
                    <button style={S.btnSecondary} onClick={() => { setShowIngForm(false); setIngForm(emptyIngForm); setIngErrors({}) }}>Annuler</button>
                  </div>
                </div>
              )}

              {filteredIng.length === 0 ? <div style={S.emptyState}>Aucun ingrédient.</div> : (
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>{t(lang,'ingredient').toUpperCase()}</th>
                      <th style={S.th}>{t(lang,'category').toUpperCase()}</th>
                      <th style={S.th}>{t(lang,'unit').toUpperCase()}</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>{t(lang,'currentStock').toUpperCase()}</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>{t(lang,'alertThreshold').toUpperCase()}</th>
                      <th style={S.th}>Statut</th>
                      <th style={S.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIng.map(ing => {
                      const isLow = Number(ing.current_stock) <= Number(ing.alert_threshold)
                      return (
                        <tr key={ing.id} style={{ background: isLow ? '#fff7ed' : 'transparent' }}>
                          <td style={S.td}>
                            <div style={{ fontWeight: '600' }}>{ing.name_fr}</div>
                            {ing.name_ar && <div style={{ fontSize: '0.78rem', color: '#6b6b66', direction: 'rtl' }}>{ing.name_ar}</div>}
                          </td>
                          <td style={S.td}>{ing.category ? <span style={{ ...S.badge, background: '#f0efeb', color: '#6b6b66' }}>{ing.category}</span> : '—'}</td>
                          <td style={{ ...S.td, color: '#6b6b66' }}>{ing.unit}</td>
                          <td style={{ ...S.td, textAlign: 'right', fontWeight: '700', color: isLow ? '#dc2626' : '#166534', fontSize: '1rem' }}>{fmt(ing.current_stock, 1)}</td>
                          <td style={{ ...S.td, textAlign: 'right', color: '#6b6b66' }}>{fmt(ing.alert_threshold, 1)}</td>
                          <td style={S.td}>
                            {isLow
                              ? <span style={{ ...S.badge, background: '#fee2e2', color: '#dc2626' }}>⚠ Stock bas</span>
                              : <span style={{ ...S.badge, background: '#dcfce7', color: '#166534' }}>✓ OK</span>}
                          </td>
                          <td style={S.td}>
                            {canDo(profile?.role, 'canEdit') && (
                              <button style={S.btnEdit} onClick={() => {
                                setEditingIngredient(ing)
                                setEditForm({ name: ing.name_fr, name_ar: ing.name_ar || '', category: ing.category || '', unit: ing.unit, stock_actuel: ing.current_stock, seuil_alerte: ing.alert_threshold, price_per_unit: ing.price_per_unit || '' })
                              }}>✏️ Modifier</button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

          // ══════════════════════════════════════
          // TAB: MOUVEMENTS
          // ══════════════════════════════════════
          ) : tab === 'mouvements' ? (
            <div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label style={S.label}>Type</label>
                  <select style={S.select} value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="">Tous les types</option>
                    {Object.entries(movementLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                {canDo(profile?.role, 'canCreate') && (
                  <button style={{ ...S.btnPrimary, whiteSpace: 'nowrap' }} onClick={() => setShowMovForm(v => !v)}>
                    {showMovForm ? '✕ Annuler' : '+ Nouveau mouvement'}
                  </button>
                )}
              </div>

              {showMovForm && (
                <div style={{ background: '#f9f8f5', border: '1px solid #e5e4e0', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontWeight: '600', marginBottom: '1rem' }}>Enregistrer un mouvement</div>
                  <div style={S.grid2}>
                    <div>
                      <label style={S.label}>Ingrédient *</label>
                      <select style={S.select} value={movForm.ingredient_id} onChange={e => setMovForm(f => ({ ...f, ingredient_id: e.target.value }))}>
                        <option value="">-- Choisir --</option>
                        {ingredients.map(i => <option key={i.id} value={i.id}>{i.name_fr} ({fmt(i.current_stock, 1)} {i.unit})</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>Type *</label>
                      <select style={S.select} value={movForm.movement_type} onChange={e => setMovForm(f => ({ ...f, movement_type: e.target.value }))}>
                        {Object.entries(movementLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ ...S.grid2, marginTop: '1rem' }}>
                    <div>
                      <label style={S.label}>Quantité *</label>
                      <input type="number" min="0" step="0.01" style={S.input} placeholder="ex: 10" value={movForm.quantity} onChange={e => setMovForm(f => ({ ...f, quantity: e.target.value }))} />
                    </div>
                    <div>
                      <label style={S.label}>Événement associé</label>
                      <select style={S.select} value={movForm.event_id} onChange={e => setMovForm(f => ({ ...f, event_id: e.target.value }))}>
                        <option value="">-- Aucun --</option>
                        {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <label style={S.label}>Raison / Note</label>
                    <textarea style={S.textarea} placeholder="Ex: Livraison fournisseur..." value={movForm.reason} onChange={e => setMovForm(f => ({ ...f, reason: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button style={S.btnPrimary} onClick={handleAddMovement} disabled={savingMov}>{savingMov ? 'Enregistrement...' : '✓ Enregistrer'}</button>
                    <button style={S.btnSecondary} onClick={() => { setShowMovForm(false); setMovForm(emptyMovForm) }}>Annuler</button>
                  </div>
                </div>
              )}

              {filteredMov.length === 0 ? <div style={S.emptyState}>Aucun mouvement enregistré.</div> : (
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Date</th>
                      <th style={S.th}>Ingrédient</th>
                      <th style={S.th}>Type</th>
                      <th style={{ ...S.th, textAlign: 'right' }}>Quantité</th>
                      <th style={S.th}>Événement</th>
                      <th style={S.th}>Raison</th>
                      {canDo(profile?.role, 'canDelete') && <th style={S.th}></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMov.map(m => (
                      <tr key={m.id} style={{ background: m.movement_type === 'theft_flag' ? '#fff5f5' : 'transparent' }}>
                        <td style={{ ...S.td, fontSize: '0.82rem' }}>{m.created_at ? new Date(m.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                        <td style={S.td}>
                          <div style={{ fontWeight: '600' }}>{m.ingredients?.name_fr || '—'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b6b66' }}>{m.ingredients?.unit || ''}</div>
                        </td>
                        <td style={S.td}>
                          <span style={{ ...S.badge, ...(movementColors[m.movement_type] || { background: '#f0efeb', color: '#6b6b66' }) }}>
                            {movementLabels[m.movement_type] || m.movement_type}
                          </span>
                        </td>
                        <td style={{ ...S.td, textAlign: 'right', fontWeight: '700', color: ['purchase', 'adjustment'].includes(m.movement_type) ? '#166534' : '#dc2626', fontSize: '1rem' }}>
                          {['purchase', 'adjustment'].includes(m.movement_type) ? '+' : '-'}{fmt(m.quantity, 1)}
                        </td>
                        <td style={{ ...S.td, fontSize: '0.82rem', color: '#6b6b66' }}>{m.events?.title || '—'}</td>
                        <td style={{ ...S.td, fontSize: '0.8rem', color: '#6b6b66' }}>{m.reason || '—'}</td>
                        {canDo(profile?.role, 'canDelete') && <td style={S.td}><button style={S.btnDanger} onClick={() => setConfirmDelete({ type: 'movement', ...m })}>✕</button></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          // ══════════════════════════════════════
          // TAB: FOURNISSEURS
          // ══════════════════════════════════════
          ) : (
            <div>
              {/* ✅ Supplier add/edit form — always visible at top */}
              <div style={{ background: editingSupplier ? '#eff6ff' : '#f0fdf4', border: `1px solid ${editingSupplier ? '#bfdbfe' : '#bbf7d0'}`, borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: '600', color: editingSupplier ? '#1d4ed8' : '#166534', marginBottom: '1rem', fontSize: '0.95rem' }}>
                  {editingSupplier ? '✏ Modifier le fournisseur' : '+ Nouveau fournisseur'}
                </div>

                {/* Row 1 */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={S.label}>NOM ENTREPRISE *</label>
                    <input style={S.input} placeholder="Ex: Boucherie El Habib" value={supForm.name} onChange={e => setSupForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>CONTACT (NOM)</label>
                    <input style={S.input} placeholder="Ex: Mohamed Alami" value={supForm.contact_name} onChange={e => setSupForm(f => ({ ...f, contact_name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>TÉLÉPHONE</label>
                    <input style={S.input} placeholder="06XX XXX XXX" value={supForm.phone} onChange={e => setSupForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>EMAIL</label>
                    <input type="email" style={S.input} placeholder="contact@..." value={supForm.email} onChange={e => setSupForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>VILLE</label>
                    <input style={S.input} placeholder="Ex: Agadir" value={supForm.city} onChange={e => setSupForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                </div>

                {/* Row 2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div>
                    <label style={S.label}>SPÉCIALITÉ</label>
                    <input style={S.input} placeholder="Ex: Viandes, légumes..." value={supForm.specialty} onChange={e => setSupForm(f => ({ ...f, specialty: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>STATUT</label>
                    <select style={S.select} value={supForm.is_active ? 'true' : 'false'} onChange={e => setSupForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                      <option value="true">✅ Actif</option>
                      <option value="false">❌ Inactif</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={{ ...S.btnPrimary, flex: 1 }} onClick={handleAddSupplier} disabled={savingSup}>
                      {savingSup ? '...' : editingSupplier ? '✓ Modifier' : 'Ajouter'}
                    </button>
                    {editingSupplier && (
                      <button style={{ ...S.btnSecondary, padding: '10px 12px' }} onClick={cancelEditSupplier}>✕</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Supplier table */}
              {suppliers.length === 0 ? <div style={S.emptyState}>Aucun fournisseur. Ajoutez-en un ci-dessus.</div> : (
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Nom</th>
                      <th style={S.th}>Contact</th>
                      <th style={S.th}>Téléphone</th>
                      <th style={S.th}>Ville</th>
                      <th style={S.th}>Spécialité</th>
                      <th style={S.th}>Statut</th>
                      <th style={S.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map(s => (
                      <tr key={s.id} style={{ opacity: s.is_active ? 1 : 0.55, background: editingSupplier?.id === s.id ? '#eff6ff' : 'transparent' }}>
                        <td style={S.td}><div style={{ fontWeight: '600' }}>{s.name}</div></td>
                        <td style={{ ...S.td, color: '#6b6b66' }}>{s.contact_name || '—'}</td>
                        <td style={S.td}>{s.phone ? <a href={`tel:${s.phone}`} style={{ color: '#2d6a4f', textDecoration: 'none', fontWeight: '500' }}>{s.phone}</a> : '—'}</td>
                        <td style={{ ...S.td, color: '#6b6b66' }}>{s.city || '—'}</td>
                        <td style={S.td}>{s.specialty ? <span style={{ ...S.badge, background: '#f0efeb', color: '#6b6b66' }}>{s.specialty}</span> : '—'}</td>
                        <td style={S.td}>
                          <span style={{ ...S.badge, ...(s.is_active ? { background: '#dcfce7', color: '#166534' } : { background: '#f0efeb', color: '#6b6b66' }) }}>
                            {s.is_active ? '✅ Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td style={S.td}>
                          {canDo(profile?.role, 'canEdit') && <button style={S.btnEdit} onClick={() => startEditSupplier(s)}>✏</button>}
                          {canDo(profile?.role, 'canDelete') && <button style={S.btnDanger} onClick={() => setConfirmDelete({ type: 'supplier', ...s })}>✕</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )
        )}
      </div>

      {/* Edit Ingredient Modal */}
      {editingIngredient && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '540px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1a1a18', marginBottom: '1.5rem' }}>✏️ Modifier l'ingrédient</div>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Nom français *</label>
                <input style={S.input} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>Nom arabe</label>
                <input style={{ ...S.input, direction: 'rtl' }} value={editForm.name_ar} onChange={e => setEditForm(f => ({ ...f, name_ar: e.target.value }))} />
              </div>
            </div>
            <div style={{ ...S.grid3, marginTop: '1rem' }}>
              <div>
                <label style={S.label}>Catégorie</label>
                <input style={S.input} value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>Unité</label>
                <select style={S.select} value={editForm.unit} onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))}>
                  {['kg','g','L','ml','pcs','boite','sachet'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Prix/unité (MAD)</label>
                <input type="number" min="0" step="0.01" style={S.input} value={editForm.price_per_unit} onChange={e => setEditForm(f => ({ ...f, price_per_unit: e.target.value }))} />
              </div>
            </div>
            <div style={{ ...S.grid2, marginTop: '1rem' }}>
              <div>
                <label style={S.label}>Stock actuel</label>
                <input type="number" min="0" step="0.01" style={S.input} value={editForm.stock_actuel} onChange={e => setEditForm(f => ({ ...f, stock_actuel: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>Seuil d'alerte</label>
                <input type="number" min="0" step="0.01" style={S.input} value={editForm.seuil_alerte} onChange={e => setEditForm(f => ({ ...f, seuil_alerte: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button style={{ ...S.btn, background: '#f9f8f5', color: '#6b6b66' }} onClick={() => setEditingIngredient(null)}>Annuler</button>
              <button style={S.btnPrimary} onClick={handleSaveIngredient} disabled={savingEdit}>
                {savingEdit ? 'Enregistrement...' : '✓ Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', width: '400px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#dc2626', marginBottom: '1rem' }}>⚠ Confirmer la suppression</div>
            <p style={{ color: '#6b6b66', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {confirmDelete.type === 'supplier'
                ? <>Supprimer le fournisseur <strong>"{confirmDelete.name}"</strong> ?</>
                : <>Supprimer le mouvement <strong>{movementLabels[confirmDelete.movement_type]}</strong> de <strong>{fmt(confirmDelete.quantity, 1)}</strong> — {confirmDelete.ingredients?.name_fr} ?</>}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button style={{ ...S.btn, background: '#f9f8f5', color: '#6b6b66' }} onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button style={{ ...S.btn, background: '#dc2626', color: '#fff' }} onClick={() => confirmDelete.type === 'supplier' ? handleDeleteSupplier(confirmDelete.id) : handleDeleteMov(confirmDelete.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
      <HelpGuide />
    </div>
  )
}
