import { useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import DateInput from '../components/DateInput';

/* ═══════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════ */
const styles = `
  .facture-wrapper { padding: 24px; font-family: 'Segoe UI', sans-serif; background: #f8f9fc; min-height: 100vh; color: #1a1d2e; }
  .facture-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
  .facture-title { font-size: 22px; font-weight: 700; color: #1a1d2e; display: flex; align-items: center; gap: 10px; }
  .facture-title span.icon { width: 40px; height: 40px; background: linear-gradient(135deg, #7c3aed, #6d28d9); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: white; }
  .facture-tabs { display: flex; gap: 4px; background: #e8eaf2; border-radius: 12px; padding: 4px; margin-bottom: 24px; overflow-x: auto; }
  .facture-tab { flex: 1; min-width: 140px; padding: 10px 16px; border: none; background: transparent; border-radius: 9px; font-size: 13px; font-weight: 500; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; white-space: nowrap; transition: all 0.2s; }
  .facture-tab:hover { color: #7c3aed; background: #ede9fe; }
  .facture-tab.active { background: #fff; color: #7c3aed; font-weight: 600; box-shadow: 0 1px 6px rgba(0,0,0,0.1); }
  .panel { background: #fff; border-radius: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #eef0f7; overflow: hidden; margin-bottom: 20px; }
  .panel-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid #f0f2f9; flex-wrap: wrap; gap: 10px; }
  .panel-head h3 { font-size: 15px; font-weight: 600; color: #1a1d2e; margin: 0; display: flex; align-items: center; gap: 8px; }
  .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; padding: 20px; }
  .form-grid.tight { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; padding: 16px 20px; background: #fafbff; border-bottom: 1px solid #f0f2f9; }
  .form-field { display: flex; flex-direction: column; gap: 6px; }
  .form-field.full { grid-column: 1 / -1; }
  .form-field label { font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-field input, .form-field select, .form-field textarea { padding: 10px 14px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 14px; color: #1a1d2e; background: #fff; transition: border-color 0.2s; outline: none; font-family: inherit; }
  .form-field input:focus, .form-field select:focus, .form-field textarea:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
  .form-field textarea { resize: vertical; min-height: 80px; }
  .btn { padding: 9px 18px; border-radius: 9px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; white-space: nowrap; }
  .btn-purple { background: #7c3aed; color: #fff; }
  .btn-purple:hover { background: #6d28d9; transform: translateY(-1px); }
  .btn-green { background: #10b981; color: #fff; }
  .btn-green:hover { background: #059669; }
  .btn-blue { background: #2563eb; color: #fff; }
  .btn-blue:hover { background: #1d4ed8; }
  .btn-danger { background: #fef2f2; color: #ef4444; border: 1.5px solid #fecaca; }
  .btn-danger:hover { background: #ef4444; color: #fff; }
  .btn-ghost { background: #f3f4f6; color: #374151; }
  .btn-ghost:hover { background: #e5e7eb; }
  .btn-outline { background: #fff; color: #7c3aed; border: 1.5px solid #7c3aed; }
  .btn-outline:hover { background: #f5f3ff; }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap; }
  .badge-draft    { background: #f3f4f6; color: #6b7280; }
  .badge-sent     { background: #dbeafe; color: #2563eb; }
  .badge-paid     { background: #d1fae5; color: #059669; }
  .badge-overdue  { background: #fee2e2; color: #dc2626; }
  .badge-cancelled{ background: #f3f4f6; color: #9ca3af; }
  .badge-purple   { background: #ede9fe; color: #7c3aed; }
  .facture-table-wrap { overflow-x: auto; }
  .facture-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .facture-table thead th { background: #f8f9fc; padding: 11px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 1px solid #f0f2f9; white-space: nowrap; }
  .facture-table tbody tr { border-bottom: 1px solid #f5f7ff; transition: background 0.15s; }
  .facture-table tbody tr:hover { background: #f8f9fc; }
  .facture-table tbody td { padding: 12px 16px; color: #374151; vertical-align: middle; }
  .empty-state { text-align: center; padding: 48px 20px; color: #9ca3af; font-size: 14px; }
  .empty-state .empty-icon { font-size: 40px; margin-bottom: 12px; }
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .items-table th { background: #f8f9fc; padding: 9px 12px; text-align: left; font-size: 12px; font-weight: 700; color: #9ca3af; text-transform: uppercase; border-bottom: 1px solid #f0f2f9; }
  .items-table td { padding: 8px 12px; border-bottom: 1px solid #f5f7ff; vertical-align: middle; }
  .items-table input { padding: 7px 10px; border: 1.5px solid #e5e7eb; border-radius: 7px; font-size: 13px; width: 100%; font-family: inherit; outline: none; }
  .items-table input:focus { border-color: #7c3aed; }
  .totals-box { margin-left: auto; width: 280px; }
  .total-line { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #374151; border-bottom: 1px solid #f0f2f9; }
  .total-line.grand { font-size: 16px; font-weight: 800; color: #1a1d2e; border-bottom: none; padding-top: 10px; }
  .status-actions { display: flex; gap: 6px; flex-wrap: wrap; }

  /* ── PRINT PDF STYLES ── */
  @media print {
    body * { visibility: hidden !important; }
    #invoice-print-area, #invoice-print-area * { visibility: visible !important; }
    #invoice-print-area { position: fixed; top: 0; left: 0; width: 100%; background: white; z-index: 99999; padding: 0; }
    .no-print { display: none !important; }
  }

  /* ── INVOICE PREVIEW ── */
  .invoice-preview {
    background: #fff; border-radius: 14px; border: 1px solid #eef0f7;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; margin-bottom: 20px;
  }
  .inv-header {
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
    padding: 32px; color: white; display: flex;
    justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;
  }
  .inv-business-name { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
  .inv-business-sub  { font-size: 13px; opacity: 0.85; margin-top: 4px; }
  .inv-number-box { text-align: right; }
  .inv-number-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.75; }
  .inv-number { font-size: 26px; font-weight: 800; }
  .inv-body { padding: 32px; }
  .inv-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
  .inv-party h4 { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 10px 0; }
  .inv-party p { font-size: 14px; color: #374151; margin: 3px 0; }
  .inv-party .name { font-size: 16px; font-weight: 700; color: #1a1d2e; }
  .inv-dates { display: flex; gap: 24px; margin-bottom: 28px; flex-wrap: wrap; }
  .inv-date-item { background: #f8f9fc; padding: 10px 16px; border-radius: 10px; }
  .inv-date-label { font-size: 11px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .inv-date-value { font-size: 14px; font-weight: 700; color: #1a1d2e; margin-top: 2px; }
  .inv-items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .inv-items-table thead th { background: #f8f9fc; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb; }
  .inv-items-table thead th:last-child { text-align: right; }
  .inv-items-table tbody td { padding: 12px 16px; border-bottom: 1px solid #f0f2f9; font-size: 14px; color: #374151; }
  .inv-items-table tbody td:last-child { text-align: right; font-weight: 600; }
  .inv-items-table tbody tr:last-child td { border-bottom: none; }
  .inv-totals { display: flex; justify-content: flex-end; margin-bottom: 28px; }
  .inv-totals-box { min-width: 260px; }
  .inv-total-line { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #374151; border-bottom: 1px solid #f0f2f9; }
  .inv-total-line.grand { font-size: 18px; font-weight: 800; color: #1a1d2e; border-bottom: none; border-top: 2px solid #7c3aed; margin-top: 4px; padding-top: 12px; }
  .inv-footer { background: #f8f9fc; padding: 20px 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-top: 1px solid #e5e7eb; }
  .inv-footer p { font-size: 12px; color: #9ca3af; margin: 0; }
  .inv-status-stamp { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; opacity: 0.15; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); pointer-events: none; }
  .inv-body-wrap { position: relative; }
  .inv-notes { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 0 10px 10px 0; margin-bottom: 24px; font-size: 13px; color: #92400e; }

  @media (max-width: 640px) {
    .facture-wrapper { padding: 14px; }
    .inv-parties { grid-template-columns: 1fr; }
    .inv-header { padding: 20px; }
    .inv-body { padding: 20px; }
    .form-grid { grid-template-columns: 1fr; padding: 16px; }
  }
`;

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const STATUS_CONFIG = {
  draft:     { label: 'Brouillon',  badge: 'badge-draft',     icon: '📝' },
  sent:      { label: 'Envoyée',    badge: 'badge-sent',      icon: '📤' },
  paid:      { label: 'Payée',      badge: 'badge-paid',      icon: '✅' },
  overdue:   { label: 'En retard',  badge: 'badge-overdue',   icon: '⚠️' },
  cancelled: { label: 'Annulée',    badge: 'badge-cancelled', icon: '❌' },
};

const fmt = (n) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 2 }).format(n || 0);
const fmtDate = (d) => { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); };
const today = () => new Date().toISOString().split('T')[0];
const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };

