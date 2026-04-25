import { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import DateInput from '../components/DateInput';
import { canDo } from '../lib/permissions';

/* ═══════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════ */
const styles = `
  .compta-wrapper {
    padding: 24px;
    font-family: 'Segoe UI', sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
    color: #1a1d2e;
  }
  .compta-header {
    display: flex; align-items: center;
    justify-content: space-between;
    margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
  }
  .compta-title {
    font-size: 22px; font-weight: 700; color: #1a1d2e;
    display: flex; align-items: center; gap: 10px;
  }
  .compta-title span.icon {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    border-radius: 10px; display: flex; align-items: center;
    justify-content: center; font-size: 18px; color: white;
  }
  .compta-tabs {
    display: flex; gap: 4px; background: #e8eaf2;
    border-radius: 12px; padding: 4px;
    margin-bottom: 24px; overflow-x: auto;
  }
  .compta-tab {
    flex: 1; min-width: 130px; padding: 10px 14px;
    border: none; background: transparent; border-radius: 9px;
    font-size: 13px; font-weight: 500; color: #6b7280;
    cursor: pointer; display: flex; align-items: center;
    justify-content: center; gap: 6px;
    white-space: nowrap; transition: all 0.2s ease;
  }
  .compta-tab:hover { color: #2563eb; background: #dde3f5; }
  .compta-tab.active {
    background: #fff; color: #2563eb; font-weight: 600;
    box-shadow: 0 1px 6px rgba(0,0,0,0.1);
  }
  .kpi-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 16px; margin-bottom: 24px;
  }
  .kpi-card {
    background: #fff; border-radius: 14px; padding: 20px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #eef0f7;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.09); }
  .kpi-card .kpi-label { font-size: 12px; color: #9ca3af; font-weight: 500; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
  .kpi-card .kpi-value { font-size: 24px; font-weight: 700; line-height: 1; }
  .kpi-card .kpi-sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
  .kpi-card.green { border-left: 4px solid #10b981; }
  .kpi-card.red   { border-left: 4px solid #ef4444; }
  .kpi-card.blue  { border-left: 4px solid #2563eb; }
  .kpi-card.orange{ border-left: 4px solid #f59e0b; }
  .kpi-card.purple{ border-left: 4px solid #8b5cf6; }
  .compta-panel {
    background: #fff; border-radius: 14px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    border: 1px solid #eef0f7; overflow: hidden; margin-bottom: 20px;
  }
  .panel-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 20px; border-bottom: 1px solid #f0f2f9;
    flex-wrap: wrap; gap: 10px;
  }
  .panel-head h3 { font-size: 15px; font-weight: 600; color: #1a1d2e; margin: 0; display: flex; align-items: center; gap: 8px; }
  .compta-form {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px; padding: 18px 20px;
    border-bottom: 1px solid #f0f2f9; background: #fafbff;
  }
  .form-field { display: flex; flex-direction: column; gap: 5px; }
  .form-field label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-field input, .form-field select {
    padding: 9px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px;
    font-size: 14px; color: #1a1d2e; background: #fff;
    transition: border-color 0.2s; outline: none; font-family: inherit;
  }
  .form-field input:focus, .form-field select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
  .form-actions { display: flex; align-items: flex-end; gap: 8px; }
  .btn {
    padding: 9px 18px; border-radius: 8px; border: none;
    font-size: 13px; font-weight: 600; cursor: pointer;
    display: inline-flex; align-items: center; gap: 6px;
    transition: all 0.2s; white-space: nowrap;
  }
  .btn-primary { background: #2563eb; color: #fff; }
  .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); }
  .btn-success { background: #10b981; color: #fff; }
  .btn-success:hover { background: #059669; }
  .btn-danger { background: #fef2f2; color: #ef4444; border: 1.5px solid #fecaca; }
  .btn-danger:hover { background: #ef4444; color: #fff; }
  .btn-ghost { background: #f3f4f6; color: #374151; }
  .btn-ghost:hover { background: #e5e7eb; }
  .btn-outline { background: #fff; color: #2563eb; border: 1.5px solid #2563eb; }
  .btn-outline:hover { background: #eff6ff; }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-wa {
    background: #25d366; color: #fff; text-decoration: none;
    padding: 7px 14px; border-radius: 8px; font-size: 12px;
    font-weight: 600; display: inline-flex; align-items: center;
    gap: 6px; transition: background 0.2s;
  }
  .btn-wa:hover { background: #128c7e; }
  .filter-bar {
    display: flex; gap: 10px; padding: 14px 20px;
    border-bottom: 1px solid #f0f2f9; flex-wrap: wrap; align-items: center;
  }
  .filter-bar select, .filter-bar input {
    padding: 8px 12px; border: 1.5px solid #e5e7eb;
    border-radius: 8px; font-size: 13px; color: #374151;
    background: #fff; outline: none; font-family: inherit;
  }
  .filter-bar select:focus { border-color: #2563eb; }
  .compta-table-wrap { overflow-x: auto; }
  .compta-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .compta-table thead th {
    background: #f8f9fc; padding: 11px 16px; text-align: left;
    font-size: 11px; font-weight: 700; color: #9ca3af;
    text-transform: uppercase; letter-spacing: 0.6px;
    border-bottom: 1px solid #f0f2f9; white-space: nowrap;
  }
  .compta-table tbody tr { border-bottom: 1px solid #f5f7ff; transition: background 0.15s; }
  .compta-table tbody tr:hover { background: #f8f9fc; }
  .compta-table tbody td { padding: 12px 16px; color: #374151; vertical-align: middle; }
  .badge {
    display: inline-flex; align-items: center;
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 600; white-space: nowrap;
  }
  .badge-green  { background: #d1fae5; color: #059669; }
  .badge-red    { background: #fee2e2; color: #dc2626; }
  .badge-orange { background: #fef3c7; color: #d97706; }
  .badge-blue   { background: #dbeafe; color: #2563eb; }
  .badge-gray   { background: #f3f4f6; color: #6b7280; }
  .badge-purple { background: #ede9fe; color: #7c3aed; }
  .empty-state { text-align: center; padding: 48px 20px; color: #9ca3af; font-size: 14px; }
  .empty-state .empty-icon { font-size: 40px; margin-bottom: 12px; }
  .profit-bar-wrap { padding: 20px; }
  .profit-bar-label { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; }
  .profit-bar-bg { height: 12px; background: #f0f2f9; border-radius: 6px; overflow: hidden; margin-bottom: 16px; }
  .profit-bar-fill { height: 100%; border-radius: 6px; transition: width 0.6s ease; }
  .mois-nav { display: flex; align-items: center; gap: 10px; }
  .mois-nav button {
    width: 30px; height: 30px; border-radius: 8px;
    border: 1.5px solid #e5e7eb; background: #fff; cursor: pointer;
    font-size: 16px; display: flex; align-items: center; justify-content: center;
    color: #374151; transition: all 0.15s;
  }
  .mois-nav button:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
  .mois-nav span { font-size: 14px; font-weight: 600; color: #1a1d2e; min-width: 130px; text-align: center; }
  .relance-card {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; border-bottom: 1px solid #f5f7ff;
    gap: 12px; flex-wrap: wrap; transition: background 0.15s;
  }
  .relance-card:hover { background: #fafbff; }
  .relance-client-info h4 { font-size: 14px; font-weight: 600; color: #1a1d2e; margin: 0 0 3px 0; }
  .relance-client-info p { font-size: 12px; color: #9ca3af; margin: 0; }
  .relance-amount { font-size: 18px; font-weight: 700; color: #ef4444; }
  .relance-actions { display: flex; gap: 8px; align-items: center; }
  .loading-row td { text-align: center; padding: 32px; color: #9ca3af; }

  /* ── PROFIT PER EVENT ── */
  .profit-event-card {
    border: 1.5px solid #e5e7eb; border-radius: 12px;
    overflow: hidden; margin-bottom: 14px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .profit-event-card:hover { border-color: #2563eb; box-shadow: 0 2px 12px rgba(37,99,235,0.08); }
  .profit-event-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px; background: #f8f9fc;
    cursor: pointer; gap: 12px; flex-wrap: wrap;
  }
  .profit-event-header:hover { background: #f0f4ff; }
  .profit-event-title { font-size: 14px; font-weight: 700; color: #1a1d2e; }
  .profit-event-subtitle { font-size: 12px; color: #9ca3af; margin-top: 2px; }
  .profit-event-kpis {
    display: flex; gap: 16px; align-items: center; flex-wrap: wrap;
  }
  .profit-kpi-item { text-align: right; }
  .profit-kpi-item .val { font-size: 15px; font-weight: 700; }
  .profit-kpi-item .lbl { font-size: 10px; color: #9ca3af; font-weight: 500; text-transform: uppercase; }
  .profit-event-body { padding: 16px 18px; border-top: 1px solid #f0f2f9; background: #fff; }
  .profit-breakdown {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px; margin-bottom: 16px;
  }
  .breakdown-item {
    padding: 12px 14px; border-radius: 10px;
    display: flex; align-items: center; gap: 10px;
  }
  .breakdown-item .b-icon { font-size: 22px; }
  .breakdown-item .b-label { font-size: 12px; color: #6b7280; }
  .breakdown-item .b-value { font-size: 16px; font-weight: 700; }
  .breakdown-item.revenue  { background: #f0fdf4; }
  .breakdown-item.expenses { background: #fef2f2; }
  .breakdown-item.profit   { background: #eff6ff; }
  .margin-bar-wrap { margin-top: 10px; }
  .margin-bar-bg { height: 8px; background: #f0f2f9; border-radius: 6px; overflow: hidden; }
  .margin-bar-fill { height: 100%; border-radius: 6px; transition: width 0.6s ease; }
  .exp-mini-list { margin-top: 12px; }
  .exp-mini-row {
    display: flex; justify-content: space-between;
    font-size: 12px; color: #6b7280; padding: 4px 0;
    border-bottom: 1px dashed #f0f2f9;
  }
  .exp-mini-row:last-child { border-bottom: none; }

  /* ── MODAL ── */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
    backdrop-filter: blur(4px); z-index: 1000;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .modal-box {
    background: #fff; border-radius: 18px; width: 100%; max-width: 560px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden;
    animation: modalIn 0.2s ease;
  }
  @keyframes modalIn { from { opacity:0; transform: translateY(-16px) scale(0.97); } to { opacity:1; transform: none; } }
  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px; border-bottom: 1px solid #f0f2f9;
  }
  .modal-header h3 { font-size: 16px; font-weight: 700; color: #1a1d2e; margin: 0; }
  .modal-close {
    width: 32px; height: 32px; border-radius: 8px;
    border: none; background: #f3f4f6; cursor: pointer;
    font-size: 16px; color: #6b7280;
    display: flex; align-items: center; justify-content: center; transition: all 0.15s;
  }
  .modal-close:hover { background: #fee2e2; color: #ef4444; }
  .modal-body { padding: 20px 24px; max-height: 440px; overflow-y: auto; }
  .modal-footer { padding: 16px 24px; border-top: 1px solid #f0f2f9; display: flex; gap: 10px; justify-content: flex-end; }
  .cat-add-row {
    display: grid; grid-template-columns: 56px 1fr 1fr auto;
    gap: 10px; align-items: end; margin-bottom: 20px;
    padding-bottom: 20px; border-bottom: 1px solid #f0f2f9;
  }
  .cat-list { display: flex; flex-direction: column; gap: 8px; }
  .cat-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: 10px;
    border: 1.5px solid #e5e7eb; background: #fafbff; transition: border-color 0.15s;
  }
  .cat-item:hover { border-color: #2563eb; }
  .cat-icon { font-size: 22px; width: 36px; text-align: center; flex-shrink: 0; }
  .cat-info { flex: 1; }
  .cat-info strong { font-size: 14px; color: #1a1d2e; display: block; }
  .cat-info span { font-size: 11px; color: #9ca3af; }
  .cat-actions { display: flex; gap: 6px; }
  .cat-edit-row {
    display: grid; grid-template-columns: 56px 1fr auto auto;
    gap: 8px; align-items: end; padding: 10px 14px;
    border-radius: 10px; border: 1.5px solid #2563eb; background: #eff6ff;
  }

  @media (max-width: 640px) {
    .compta-wrapper { padding: 14px; }
    .compta-tab { min-width: 100px; font-size: 11px; padding: 8px 8px; }
    .compta-form { grid-template-columns: 1fr; }
    .kpi-row { grid-template-columns: repeat(2, 1fr); }
    .profit-event-kpis { gap: 10px; }
    .cat-add-row { grid-template-columns: 56px 1fr; }
  }
`;

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DEFAULT_CATEGORIES = [
  { value: 'food',       label: 'Alimentation',      icon: '🥗' },
  { value: 'transport',  label: 'Transport',          icon: '🚗' },
  { value: 'utilities',  label: 'Services & Charges', icon: '💡' },
  { value: 'equipment',  label: 'Matériel',           icon: '🔧' },
  { value: 'marketing',  label: 'Marketing',          icon: '📣' },
  { value: 'rent',       label: 'Loyer',              icon: '🏠' },
  { value: 'other',      label: 'Autre',              icon: '📦' },
];
const PAYROLL_STATUS = [
  { value: 'pending', label: 'En attente', badge: 'badge-orange' },
  { value: 'paid',    label: 'Payé',       badge: 'badge-green'  },
  { value: 'partial', label: 'Partiel',    badge: 'badge-blue'   },
];
const fmt = (n) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); };
const statusInfo = (v) => PAYROLL_STATUS.find(s => s.value === v) || { label: v, badge: 'badge-gray' };

