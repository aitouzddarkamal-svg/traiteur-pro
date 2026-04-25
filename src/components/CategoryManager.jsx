import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { canDo } from '../lib/permissions';

const PRESET_COLORS = [
  '#6b21a8', '#14532d', '#7c2d12', '#1e3a8a',
  '#854d0e', '#0f6e56', '#be185d', '#555555',
];

const S = {
  overlay:    { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal:      { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:      { fontSize: 16, fontWeight: 600, color: '#1a1a1a', margin: 0 },
  closeBtn:   { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888', lineHeight: 1 },
  catRow:     { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f0f0f0' },
  colorDot:   { width: 14, height: 14, borderRadius: '50%', flexShrink: 0 },
  catName:    { flex: 1, fontSize: 13, fontWeight: 500, color: '#1a1a1a' },
  catAr:      { fontSize: 12, color: '#888', direction: 'rtl' },
  actionBtns: { display: 'flex', gap: 6 },
  btnEdit:    { background: 'transparent', color: '#555', border: '1px solid #ddd', borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer' },
  btnDel:     { background: 'transparent', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer' },
  divider:    { height: 1, background: '#f0f0f0', margin: '16px 0' },
  formTitle:  { fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 12 },
  formRow:    { marginBottom: 12 },
  label:      { fontSize: 12, color: '#555', marginBottom: 4, display: 'block' },
  input:      { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  colorGrid:  { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  colorChip:  (color, selected) => ({ width: 28, height: 28, borderRadius: '50%', background: color, cursor: 'pointer', border: selected ? '3px solid #1a1a1a' : '3px solid transparent', flexShrink: 0 }),
  row2:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  saveBtn:    { background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer', fontWeight: 500 },
  cancelBtn:  { background: 'transparent', color: '#555', border: '1px solid #ddd', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' },
  footer:     { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  empty:      { textAlign: 'center', padding: '20px', color: '#aaa', fontSize: 13 },
  addBtn:     { background: 'transparent', color: '#2d6a4f', border: '1px dashed #2d6a4f', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', width: '100%', marginTop: 8 },
};

export default function CategoryManager({ module, onClose, onUpdate }) {
  const { profile } = useAuth();
  const canCreate = canDo(profile?.role, 'canCreate');
  const canDelete = canDo(profile?.role, 'canDelete');

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [form, setForm] = useState({ name: '', name_ar: '', color: '#6b21a8' });

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    setLoading(true);
    const { data } = await supabase
      .from('item_categories')
      .select('*')
      .eq('business_id', profile.business_id)
      .eq('module', module)
      .eq('is_active', true)
      .order('sort_order')
      .order('name');
    setCategories(data || []);
    setLoading(false);
  }

  function openForm(cat = null) {
    if (cat) {
      setEditingCat(cat);
      setForm({ name: cat.name, name_ar: cat.name_ar || '', color: cat.color || '#6b21a8' });
    } else {
      setEditingCat(null);
      setForm({ name: '', name_ar: '', color: '#6b21a8' });
    }
    setShowForm(true);
  }

  async function saveCategory() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      business_id: profile.business_id,
      module,
      name: form.name.trim(),
      name_ar: form.name_ar.trim(),
      color: form.color,
      sort_order: editingCat ? editingCat.sort_order : categories.length + 1,
    };
    if (editingCat) {
      await supabase.from('item_categories').update(payload).eq('id', editingCat.id);
    } else {
      await supabase.from('item_categories').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    setEditingCat(null);
    await loadCategories();
    if (onUpdate) onUpdate();
  }

  async function deleteCategory(cat) {
    if (!window.confirm(`Supprimer la catégorie "${cat.name}" ?`)) return;
    await supabase.from('item_categories').update({ is_active: false }).eq('id', cat.id);
    await loadCategories();
    if (onUpdate) onUpdate();
  }

  const moduleLabel = module === 'rental' ? 'Art de la Table' : 'Pâtisserie';

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.header}>
          <p style={S.title}>Catégories — {moduleLabel}</p>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <p style={{ color: '#888', fontSize: 13 }}>Chargement...</p>
        ) : categories.length === 0 ? (
          <div style={S.empty}>Aucune catégorie — ajoutez-en une ci-dessous</div>
        ) : (
          categories.map(cat => (
            <div key={cat.id} style={S.catRow}>
              <div style={{ ...S.colorDot, background: cat.color }} />
              <div style={{ flex: 1 }}>
                <div style={S.catName}>{cat.name}</div>
                {cat.name_ar && <div style={S.catAr}>{cat.name_ar}</div>}
              </div>
              <div style={S.actionBtns}>
                {canCreate && <button style={S.btnEdit} onClick={() => openForm(cat)}>✏️</button>}
                {canDelete && <button style={S.btnDel} onClick={() => deleteCategory(cat)}>✕</button>}
              </div>
            </div>
          ))
        )}

        {canCreate && !showForm && (
          <button style={S.addBtn} onClick={() => openForm()}>+ Nouvelle catégorie</button>
        )}

        {showForm && (
          <>
            <div style={S.divider} />
            <p style={S.formTitle}>{editingCat ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</p>
            <div style={S.row2}>
              <div style={S.formRow}>
                <label style={S.label}>Nom (français) *</label>
                <input style={S.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Cérémonie" autoFocus />
              </div>
              <div style={S.formRow}>
                <label style={S.label}>Nom en arabe</label>
                <input style={{ ...S.input, direction: 'rtl', textAlign: 'right' }} value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="حفل" />
              </div>
            </div>
            <div style={S.formRow}>
              <label style={S.label}>Couleur</label>
              <div style={S.colorGrid}>
                {PRESET_COLORS.map(c => (
                  <div key={c} style={S.colorChip(c, form.color === c)} onClick={() => setForm(f => ({ ...f, color: c }))} />
                ))}
              </div>
            </div>
            <div style={S.footer}>
              <button style={S.cancelBtn} onClick={() => { setShowForm(false); setEditingCat(null); }}>Annuler</button>
              <button style={S.saveBtn} onClick={saveCategory} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