const emptyItem = () => ({ id: Date.now(), description: '', quantity: 1, unit_price: 0, total: 0 });

/* ═══════════════════════════════════════════════
   INVOICE PREVIEW COMPONENT
═══════════════════════════════════════════════ */
function InvoicePreview({ invoice, items, bizName, bizPhone, bizEmail, bizAddress }) {
  const subtotal   = items.reduce((s, i) => s + (i.total || 0), 0);
  const taxAmount  = subtotal * (invoice.tax_rate || 0) / 100;
  const total      = subtotal + taxAmount;
  const statusCfg  = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;

  return (
    <div className="invoice-preview" id="invoice-print-area">
      {/* Header */}
      <div className="inv-header">
        <div>
          <div className="inv-business-name">{bizName || 'Votre Entreprise'}</div>
          <div className="inv-business-sub">
            {bizPhone && <span>📞 {bizPhone} &nbsp;</span>}
            {bizEmail && <span>✉️ {bizEmail}</span>}
          </div>
          {bizAddress && <div className="inv-business-sub">📍 {bizAddress}</div>}
        </div>
        <div className="inv-number-box">
          <div className="inv-number-label">Facture</div>
          <div className="inv-number">#{invoice.invoice_number || '0001'}</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {statusCfg.icon} {statusCfg.label}
            </span>
          </div>
        </div>
      </div>

      <div className="inv-body-wrap">
        {(invoice.status === 'paid' || invoice.status === 'cancelled') && (
          <div className="inv-status-stamp" style={{ color: invoice.status === 'paid' ? '#10b981' : '#ef4444' }}>
            {invoice.status === 'paid' ? 'PAYÉE' : 'ANNULÉE'}
          </div>
        )}

        <div className="inv-body">
          {/* Parties */}
          <div className="inv-parties">
            <div className="inv-party">
              <h4>De</h4>
              <p className="name">{bizName || 'Votre Entreprise'}</p>
              {bizPhone   && <p>📞 {bizPhone}</p>}
              {bizEmail   && <p>✉️ {bizEmail}</p>}
              {bizAddress && <p>📍 {bizAddress}</p>}
            </div>
            <div className="inv-party">
              <h4>Facturé à</h4>
              <p className="name">{invoice.client_name || '—'}</p>
              {invoice.client_phone   && <p>📞 {invoice.client_phone}</p>}
              {invoice.client_address && <p>📍 {invoice.client_address}</p>}
            </div>
          </div>

          {/* Dates */}
          <div className="inv-dates">
            <div className="inv-date-item">
              <div className="inv-date-label">Date d'émission</div>
              <div className="inv-date-value">{fmtDate(invoice.issue_date)}</div>
            </div>
            <div className="inv-date-item">
              <div className="inv-date-label">Date d'échéance</div>
              <div className="inv-date-value" style={{ color: invoice.status === 'overdue' ? '#ef4444' : '#1a1d2e' }}>
                {fmtDate(invoice.due_date)}
              </div>
            </div>
          </div>

          {/* Items */}
          <table className="inv-items-table">
            <thead>
              <tr>
                <th style={{ width: '50%' }}>Description</th>
                <th style={{ textAlign: 'center' }}>Qté</th>
                <th style={{ textAlign: 'right' }}>Prix unitaire</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>Aucune ligne ajoutée</td></tr>
              ) : items.map((item, i) => (
                <tr key={i}>
                  <td>{item.description || '—'}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(item.unit_price)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#1a1d2e' }}>{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="inv-totals">
            <div className="inv-totals-box">
              <div className="inv-total-line"><span>Sous-total HT</span><span>{fmt(subtotal)}</span></div>
              {invoice.tax_rate > 0 && (
                <div className="inv-total-line">
                  <span>TVA ({invoice.tax_rate}%)</span>
                  <span>{fmt(taxAmount)}</span>
                </div>
              )}
              <div className="inv-total-line grand">
                <span>Total TTC</span>
                <span style={{ color: '#7c3aed' }}>{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="inv-notes">
              <b>📝 Notes :</b> {invoice.notes}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="inv-footer">
        <p>Merci pour votre confiance !</p>
        <p style={{ color: '#7c3aed', fontWeight: 600 }}>Traiteur Pro — Gestion professionnelle</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function Facture() {
  const { profile } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('list');

  /* ── Invoices list ── */
  const [invoices, setInvoices]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  /* ── Events for linking ── */
  const [evenements, setEvenements] = useState([]);

  /* ── Business settings ── */
  const [biz, setBiz] = useState({ business_name: '', phone: '', email: '', address: '' });

  /* ── Invoice form ── */
  const defaultForm = { invoice_number: '', event_id: '', client_name: '', client_phone: '', client_address: '', issue_date: today(), due_date: addDays(today(), 30), tax_rate: 20, notes: '', status: 'draft' };
  const [form, setForm]     = useState(defaultForm);
  const [lineItems, setLineItems] = useState([emptyItem()]);
  const [editingId, setEditingId] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadInvoices();
    loadBizSettings();
    generateInvoiceNumber();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.business_id) return;
    supabase
      .from('events')
      .select('id, title, event_date')
      .eq('business_id', profile.business_id)
      .order('event_date', { ascending: false })
      .then(({ data }) => setEvenements(data || []));
  }, [profile?.business_id]);

  async function loadBizSettings() {
    const { data } = await supabase.from('users').select('business_settings').eq('id', profile.id).single();
    if (data?.business_settings) setBiz(s => ({ ...s, ...data.business_settings }));
  }

  async function loadInvoices() {
    setLoading(true);
    let q = supabase.from('invoices')
      .select('*')
      .eq('business_id', profile.business_id)
      .order('created_at', { ascending: false });
    if (filterStatus) q = q.eq('status', filterStatus);
    const { data, error } = await q;
    if (error) console.error('loadInvoices:', error);
    setInvoices(data || []);
    setLoading(false);
  }

  async function generateInvoiceNumber() {
    const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('business_id', profile.business_id);
    const num = String((count || 0) + 1).padStart(4, '0');
    const year = new Date().getFullYear();
    setForm(f => ({ ...f, invoice_number: `INV-${year}-${num}` }));
  }

  /* ── Auto-fill from event ── */
  function handleEventSelect(eventId) {
    const ev = evenements.find(e => e.id === eventId);
    if (ev) {
      setForm(f => ({ ...f, event_id: eventId, client_name: ev.title || '' }));
    } else {
      setForm(f => ({ ...f, event_id: '' }));
    }
  }

  /* ── Line items ── */
  function updateItem(id, field, value) {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        updated.total = (parseFloat(updated.quantity) || 0) * (parseFloat(updated.unit_price) || 0);
      }
      return updated;
    }));
  }

  function addItem()    { setLineItems(prev => [...prev, emptyItem()]); }
  function removeItem(id) { setLineItems(prev => prev.filter(i => i.id !== id)); }

  const subtotal  = lineItems.reduce((s, i) => s + (i.total || 0), 0);
  const taxAmount = subtotal * (form.tax_rate || 0) / 100;
  const total     = subtotal + taxAmount;

  /* ── Save invoice ── */
  async function saveInvoice() {
    if (!form.client_name || lineItems.length === 0) return;
    const payload = {
      invoice_number: form.invoice_number,
      event_id:       form.event_id || null,
      client_name:    form.client_name,
      client_phone:   form.client_phone,
      client_address: form.client_address,
      issue_date:     form.issue_date,
      due_date:       form.due_date,
      tax_rate:       parseFloat(form.tax_rate) || 0,
      tax_amount:     parseFloat(taxAmount.toFixed(2)),
      subtotal:       parseFloat(subtotal.toFixed(2)),
      total:          parseFloat(total.toFixed(2)),
      notes:          form.notes,
      status:         form.status,
      user_id:        profile.id,
    };

    let invoiceId = editingId;

    if (editingId) {
      const { error: updateErr } = await supabase.from('invoices').update(payload).eq('id', editingId).eq('business_id', profile.business_id);
      if (updateErr) { console.error(updateErr); alert('Erreur: ' + updateErr.message); return; }
      await supabase.from('invoice_items').delete().eq('invoice_id', editingId);
    } else {
      const { data, error } = await supabase.from('invoices').insert([{ ...payload, created_by: profile.id, business_id: profile.business_id }]).select().single();
      if (error) { console.error(error); alert('Erreur: ' + error.message); return; }
      invoiceId = data?.id;
    }

    if (invoiceId) {
      const items = lineItems.map(i => ({
        invoice_id:  invoiceId,
        description: i.description,
        quantity:    parseFloat(i.quantity) || 0,
        unit_price:  parseFloat(i.unit_price) || 0,
        total:       parseFloat(i.total) || 0,
        business_id: profile.business_id,
      }));
      await supabase.from('invoice_items').insert(items);
    }

    resetForm();
    setActiveTab('list');
    loadInvoices();
  }

  function resetForm() {
    setForm(defaultForm);
    setLineItems([emptyItem()]);
    setEditingId(null);
    setPreviewMode(false);
    generateInvoiceNumber();
  }

  async function openInvoice(invoice) {
    const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id).order('id');
    setForm({
      invoice_number: invoice.invoice_number,
      event_id:       invoice.event_id || '',
      client_name:    invoice.client_name || '',
      client_phone:   invoice.client_phone || '',
      client_address: invoice.client_address || '',
      issue_date:     invoice.issue_date || today(),
      due_date:       invoice.due_date || addDays(today(), 30),
      tax_rate:       invoice.tax_rate || 20,
      notes:          invoice.notes || '',
      status:         invoice.status || 'draft',
    });
    setLineItems((items || []).map(i => ({ ...i, id: i.id || Date.now() })));
    setEditingId(invoice.id);
    setPreviewMode(false);
    setActiveTab('form');
  }

  async function deleteInvoice(id) {
    if (!confirm('Supprimer cette facture ?')) return;
    await supabase.from('invoice_items').delete().eq('invoice_id', id);
    await supabase.from('invoices').delete().eq('id', id);
    loadInvoices();
  }

  async function updateStatus(id, status) {
    await supabase.from('invoices').update({ status }).eq('id', id);
    loadInvoices();
  }

  /* ── Print PDF ── */
  function printPDF() {
    window.print();
  }

  /* ── Stats ── */
  const stats = {
    total:   invoices.length,
    paid:    invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'sent').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    revenue: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0),
  };

  function handleShareInvoice(invoice) {
    if (!invoice.token) return alert('Token manquant — rechargez la page.')
    const url = `${window.location.origin}/portal/${invoice.token}`
    navigator.clipboard.writeText(url)
      .then(() => alert('✅ Lien copié !\n\n' + url))
      .catch(() => prompt('Copiez ce lien :', url))
  }

  /* ═══ RENDER ═══ */
  return (
    <>
      <style>{styles}</style>
      <div className="facture-wrapper">

        {/* HEADER */}
        <div className="facture-header">
          <h1 className="facture-title"><span className="icon">🧾</span>Factures</h1>
          <div style={{ display: 'flex', gap: 10 }} className="no-print">
            <button className="btn btn-purple" onClick={() => { resetForm(); setActiveTab('form'); }}>
              ➕ Nouvelle facture
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="facture-tabs no-print">
          {[
            { key: 'list', icon: '📋', label: 'Liste des factures' },
            { key: 'form', icon: '✏️', label: editingId ? 'Modifier' : 'Créer' },
          ].map(t => (
            <button key={t.key} className={`facture-tab${activeTab === t.key ? ' active' : ''}`} onClick={() => setActiveTab(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ══ LIST ══ */}
        {activeTab === 'list' && (
          <>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: '📋 Total factures', value: stats.total,   sub: 'Émises',       color: '#7c3aed', bg: 'purple' },
                { label: '✅ Payées',          value: stats.paid,    sub: 'Réglées',      color: '#10b981', bg: 'green'  },
                { label: '📤 Envoyées',        value: stats.pending, sub: 'En attente',   color: '#2563eb', bg: 'blue'   },
                { label: '⚠️ En retard',       value: stats.overdue, sub: 'À relancer',   color: '#ef4444', bg: 'red'    },
                { label: '💰 Chiffre d\'affaires', value: null, extra: new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(stats.revenue), sub: 'Factures payées', color: '#10b981', bg: 'green' },
              ].map(k => (
                <div key={k.label} style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #eef0f7', borderLeft: `4px solid ${k.color}` }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.extra || k.value}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div className="panel">
              <div className="panel-head">
                <h3>🧾 Toutes les factures</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setTimeout(loadInvoices, 0); }}
                    style={{ padding: '7px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
                    <option value="">Tous les statuts</option>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="facture-table-wrap">
                <table className="facture-table">
                  <thead>
                    <tr>
                      <th>N° Facture</th>
                      <th>Client</th>
                      <th>Date émission</th>
                      <th>Échéance</th>
                      <th>Total</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>Chargement…</td></tr>
                    ) : invoices.length === 0 ? (
                      <tr><td colSpan={7}>
                        <div className="empty-state">
                          <div className="empty-icon">🧾</div>
                          <p>Aucune facture pour l'instant</p>
                          <button className="btn btn-purple" style={{ marginTop: 12 }} onClick={() => { resetForm(); setActiveTab('form'); }}>
                            ➕ Créer ma première facture
                          </button>
                        </div>
                      </td></tr>
                    ) : invoices.map(inv => {
                      const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
                      return (
                        <tr key={inv.id}>
                          <td style={{ fontWeight: 700, color: '#7c3aed' }}>#{inv.invoice_number}</td>
                          <td style={{ fontWeight: 600 }}>{inv.client_name}</td>
                          <td>{fmtDate(inv.issue_date)}</td>
                          <td style={{ color: inv.status === 'overdue' ? '#ef4444' : '#374151' }}>{fmtDate(inv.due_date)}</td>
                          <td style={{ fontWeight: 700 }}>{fmt(inv.total)}</td>
                          <td><span className={`badge ${sc.badge}`}>{sc.icon} {sc.label}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => openInvoice(inv)} title="Modifier">✏️</button>
                              {inv.status === 'draft' && (
                                <button
                                  title="Envoyer"
                                  onClick={() => updateStatus(inv.id, 'sent')}
                                  style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                  📤 Envoyer
                                </button>
                              )}
                              {inv.status === 'sent' && (
                                <button
                                  title="Marquer payée"
                                  onClick={() => updateStatus(inv.id, 'paid')}
                                  style={{ background: '#f0fdf4', color: '#059669', border: '1px solid #a7f3d0', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                  ✅ Payée
                                </button>
                              )}
                              <button
                                onClick={() => handleShareInvoice(inv)}
                                style={{
                                  background: '#f0fdf4',
                                  color: '#16a34a',
                                  border: '1px solid #86efac',
                                  borderRadius: 6,
                                  padding: '5px 12px',
                                  cursor: 'pointer',
                                  fontSize: 13,
                                }}
                              >
                                🔗 Partager
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => deleteInvoice(inv.id)} title="Supprimer">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ FORM / EDIT ══ */}
        {activeTab === 'form' && (
          <>
            {/* Top actions */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }} className="no-print">
              <button className="btn btn-ghost" onClick={() => { setPreviewMode(false); }}>
                ✏️ {previewMode ? 'Retour au formulaire' : 'Modifier'}
              </button>
              <button className="btn btn-outline" onClick={() => setPreviewMode(true)}>👁️ Aperçu</button>
              {previewMode && <button className="btn btn-blue" onClick={printPDF}>🖨️ Imprimer / PDF</button>}
              <button className="btn btn-purple" onClick={saveInvoice}>💾 {editingId ? 'Mettre à jour' : 'Enregistrer'}</button>
              <button className="btn btn-ghost" onClick={() => { resetForm(); setActiveTab('list'); }}>✕ Annuler</button>
            </div>

            {previewMode ? (
              /* PREVIEW MODE */
              <InvoicePreview
                invoice={form}
                items={lineItems}
                bizName={biz.business_name}
                bizPhone={biz.phone}
                bizEmail={biz.email}
                bizAddress={biz.address}
              />
            ) : (
              /* EDIT MODE */
              <>
                {/* Invoice Info */}
                <div className="panel">
                  <div className="panel-head"><h3>📋 Informations de la facture</h3></div>
                  <div className="form-grid tight">
                    <div className="form-field">
                      <label>N° Facture</label>
                      <input type="text" value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} />
                    </div>
                    <div className="form-field">
                      <label>Lier à un événement</label>
                      <select value={form.event_id} onChange={e => handleEventSelect(e.target.value)}>
                        <option value="">— Aucun —</option>
                        {evenements.map(e => <option key={e.id} value={e.id}>{e.title} — {e.event_date}</option>)}
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Date d'émission</label>
                      <DateInput value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
                    </div>
                    <div className="form-field">
                      <label>Date d'échéance</label>
                      <DateInput value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                    </div>
                    <div className="form-field">
                      <label>TVA (%)</label>
                      <select value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: parseFloat(e.target.value) }))}>
                        {[0, 7, 10, 14, 20].map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Statut</label>
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="panel">
                  <div className="panel-head"><h3>👤 Informations client</h3></div>
                  <div className="form-grid tight">
                    <div className="form-field">
                      <label>Nom du client *</label>
                      <input type="text" placeholder="Famille Bennani" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} />
                    </div>
                    <div className="form-field">
                      <label>Téléphone</label>
                      <input type="text" placeholder="+212 6XX XXX XXX" value={form.client_phone} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))} />
                    </div>
                    <div className="form-field full">
                      <label>Adresse</label>
                      <input type="text" placeholder="123 Rue Mohammed V, Agadir" value={form.client_address} onChange={e => setForm(f => ({ ...f, client_address: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="panel">
                  <div className="panel-head">
                    <h3>📦 Lignes de facturation</h3>
                    <button className="btn btn-ghost btn-sm" onClick={addItem}>➕ Ajouter une ligne</button>
                  </div>
                  <div style={{ padding: '16px 20px', overflowX: 'auto' }}>
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th style={{ width: '45%' }}>Description</th>
                          <th style={{ width: '12%' }}>Qté</th>
                          <th style={{ width: '18%' }}>Prix unitaire (MAD)</th>
                          <th style={{ width: '15%' }}>Total</th>
                          <th style={{ width: '10%' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map(item => (
                          <tr key={item.id}>
                            <td><input type="text" placeholder="Ex: Buffet mariage 100 personnes" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} /></td>
                            <td><input type="number" min="0" step="0.1" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} /></td>
                            <td><input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(item.id, 'unit_price', e.target.value)} /></td>
                            <td style={{ fontWeight: 700, color: '#1a1d2e', fontSize: 14 }}>{fmt(item.total)}</td>
                            <td>
                              {lineItems.length > 1 && (
                                <button onClick={() => removeItem(item.id)} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}>✕</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totals */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                      <div className="totals-box">
                        <div className="total-line"><span>Sous-total HT</span><span>{fmt(subtotal)}</span></div>
                        {form.tax_rate > 0 && <div className="total-line"><span>TVA ({form.tax_rate}%)</span><span>{fmt(taxAmount)}</span></div>}
                        <div className="total-line grand"><span>Total TTC</span><span style={{ color: '#7c3aed' }}>{fmt(total)}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="panel">
                  <div className="panel-head"><h3>📝 Notes</h3></div>
                  <div style={{ padding: '16px 20px' }}>
                    <div className="form-field">
                      <textarea placeholder="Conditions de paiement, informations supplémentaires…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {/* Save */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginBottom: 20 }}>
                  <button className="btn btn-ghost" onClick={() => { resetForm(); setActiveTab('list'); }}>Annuler</button>
                  <button className="btn btn-outline" onClick={() => setPreviewMode(true)}>👁️ Aperçu</button>
                  <button className="btn btn-purple" onClick={saveInvoice}>💾 {editingId ? 'Mettre à jour' : 'Enregistrer la facture'}</button>
                </div>
              </>
            )}
          </>
        )}

      </div>
    </>
  );
}