/* ═══════════════════════════════════════════════
   CATEGORY MODAL
═══════════════════════════════════════════════ */
function CategoryModal({ profile, onClose, onSaved }) {
  const [cats, setCats]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editId, setEditId]     = useState(null);
  const [editData, setEditData] = useState({ icon: '', label: '' });
  const [newCat, setNewCat]     = useState({ icon: '📦', label: '', value: '' });
  const [saving, setSaving]     = useState(false);

  useEffect(() => { loadCats(); }, []);

  async function loadCats() {
    setLoading(true);
    const { data } = await supabase.from('expense_categories').select('*').order('label');
    setCats(data?.length ? data : DEFAULT_CATEGORIES);
    setLoading(false);
  }

  async function addCat() {
    if (!newCat.label.trim() || !newCat.value.trim()) return;
    setSaving(true);
    await supabase.from('expense_categories').insert([{
      value: newCat.value.toLowerCase().replace(/\s+/g, '_'),
      label: newCat.label, icon: newCat.icon || '📦', user_id: profile.id,
    }]);
    setNewCat({ icon: '📦', label: '', value: '' });
    await loadCats(); setSaving(false); onSaved();
  }

  async function saveEdit() {
    if (!editData.label.trim()) return;
    setSaving(true);
    await supabase.from('expense_categories').update({ label: editData.label, icon: editData.icon }).eq('id', editId);
    setEditId(null); await loadCats(); setSaving(false); onSaved();
  }

  async function deleteCat(id) {
    if (!confirm('Supprimer cette catégorie ?')) return;
    await supabase.from('expense_categories').delete().eq('id', id);
    await loadCats(); onSaved();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>🏷️ Gérer les catégories</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>➕ Nouvelle catégorie</p>
          <div className="cat-add-row">
            <div className="form-field">
              <label>Icône</label>
              <input type="text" maxLength={2} value={newCat.icon} style={{ textAlign: 'center', fontSize: 20 }}
                onChange={e => setNewCat(f => ({ ...f, icon: e.target.value }))} />
            </div>
            <div className="form-field">
              <label>Nom</label>
              <input type="text" placeholder="Ex: Nettoyage" value={newCat.label}
                onChange={e => setNewCat(f => ({ ...f, label: e.target.value }))} />
            </div>
            <div className="form-field">
              <label>Clé</label>
              <input type="text" placeholder="Ex: cleaning" value={newCat.value}
                onChange={e => setNewCat(f => ({ ...f, value: e.target.value }))} />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary btn-sm" onClick={addCat} disabled={saving}>{saving ? '…' : 'Ajouter'}</button>
            </div>
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>📋 Catégories ({cats.length})</p>
          {loading ? <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Chargement…</div> : (
            <div className="cat-list">
              {cats.map(cat => (
                editId === cat.id ? (
                  <div key={cat.id} className="cat-edit-row">
                    <div className="form-field">
                      <label>Icône</label>
                      <input type="text" maxLength={2} value={editData.icon} style={{ textAlign: 'center', fontSize: 20 }}
                        onChange={e => setEditData(f => ({ ...f, icon: e.target.value }))} />
                    </div>
                    <div className="form-field">
                      <label>Nom</label>
                      <input type="text" value={editData.label} onChange={e => setEditData(f => ({ ...f, label: e.target.value }))} />
                    </div>
                    <div className="form-actions"><button className="btn btn-success btn-sm" onClick={saveEdit}>✓</button></div>
                    <div className="form-actions"><button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>✕</button></div>
                  </div>
                ) : (
                  <div key={cat.id || cat.value} className="cat-item">
                    <span className="cat-icon">{cat.icon}</span>
                    <div className="cat-info"><strong>{cat.label}</strong><span>clé : {cat.value}</span></div>
                    <div className="cat-actions">
                      {cat.id ? (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditId(cat.id); setEditData({ icon: cat.icon, label: cat.label }); }}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteCat(cat.id)}>🗑️</button>
                        </>
                      ) : <span className="badge badge-gray" style={{ fontSize: 10 }}>Défaut</span>}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Fermer</button></div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function Comptabilite() {
  const { profile } = useContext(AuthContext);
  const canViewFinances = canDo(profile?.role, 'canViewFinances');
  const [activeTab, setActiveTab]       = useState('dashboard');
  const [showCatModal, setShowCatModal] = useState(false);
  const [currentDate, setCurrentDate]   = useState(new Date());

  const month        = currentDate.getMonth();
  const year         = currentDate.getFullYear();
  const monthISO     = `${year}-${String(month + 1).padStart(2, '0')}`;
  const startOfMonth = `${monthISO}-01`;
  const endOfMonth   = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const [categories, setCategories]   = useState(DEFAULT_CATEGORIES);
  const [kpi, setKpi]                 = useState({ recettes: 0, depenses: 0, paie: 0, benefice: 0 });
  const [revenueByEvent, setRevenueByEvent] = useState([]);
  const [expenses, setExpenses]       = useState([]);
  const [expForm, setExpForm]         = useState({ date: '', category: '', description: '', amount: '', event_id: '' });
  const [expFilter, setExpFilter]     = useState('');
  const [expLoading, setExpLoading]   = useState(false);
  const [editingExp, setEditingExp]   = useState(null);
  const [eventsList, setEventsList]   = useState([]);
  const [payrolls, setPayrolls]       = useState([]);
  const [staffList, setStaffList]     = useState([]);
  const [payForm, setPayForm]         = useState({ staff_id: '', base_salary: '', bonuses: '0', deductions: '0', status: 'pending', payment_date: '' });
  const [payLoading, setPayLoading]   = useState(false);
  const [editingPay, setEditingPay]   = useState(null);
  const [overdueClients, setOverdueClients] = useState([]);
  const [relanceLoading, setRelanceLoading] = useState(false);

  /* ── Profit per event ── */
  const [profitEvents, setProfitEvents]     = useState([]);
  const [profitLoading, setProfitLoading]   = useState(false);
  const [expandedEvent, setExpandedEvent]   = useState(null);
  const [profitFilter, setProfitFilter]     = useState('all');

  useEffect(() => { loadCategories(); loadEventsList(); }, []);

  async function loadCategories() {
    const { data } = await supabase.from('expense_categories').select('*').order('label');
    if (data?.length) {
      setCategories(data);
      setExpForm(f => ({ ...f, category: f.category || data[0]?.value || '' }));
    }
  }

  async function loadEventsList() {
    const { data } = await supabase.from('events').select('id, client_name, event_date').order('event_date', { ascending: false }).limit(100);
    setEventsList(data || []);
  }

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  useEffect(() => {
    if (!profile?.id) return;
    if (activeTab === 'dashboard') loadDashboard();
    if (activeTab === 'depenses')  loadExpenses();
    if (activeTab === 'paie')      loadPayroll();
    if (activeTab === 'relances')  loadRelances();
    if (activeTab === 'profit')    loadProfitEvents();
  }, [activeTab, monthISO, profile?.id]);

  /* ─── DASHBOARD ─── */
  async function loadDashboard() {
    const { data: pays  } = await supabase.from('payments').select('amount').gte('payment_date', startOfMonth).lte('payment_date', endOfMonth);
    const { data: exps  } = await supabase.from('expenses').select('amount').gte('date', startOfMonth).lte('date', endOfMonth);
    const { data: pays2 } = await supabase.from('payroll').select('net_salary').eq('period', monthISO);
    const { data: events} = await supabase.from('events').select('id, client_name, event_date, total_amount').gte('event_date', startOfMonth).lte('event_date', endOfMonth).not('total_amount', 'is', null).order('event_date');
    const recettes = (pays  || []).reduce((s, p) => s + (p.amount     || 0), 0);
    const depenses = (exps  || []).reduce((s, e) => s + (e.amount     || 0), 0);
    const paie     = (pays2 || []).reduce((s, p) => s + (p.net_salary || 0), 0);
    setKpi({ recettes, depenses, paie, benefice: recettes - depenses - paie });
    setRevenueByEvent(events || []);
  }

  /* ─── EXPENSES ─── */
  async function loadExpenses() {
    setExpLoading(true);
    let q = supabase.from('expenses').select('*, events(client_name)').gte('date', startOfMonth).lte('date', endOfMonth).order('date', { ascending: false });
    if (expFilter) q = q.eq('category', expFilter);
    const { data } = await q;
    setExpenses(data || []);
    setExpLoading(false);
  }

  async function saveExpense() {
    if (!expForm.date || !expForm.amount || !expForm.description) return;
    const payload = {
      date: expForm.date, category: expForm.category,
      description: expForm.description, amount: parseFloat(expForm.amount),
      event_id: expForm.event_id || null, user_id: profile.id,
    };
    if (editingExp) await supabase.from('expenses').update(payload).eq('id', editingExp);
    else            await supabase.from('expenses').insert([{ ...payload, created_by: profile.id, business_id: profile.business_id }]);
    setExpForm({ date: '', category: categories[0]?.value || '', description: '', amount: '', event_id: '' });
    setEditingExp(null);
    loadExpenses(); loadDashboard();
  }

  function startEditExp(row) {
    setEditingExp(row.id);
    setExpForm({ date: row.date, category: row.category, description: row.description, amount: row.amount, event_id: row.event_id || '' });
  }

  async function deleteExpense(id) {
    if (!confirm('Supprimer cette dépense ?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    loadExpenses(); loadDashboard();
  }

  const catLabel = (v) => { const c = categories.find(x => x.value === v); return c ? `${c.icon} ${c.label}` : v; };

  /* ─── PAYROLL ─── */
  async function loadPayroll() {
    setPayLoading(true);
    const { data: staff } = await supabase.from('users').select('id, name').order('name');
    setStaffList(staff || []);
    const { data } = await supabase.from('payroll').select('*, users(name)').eq('period', monthISO).order('created_at', { ascending: false });
    setPayrolls(data || []);
    setPayLoading(false);
  }

  const netSalary = () => (parseFloat(payForm.base_salary) || 0) + (parseFloat(payForm.bonuses) || 0) - (parseFloat(payForm.deductions) || 0);

  async function savePayroll() {
    if (!payForm.staff_id || !payForm.base_salary) return;
    const payload = { staff_id: payForm.staff_id, period: monthISO, base_salary: parseFloat(payForm.base_salary) || 0, bonuses: parseFloat(payForm.bonuses) || 0, deductions: parseFloat(payForm.deductions) || 0, net_salary: netSalary(), status: payForm.status, payment_date: payForm.payment_date || null, user_id: profile.id };
    if (editingPay) await supabase.from('payroll').update(payload).eq('id', editingPay);
    else            await supabase.from('payroll').insert([{ ...payload, created_by: profile.id, business_id: profile.business_id }]);
    setPayForm({ staff_id: '', base_salary: '', bonuses: '0', deductions: '0', status: 'pending', payment_date: '' });
    setEditingPay(null);
    loadPayroll(); loadDashboard();
  }

  function startEditPay(row) {
    setEditingPay(row.id);
    setPayForm({ staff_id: row.staff_id, base_salary: row.base_salary, bonuses: row.bonuses, deductions: row.deductions, status: row.status, payment_date: row.payment_date || '' });
  }

  async function deletePay(id) {
    if (!confirm('Supprimer cette fiche de paie ?')) return;
    await supabase.from('payroll').delete().eq('id', id);
    loadPayroll(); loadDashboard();
  }

  async function togglePayStatus(row) {
    const next = row.status === 'paid' ? 'pending' : 'paid';
    await supabase.from('payroll').update({ status: next, ...(next === 'paid' ? { payment_date: new Date().toISOString().split('T')[0] } : {}) }).eq('id', row.id);
    loadPayroll();
  }

  /* ─── RELANCES ─── */
  async function loadRelances() {
    setRelanceLoading(true);
    const { data: events } = await supabase.from('events').select('id, client_name, client_phone, event_date, total_amount, status').neq('status', 'cancelled').order('event_date', { ascending: false });
    const { data: pays }   = await supabase.from('payments').select('event_id, amount');
    const paidByEvent = {};
    (pays || []).forEach(p => { paidByEvent[p.event_id] = (paidByEvent[p.event_id] || 0) + (p.amount || 0); });
    setOverdueClients((events || []).map(ev => ({ ...ev, paid: paidByEvent[ev.id] || 0, solde: (ev.total_amount || 0) - (paidByEvent[ev.id] || 0) })).filter(ev => ev.solde > 10));
    setRelanceLoading(false);
  }

  function buildWALink(c) {
    const phone = (c.client_phone || '').replace(/\D/g, '');
    const intl  = phone.startsWith('0') ? '212' + phone.slice(1) : phone;
    const msg   = `Bonjour ${c.client_name},\n\nNous vous contactons concernant votre événement du ${fmtDate(c.event_date)}.\nLe solde restant dû est de *${fmt(c.solde)}*.\n\nMerci de régulariser dans les meilleurs délais.\n\nCordialement,\nL'équipe Traiteur Pro`;
    return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
  }

  /* ─── PROFIT PER EVENT ─── */
  async function loadProfitEvents() {
    setProfitLoading(true);

    /* All events */
    const { data: events } = await supabase
      .from('events')
      .select('id, client_name, event_date, total_amount, status')
      .order('event_date', { ascending: false })
      .limit(50);

    /* All payments grouped by event */
    const { data: pays } = await supabase.from('payments').select('event_id, amount');
    const paidByEvent = {};
    (pays || []).forEach(p => { paidByEvent[p.event_id] = (paidByEvent[p.event_id] || 0) + (p.amount || 0); });

    /* All expenses linked to events */
    const { data: exps } = await supabase.from('expenses').select('event_id, amount, description, category, date').not('event_id', 'is', null);
    const expsByEvent = {};
    (exps || []).forEach(e => {
      if (!expsByEvent[e.event_id]) expsByEvent[e.event_id] = [];
      expsByEvent[e.event_id].push(e);
    });

    const result = (events || []).map(ev => {
      const revenue  = paidByEvent[ev.id] || 0;
      const eventExp = expsByEvent[ev.id]  || [];
      const totalExp = eventExp.reduce((s, e) => s + (e.amount || 0), 0);
      const profit   = revenue - totalExp;
      const margin   = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
      return { ...ev, revenue, expenses: totalExp, expenseItems: eventExp, profit, margin };
    });

    setProfitEvents(result);
    setProfitLoading(false);
  }

  const filteredProfitEvents = profitEvents.filter(ev => {
    if (profitFilter === 'profitable') return ev.profit > 0;
    if (profitFilter === 'loss')       return ev.profit < 0;
    return true;
  });

  const totalProfitRevenue  = filteredProfitEvents.reduce((s, e) => s + e.revenue,  0);
  const totalProfitExpenses = filteredProfitEvents.reduce((s, e) => s + e.expenses, 0);
  const totalProfit         = filteredProfitEvents.reduce((s, e) => s + e.profit,   0);
  const avgMargin           = filteredProfitEvents.length > 0
    ? Math.round(filteredProfitEvents.reduce((s, e) => s + e.margin, 0) / filteredProfitEvents.length)
    : 0;

  const profitRatio = kpi.recettes > 0 ? Math.min((kpi.benefice / kpi.recettes) * 100, 100) : 0;

  /* ═══ RENDER ═══ */
  if (!canViewFinances) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
      <p style={{ fontSize: 15, color: '#888' }}>Accès réservé — vous n'avez pas la permission de consulter la comptabilité.</p>
    </div>
  );

  return (
    <>
      <style>{styles}</style>
      {showCatModal && (
        <CategoryModal profile={profile} onClose={() => setShowCatModal(false)}
          onSaved={() => { loadCategories(); if (activeTab === 'depenses') loadExpenses(); }} />
      )}

      <div className="compta-wrapper">
        <div className="compta-header">
          <h1 className="compta-title"><span className="icon">💼</span>Comptabilité</h1>
          <div className="mois-nav">
            <button onClick={prevMonth}>‹</button>
            <span>{MONTHS_FR[month]} {year}</span>
            <button onClick={nextMonth}>›</button>
          </div>
        </div>

        <div className="compta-tabs">
          {[
            { key: 'dashboard', icon: '📊', label: 'Tableau financier' },
            { key: 'depenses',  icon: '💳', label: 'Dépenses' },
            { key: 'paie',      icon: '👷', label: 'Paie' },
            { key: 'relances',  icon: '📲', label: 'Relances' },
            { key: 'profit',    icon: '📈', label: 'Profit / Événement' },
          ].map(t => (
            <button key={t.key} className={`compta-tab${activeTab === t.key ? ' active' : ''}`} onClick={() => setActiveTab(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ══ DASHBOARD ══ */}
        {activeTab === 'dashboard' && (
          <>
            <div className="kpi-row">
              {[
                { cls: 'green',  label: '💰 Recettes du mois', value: kpi.recettes, color: '#10b981', sub: 'Paiements encaissés' },
                { cls: 'red',    label: '📦 Dépenses',         value: kpi.depenses, color: '#ef4444', sub: 'Charges opérationnelles' },
                { cls: 'orange', label: '👷 Masse salariale',  value: kpi.paie,     color: '#f59e0b', sub: 'Paie du personnel' },
                { cls: 'blue',   label: '✅ Bénéfice net',     value: kpi.benefice, color: kpi.benefice >= 0 ? '#2563eb' : '#ef4444', sub: 'Recettes − Charges' },
              ].map(k => (
                <div key={k.label} className={`kpi-card ${k.cls}`}>
                  <div className="kpi-label">{k.label}</div>
                  <div className="kpi-value" style={{ color: k.color }}>{fmt(k.value)}</div>
                  <div className="kpi-sub">{k.sub}</div>
                </div>
              ))}
            </div>
            <div className="compta-panel">
              <div className="panel-head">
                <h3>📈 Répartition des charges</h3>
                <span style={{ fontSize: 13, color: '#6b7280' }}>Marge : <b style={{ color: kpi.benefice >= 0 ? '#10b981' : '#ef4444' }}>{kpi.recettes > 0 ? Math.round((kpi.benefice / kpi.recettes) * 100) : 0}%</b></span>
              </div>
              <div className="profit-bar-wrap">
                {[
                  { label: '📦 Dépenses', value: kpi.depenses, color: '#ef4444' },
                  { label: '👷 Masse salariale', value: kpi.paie, color: '#f59e0b' },
                  { label: '✅ Bénéfice', value: kpi.benefice, color: '#10b981' },
                ].map(b => (
                  <div key={b.label}>
                    <div className="profit-bar-label"><span>{b.label}</span><span>{fmt(b.value)}</span></div>
                    <div className="profit-bar-bg">
                      <div className="profit-bar-fill" style={{ width: kpi.recettes > 0 ? `${Math.max(0, Math.min((Math.abs(b.value) / kpi.recettes) * 100, 100))}%` : '0%', background: b.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="compta-panel">
              <div className="panel-head">
                <h3>🎉 Événements du mois ({revenueByEvent.length})</h3>
                <span style={{ fontSize: 13, color: '#6b7280' }}>Total : <b>{fmt(revenueByEvent.reduce((s, e) => s + (e.total_amount || 0), 0))}</b></span>
              </div>
              <div className="compta-table-wrap">
                <table className="compta-table">
                  <thead><tr><th>Client</th><th>Date</th><th>Montant</th></tr></thead>
                  <tbody>
                    {revenueByEvent.length === 0
                      ? <tr><td colSpan={3}><div className="empty-state"><div className="empty-icon">📅</div>Aucun événement ce mois</div></td></tr>
                      : revenueByEvent.map(ev => (
                        <tr key={ev.id}>
                          <td style={{ fontWeight: 600 }}>{ev.client_name || '—'}</td>
                          <td>{fmtDate(ev.event_date)}</td>
                          <td style={{ fontWeight: 700, color: '#10b981' }}>{fmt(ev.total_amount)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ DÉPENSES ══ */}
        {activeTab === 'depenses' && (
          <div className="compta-panel">
            <div className="panel-head">
              <h3>💳 Dépenses — {MONTHS_FR[month]} {year}</h3>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>Total : {fmt(expenses.reduce((s, e) => s + (e.amount || 0), 0))}</span>
                <button className="btn btn-outline btn-sm" onClick={() => setShowCatModal(true)}>🏷️ Catégories</button>
              </div>
            </div>
            <div className="compta-form">
              <div className="form-field">
                <label>Date</label>
                <DateInput value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>Catégorie</label>
                <select value={expForm.category} onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))}>
                  {categories.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div className="form-field" style={{ flex: 2 }}>
                <label>Description</label>
                <input type="text" placeholder="Ex: Achat légumes, essence…" value={expForm.description}
                  onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>Montant (MAD)</label>
                <input type="number" placeholder="0.00" value={expForm.amount}
                  onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>Lier à un événement</label>
                <select value={expForm.event_id} onChange={e => setExpForm(f => ({ ...f, event_id: e.target.value }))}>
                  <option value="">— Aucun —</option>
                  {eventsList.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.client_name} — {fmtDate(ev.event_date)}</option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={saveExpense}>{editingExp ? '✏️ Modifier' : '➕ Ajouter'}</button>
                {editingExp && <button className="btn btn-ghost" onClick={() => { setEditingExp(null); setExpForm({ date: '', category: categories[0]?.value || '', description: '', amount: '', event_id: '' }); }}>Annuler</button>}
              </div>
            </div>
            <div className="filter-bar">
              <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Filtrer :</span>
              <select value={expFilter} onChange={e => { setExpFilter(e.target.value); setTimeout(loadExpenses, 0); }}>
                <option value="">Toutes les catégories</option>
                {categories.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div className="compta-table-wrap">
              <table className="compta-table">
                <thead><tr><th>Date</th><th>Catégorie</th><th>Description</th><th>Événement</th><th>Montant</th><th>Actions</th></tr></thead>
                <tbody>
                  {expLoading
                    ? <tr className="loading-row"><td colSpan={6}>Chargement…</td></tr>
                    : expenses.length === 0
                    ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">💳</div>Aucune dépense enregistrée</div></td></tr>
                    : expenses.map(ex => (
                      <tr key={ex.id}>
                        <td>{fmtDate(ex.date)}</td>
                        <td><span className="badge badge-blue">{catLabel(ex.category)}</span></td>
                        <td>{ex.description}</td>
                        <td style={{ fontSize: 12, color: '#9ca3af' }}>{ex.events?.client_name || <span className="badge badge-gray">Non lié</span>}</td>
                        <td style={{ fontWeight: 700, color: '#ef4444' }}>{fmt(ex.amount)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => startEditExp(ex)}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteExpense(ex.id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ PAIE ══ */}
        {activeTab === 'paie' && (
          <div className="compta-panel">
            <div className="panel-head">
              <h3>👷 Paie du personnel — {MONTHS_FR[month]} {year}</h3>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Total net : {fmt(payrolls.reduce((s, p) => s + (p.net_salary || 0), 0))}</span>
            </div>
            <div className="compta-form">
              <div className="form-field">
                <label>Employé</label>
                <select value={payForm.staff_id} onChange={e => setPayForm(f => ({ ...f, staff_id: e.target.value }))}>
                  <option value="">— Choisir —</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Salaire de base</label>
                <input type="number" placeholder="0" value={payForm.base_salary} onChange={e => setPayForm(f => ({ ...f, base_salary: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>Primes</label>
                <input type="number" placeholder="0" value={payForm.bonuses} onChange={e => setPayForm(f => ({ ...f, bonuses: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>Déductions</label>
                <input type="number" placeholder="0" value={payForm.deductions} onChange={e => setPayForm(f => ({ ...f, deductions: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>Salaire net calculé</label>
                <input readOnly value={`${netSalary().toFixed(2)} MAD`} style={{ background: '#f0fdf4', color: '#10b981', fontWeight: 700 }} />
              </div>
              <div className="form-field">
                <label>Statut</label>
                <select value={payForm.status} onChange={e => setPayForm(f => ({ ...f, status: e.target.value }))}>
                  {PAYROLL_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Date de paiement</label>
                <DateInput value={payForm.payment_date} onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))} />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={savePayroll}>{editingPay ? '✏️ Modifier' : '➕ Ajouter'}</button>
                {editingPay && <button className="btn btn-ghost" onClick={() => { setEditingPay(null); setPayForm({ staff_id: '', base_salary: '', bonuses: '0', deductions: '0', status: 'pending', payment_date: '' }); }}>Annuler</button>}
              </div>
            </div>
            <div className="compta-table-wrap">
              <table className="compta-table">
                <thead><tr><th>Employé</th><th>Base</th><th>Primes</th><th>Déductions</th><th>Net</th><th>Statut</th><th>Date paiement</th><th>Actions</th></tr></thead>
                <tbody>
                  {payLoading
                    ? <tr className="loading-row"><td colSpan={8}>Chargement…</td></tr>
                    : payrolls.length === 0
                    ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">👷</div>Aucune fiche de paie ce mois</div></td></tr>
                    : payrolls.map(p => {
                        const si = statusInfo(p.status);
                        return (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600 }}>{p.users?.name || '—'}</td>
                            <td>{fmt(p.base_salary)}</td>
                            <td style={{ color: '#10b981' }}>+{fmt(p.bonuses)}</td>
                            <td style={{ color: '#ef4444' }}>−{fmt(p.deductions)}</td>
                            <td style={{ fontWeight: 700 }}>{fmt(p.net_salary)}</td>
                            <td><button className={`badge ${si.badge}`} style={{ cursor: 'pointer', border: 'none' }} onClick={() => togglePayStatus(p)}>{si.label}</button></td>
                            <td>{fmtDate(p.payment_date)}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => startEditPay(p)}>✏️</button>
                                <button className="btn btn-danger btn-sm" onClick={() => deletePay(p.id)}>🗑️</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ RELANCES ══ */}
        {activeTab === 'relances' && (
          <div className="compta-panel">
            <div className="panel-head">
              <h3>📲 Relances clients — Soldes impayés</h3>
              <span className="badge badge-red" style={{ fontSize: 13 }}>{overdueClients.length} client{overdueClients.length !== 1 ? 's' : ''} avec solde</span>
            </div>
            {relanceLoading
              ? <div className="empty-state"><div className="empty-icon">⏳</div>Chargement…</div>
              : overdueClients.length === 0
              ? <div className="empty-state"><div className="empty-icon">🎉</div><p>Aucun solde impayé !</p></div>
              : overdueClients.map(c => (
                <div className="relance-card" key={c.id}>
                  <div className="relance-client-info">
                    <h4>{c.client_name || 'Client inconnu'}</h4>
                    <p>📅 {fmtDate(c.event_date)}{c.client_phone && <> &nbsp;|&nbsp; 📞 {c.client_phone}</>}</p>
                    <p style={{ marginTop: 4 }}>
                      <span className="badge badge-gray" style={{ marginRight: 6 }}>Total : {fmt(c.total_amount)}</span>
                      <span className="badge badge-green">Payé : {fmt(c.paid)}</span>
                    </p>
                  </div>
                  <div className="relance-actions">
                    <div className="relance-amount">{fmt(c.solde)}</div>
                    {c.client_phone
                      ? <a href={buildWALink(c)} target="_blank" rel="noreferrer" className="btn-wa">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                          Relancer
                        </a>
                      : <span className="badge badge-gray">Pas de tél.</span>}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ══ PROFIT PAR ÉVÉNEMENT ══ */}
        {activeTab === 'profit' && (
          <>
            {/* Summary KPIs */}
            <div className="kpi-row">
              <div className="kpi-card green">
                <div className="kpi-label">💰 Recettes totales</div>
                <div className="kpi-value" style={{ color: '#10b981' }}>{fmt(totalProfitRevenue)}</div>
                <div className="kpi-sub">{filteredProfitEvents.length} événements</div>
              </div>
              <div className="kpi-card red">
                <div className="kpi-label">📦 Charges directes</div>
                <div className="kpi-value" style={{ color: '#ef4444' }}>{fmt(totalProfitExpenses)}</div>
                <div className="kpi-sub">Dépenses liées aux événements</div>
              </div>
              <div className="kpi-card blue">
                <div className="kpi-label">✅ Profit total</div>
                <div className="kpi-value" style={{ color: totalProfit >= 0 ? '#2563eb' : '#ef4444' }}>{fmt(totalProfit)}</div>
                <div className="kpi-sub">Recettes − Charges</div>
              </div>
              <div className="kpi-card purple">
                <div className="kpi-label">📊 Marge moyenne</div>
                <div className="kpi-value" style={{ color: '#8b5cf6' }}>{avgMargin}%</div>
                <div className="kpi-sub">Sur tous les événements</div>
              </div>
            </div>

            {/* Filter */}
            <div className="compta-panel">
              <div className="panel-head">
                <h3>📈 Profit par événement</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { key: 'all',        label: 'Tous' },
                    { key: 'profitable', label: '✅ Rentables' },
                    { key: 'loss',       label: '❌ Déficitaires' },
                  ].map(f => (
                    <button key={f.key}
                      className={profitFilter === f.key ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                      onClick={() => setProfitFilter(f.key)}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '16px 20px' }}>
                {profitLoading ? (
                  <div className="empty-state"><div className="empty-icon">⏳</div>Chargement…</div>
                ) : filteredProfitEvents.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📈</div>
                    <p>Aucun événement trouvé.</p>
                    <p style={{ fontSize: 12, marginTop: 8 }}>
                      💡 Liez vos dépenses à des événements dans l'onglet <b>Dépenses</b> pour voir le profit par événement.
                    </p>
                  </div>
                ) : (
                  filteredProfitEvents.map(ev => (
                    <div key={ev.id} className="profit-event-card">
                      {/* Header — clickable to expand */}
                      <div className="profit-event-header" onClick={() => setExpandedEvent(expandedEvent === ev.id ? null : ev.id)}>
                        <div>
                          <div className="profit-event-title">
                            {ev.margin >= 30 ? '🟢' : ev.margin >= 0 ? '🟡' : '🔴'} {ev.client_name || 'Client inconnu'}
                          </div>
                          <div className="profit-event-subtitle">📅 {fmtDate(ev.event_date)} &nbsp;|&nbsp; {ev.expenseItems.length} dépense{ev.expenseItems.length !== 1 ? 's' : ''} liée{ev.expenseItems.length !== 1 ? 's' : ''}</div>
                        </div>
                        <div className="profit-event-kpis">
                          <div className="profit-kpi-item">
                            <div className="val" style={{ color: '#10b981' }}>{fmt(ev.revenue)}</div>
                            <div className="lbl">Recettes</div>
                          </div>
                          <div className="profit-kpi-item">
                            <div className="val" style={{ color: '#ef4444' }}>{fmt(ev.expenses)}</div>
                            <div className="lbl">Charges</div>
                          </div>
                          <div className="profit-kpi-item">
                            <div className="val" style={{ color: ev.profit >= 0 ? '#2563eb' : '#ef4444' }}>{fmt(ev.profit)}</div>
                            <div className="lbl">Profit</div>
                          </div>
                          <div className="profit-kpi-item">
                            <span className={`badge ${ev.margin >= 30 ? 'badge-green' : ev.margin >= 0 ? 'badge-orange' : 'badge-red'}`}>
                              {ev.margin}%
                            </span>
                          </div>
                          <span style={{ color: '#9ca3af', fontSize: 18 }}>{expandedEvent === ev.id ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {expandedEvent === ev.id && (
                        <div className="profit-event-body">
                          <div className="profit-breakdown">
                            <div className="breakdown-item revenue">
                              <span className="b-icon">💰</span>
                              <div>
                                <div className="b-label">Recettes encaissées</div>
                                <div className="b-value" style={{ color: '#10b981' }}>{fmt(ev.revenue)}</div>
                              </div>
                            </div>
                            <div className="breakdown-item expenses">
                              <span className="b-icon">📦</span>
                              <div>
                                <div className="b-label">Charges directes</div>
                                <div className="b-value" style={{ color: '#ef4444' }}>{fmt(ev.expenses)}</div>
                              </div>
                            </div>
                            <div className="breakdown-item profit">
                              <span className="b-icon">{ev.profit >= 0 ? '✅' : '❌'}</span>
                              <div>
                                <div className="b-label">Profit net</div>
                                <div className="b-value" style={{ color: ev.profit >= 0 ? '#2563eb' : '#ef4444' }}>{fmt(ev.profit)}</div>
                              </div>
                            </div>
                          </div>

                          {/* Margin bar */}
                          <div className="margin-bar-wrap">
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                              <span>Marge bénéficiaire</span>
                              <span style={{ fontWeight: 700, color: ev.margin >= 30 ? '#10b981' : ev.margin >= 0 ? '#f59e0b' : '#ef4444' }}>{ev.margin}%</span>
                            </div>
                            <div className="margin-bar-bg">
                              <div className="margin-bar-fill" style={{
                                width: `${Math.max(0, Math.min(ev.margin, 100))}%`,
                                background: ev.margin >= 30 ? '#10b981' : ev.margin >= 0 ? '#f59e0b' : '#ef4444'
                              }} />
                            </div>
                          </div>

                          {/* Expense items */}
                          {ev.expenseItems.length > 0 && (
                            <div className="exp-mini-list">
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                                Détail des charges
                              </div>
                              {ev.expenseItems.map((e, i) => (
                                <div key={i} className="exp-mini-row">
                                  <span>{catLabel(e.category)} — {e.description}</span>
                                  <span style={{ fontWeight: 600, color: '#ef4444' }}>{fmt(e.amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {ev.expenseItems.length === 0 && (
                            <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '12px', background: '#fafbff', borderRadius: 8, marginTop: 12 }}>
                              💡 Aucune dépense liée à cet événement. Allez dans <b>Dépenses</b> et sélectionnez cet événement lors de l'ajout.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </>
  );
}
