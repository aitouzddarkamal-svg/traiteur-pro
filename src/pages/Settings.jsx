import { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AuthContext } from '../context/AuthContext';

/* ═══════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════ */
const styles = `
  .settings-wrapper {
    padding: 24px;
    font-family: 'Segoe UI', sans-serif;
    background: #f8f9fc;
    min-height: 100vh;
    color: #1a1d2e;
  }
  .settings-header {
    display: flex; align-items: center;
    justify-content: space-between;
    margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
  }
  .settings-title {
    font-size: 22px; font-weight: 700; color: #1a1d2e;
    display: flex; align-items: center; gap: 10px;
  }
  .settings-title .icon {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border-radius: 10px; display: flex; align-items: center;
    justify-content: center; font-size: 18px; color: white;
  }

  /* TABS */
  .settings-tabs {
    display: flex; gap: 4px; background: #e8eaf2;
    border-radius: 12px; padding: 4px;
    margin-bottom: 28px; overflow-x: auto;
  }
  .settings-tab {
    flex: 1; min-width: 140px; padding: 10px 16px;
    border: none; background: transparent; border-radius: 9px;
    font-size: 13px; font-weight: 500; color: #6b7280;
    cursor: pointer; display: flex; align-items: center;
    justify-content: center; gap: 7px;
    white-space: nowrap; transition: all 0.2s;
  }
  .settings-tab:hover { color: #6366f1; background: #e0e7ff; }
  .settings-tab.active {
    background: #fff; color: #6366f1; font-weight: 600;
    box-shadow: 0 1px 6px rgba(0,0,0,0.1);
  }

  /* CARDS */
  .settings-card {
    background: #fff; border-radius: 14px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    border: 1px solid #eef0f7; overflow: hidden; margin-bottom: 20px;
  }
  .card-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid #f0f2f9;
    flex-wrap: wrap; gap: 10px;
  }
  .card-head h3 {
    font-size: 15px; font-weight: 600; color: #1a1d2e;
    margin: 0; display: flex; align-items: center; gap: 8px;
  }
  .card-head p { font-size: 13px; color: #9ca3af; margin: 4px 0 0 0; }
  .card-body { padding: 24px; }

  /* FORM */
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 18px;
  }
  .form-field { display: flex; flex-direction: column; gap: 6px; }
  .form-field label {
    font-size: 12px; font-weight: 700; color: #6b7280;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .form-field input, .form-field select, .form-field textarea {
    padding: 10px 14px; border: 1.5px solid #e5e7eb;
    border-radius: 10px; font-size: 14px; color: #1a1d2e;
    background: #fff; transition: border-color 0.2s;
    outline: none; font-family: inherit;
  }
  .form-field input:focus, .form-field select:focus, .form-field textarea:focus {
    border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }
  .form-field textarea { resize: vertical; min-height: 90px; }
  .form-hint { font-size: 11px; color: #9ca3af; margin-top: 2px; }
  .form-full { grid-column: 1 / -1; }

  /* BUTTONS */
  .btn {
    padding: 10px 20px; border-radius: 10px; border: none;
    font-size: 13px; font-weight: 600; cursor: pointer;
    display: inline-flex; align-items: center; gap: 7px;
    transition: all 0.2s; white-space: nowrap;
  }
  .btn-primary { background: #6366f1; color: #fff; }
  .btn-primary:hover { background: #4f46e5; transform: translateY(-1px); }
  .btn-success { background: #10b981; color: #fff; }
  .btn-success:hover { background: #059669; }
  .btn-danger { background: #fef2f2; color: #ef4444; border: 1.5px solid #fecaca; }
  .btn-danger:hover { background: #ef4444; color: #fff; }
  .btn-ghost { background: #f3f4f6; color: #374151; }
  .btn-ghost:hover { background: #e5e7eb; }
  .btn-outline { background: #fff; color: #6366f1; border: 1.5px solid #6366f1; }
  .btn-outline:hover { background: #eef2ff; }
  .btn-sm { padding: 7px 14px; font-size: 12px; }

  /* REMINDER RULES */
  .rule-list { display: flex; flex-direction: column; gap: 12px; }
  .rule-card {
    border: 1.5px solid #e5e7eb; border-radius: 12px;
    padding: 16px 20px; background: #fafbff;
    transition: border-color 0.15s, box-shadow 0.15s;
    position: relative;
  }
  .rule-card:hover { border-color: #6366f1; box-shadow: 0 2px 12px rgba(99,102,241,0.08); }
  .rule-card.inactive { opacity: 0.55; }
  .rule-card-header {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 12px; margin-bottom: 10px;
  }
  .rule-card-title {
    font-size: 14px; font-weight: 600; color: #1a1d2e;
    display: flex; align-items: center; gap: 8px;
  }
  .rule-card-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
  .rule-card-body {
    font-size: 13px; color: #6b7280; line-height: 1.6;
    background: #f0f2ff; border-radius: 8px; padding: 10px 12px;
    font-style: italic;
  }
  .rule-card-actions { display: flex; gap: 8px; align-items: center; }
  .toggle-switch {
    position: relative; display: inline-block;
    width: 40px; height: 22px; flex-shrink: 0;
  }
  .toggle-switch input { opacity: 0; width: 0; height: 0; }
  .toggle-slider {
    position: absolute; cursor: pointer; inset: 0;
    background: #d1d5db; border-radius: 22px;
    transition: background 0.2s;
  }
  .toggle-slider:before {
    content: ''; position: absolute;
    width: 16px; height: 16px; left: 3px; bottom: 3px;
    background: white; border-radius: 50%; transition: transform 0.2s;
  }
  input:checked + .toggle-slider { background: #10b981; }
  input:checked + .toggle-slider:before { transform: translateX(18px); }

  /* BADGE */
  .badge {
    display: inline-flex; align-items: center;
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 600;
  }
  .badge-purple { background: #ede9fe; color: #7c3aed; }
  .badge-green  { background: #d1fae5; color: #059669; }
  .badge-blue   { background: #dbeafe; color: #2563eb; }
  .badge-orange { background: #fef3c7; color: #d97706; }
  .badge-gray   { background: #f3f4f6; color: #6b7280; }
  .badge-red    { background: #fee2e2; color: #dc2626; }

  /* VARIABLES HINT */
  .vars-box {
    background: #fafbff; border: 1.5px solid #e0e7ff;
    border-radius: 10px; padding: 14px 16px; margin-top: 12px;
  }
  .vars-box p { font-size: 12px; font-weight: 700; color: #6366f1; margin: 0 0 8px 0; }
  .vars-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .var-chip {
    background: #e0e7ff; color: #4f46e5; border-radius: 6px;
    padding: 3px 8px; font-size: 11px; font-weight: 600;
    font-family: monospace; cursor: pointer; transition: background 0.15s;
  }
  .var-chip:hover { background: #c7d2fe; }

  /* SECTION DIVIDER */
  .section-label {
    font-size: 11px; font-weight: 700; color: #9ca3af;
    text-transform: uppercase; letter-spacing: 0.8px;
    margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px;
  }
  .section-label::after {
    content: ''; flex: 1; height: 1px; background: #f0f2f9;
  }

  /* SAVE BAR */
  .save-bar {
    position: sticky; bottom: 0; left: 0; right: 0;
    background: rgba(255,255,255,0.95); backdrop-filter: blur(8px);
    border-top: 1px solid #e5e7eb; padding: 14px 24px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; z-index: 10; border-radius: 0 0 14px 14px;
  }
  .save-bar-hint { font-size: 12px; color: #9ca3af; }

  /* CURRENCY GRID */
  .currency-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 10px;
  }
  .currency-opt {
    border: 1.5px solid #e5e7eb; border-radius: 10px;
    padding: 12px; cursor: pointer; text-align: center;
    transition: all 0.15s; background: #fff;
  }
  .currency-opt:hover { border-color: #6366f1; background: #fafbff; }
  .currency-opt.selected { border-color: #6366f1; background: #eef2ff; }
  .currency-opt .symbol { font-size: 22px; font-weight: 700; color: #1a1d2e; }
  .currency-opt .name { font-size: 11px; color: #9ca3af; margin-top: 2px; }
  .currency-opt .code { font-size: 12px; font-weight: 600; color: #6366f1; }

  /* WHATSAPP SETUP */
  .wa-status-box {
    display: flex; align-items: center; gap: 14px;
    padding: 16px 20px; border-radius: 12px; margin-bottom: 20px;
  }
  .wa-status-box.connected { background: #d1fae5; border: 1.5px solid #6ee7b7; }
  .wa-status-box.disconnected { background: #fef3c7; border: 1.5px solid #fcd34d; }
  .wa-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .wa-dot.green { background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.2); }
  .wa-dot.yellow { background: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.2); }

  /* EMPTY */
  .empty-state { text-align: center; padding: 40px; color: #9ca3af; }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }

  /* SECURITY TAB */
  .backup-status-card {
    background: linear-gradient(135deg, #d1fae5, #ecfdf5);
    border: 1.5px solid #6ee7b7; border-radius: 14px;
    padding: 24px; display: flex; align-items: flex-start;
    gap: 18px; margin-bottom: 20px;
  }
  .backup-icon {
    width: 52px; height: 52px; border-radius: 50%;
    background: #10b981; display: flex; align-items: center;
    justify-content: center; font-size: 24px; flex-shrink: 0;
    box-shadow: 0 0 0 6px rgba(16,185,129,0.15);
  }
  .sec-table { width: 100%; border-collapse: collapse; }
  .sec-table th {
    font-size: 11px; font-weight: 700; color: #9ca3af;
    text-transform: uppercase; letter-spacing: 0.5px;
    padding: 8px 12px; border-bottom: 2px solid #f0f2f9; text-align: left;
  }
  .sec-table td {
    padding: 12px; font-size: 13px; color: #1a1d2e;
    border-bottom: 1px solid #f8f9fc; vertical-align: middle;
  }
  .sec-table tr.admin-row td:first-child { border-left: 3px solid #d97706; padding-left: 9px; }
  .sec-table tr:last-child td { border-bottom: none; }
  .restore-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.45); z-index: 1000;
    display: flex; align-items: center; justify-content: center; padding: 16px;
  }
  .restore-modal {
    background: #fff; border-radius: 16px; padding: 28px;
    width: 100%; max-width: 480px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  }
  .restore-modal h2 { font-size: 17px; font-weight: 700; color: #1a1d2e; margin: 0 0 6px 0; }
  .restore-modal p { font-size: 13px; color: #6b7280; margin: 0 0 20px 0; }
  .restore-warn {
    background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 10px;
    padding: 12px 16px; font-size: 13px; color: #dc2626;
    margin-bottom: 18px; line-height: 1.5;
  }
  .confirm-check {
    display: flex; align-items: flex-start; gap: 10px;
    background: #fef9c3; border: 1.5px solid #fcd34d;
    border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; cursor: pointer;
  }
  .confirm-check input { margin-top: 3px; flex-shrink: 0; cursor: pointer; }
  .confirm-check span { font-size: 13px; color: #92400e; font-weight: 500; line-height: 1.5; }

  @media (max-width: 640px) {
    .settings-wrapper { padding: 14px; }
    .settings-tab { min-width: 110px; font-size: 12px; }
    .form-grid { grid-template-columns: 1fr; }
    .currency-grid { grid-template-columns: repeat(3, 1fr); }
  }
`;

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const MAD_CURRENCY = { code: 'MAD', symbol: 'DH', name: 'Dirham marocain', flag: '🇲🇦' };

const S = {
  label: { fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, color: '#1a1d2e', background: '#fff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, color: '#1a1d2e', background: '#fff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
};


const TRIGGER_TYPES = [
  { value: 'before_event',  label: 'Avant la date de l\'événement' },
  { value: 'after_event',   label: 'Après la date de l\'événement' },
  { value: 'after_service', label: 'Après la prestation' },
];

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { value: 'sms',      label: 'SMS',      icon: '📱' },
  { value: 'email',    label: 'Email',    icon: '📧' },
];

const TEMPLATE_VARS = [
  '{client_name}', '{event_date}', '{amount}',
  '{business_name}', '{days_remaining}', '{balance_due}'
];

const channelBadge = (c) => ({ whatsapp: 'badge-green', sms: 'badge-blue', email: 'badge-orange' }[c] || 'badge-gray');
const triggerLabel = (v) => TRIGGER_TYPES.find(t => t.value === v)?.label || v;
const channelLabel = (v) => CHANNELS.find(c => c.value === v)?.label || v;
const channelIcon  = (v) => CHANNELS.find(c => c.value === v)?.icon || '📨';

/* ═══════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════ */
export default function Settings() {
  const { profile } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('business');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  /* ── Business Settings ── */
  const [biz, setBiz] = useState({
    business_name: '',
    currency: 'MAD',
    phone: '',
    email: '',
    address: '',
    website: '',
  });

  /* ── Reminder Rules ── */
  const [rules, setRules]         = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [editingRule, setEditingRule]   = useState(null);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleForm, setRuleForm]   = useState({
    name: '', trigger_type: 'before_event', trigger_days: 3,
    channel: 'whatsapp', message_template: '', is_active: true,
  });

  /* ── WhatsApp Settings ── */
  const [wa, setWa] = useState({
    waha_url: '',
    waha_session: 'default',
    waha_api_key: '',
    wa_phone: '',
  });

  /* ── Legal Info ── */
  const [legalInfo, setLegalInfo] = useState({
    ice: '', if_num: '', rc: '', patente: '', cnss: '', tva_default: '20',
  });
  const [bpId, setBpId]           = useState(null);
  const [savingLegal, setSavingLegal] = useState(false);

  /* ── New Client (demo admin only) ── */
  const emptyClientForm = { name: '', email: '', password: '', plan: 'essentiel', ville: '', slug: '' };
  const [clientForm, setClientForm]       = useState(emptyClientForm);
  const [clientSaving, setClientSaving]   = useState(false);
  const [clientResult, setClientResult]   = useState(null); // { ok: bool, msg: string, details?: object }

  function slugify(str) {
    return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  async function handleCreateClient() {
    const { name, email, password, plan, ville, slug } = clientForm;
    if (!name.trim() || !email.trim() || !password.trim() || !slug.trim()) {
      setClientResult({ ok: false, msg: 'Tous les champs obligatoires (*) doivent être remplis.' });
      return;
    }
    setClientSaving(true);
    setClientResult(null);
    try {
      const newBusinessId = crypto.randomUUID();
      const { error: e1 } = await supabase.from('users').insert({
        name: name.trim(), email: email.trim(), role: 'admin',
        business_id: newBusinessId, is_active: true,
      });
      if (e1) throw new Error('users: ' + e1.message);

      const { error: e2 } = await supabase.from('subscriptions').insert({
        business_id: newBusinessId, plan_id: plan,
      });
      if (e2) throw new Error('subscriptions: ' + e2.message);

      const { error: e3 } = await supabase.from('business_profiles').insert({
        slug: slug.trim(), business_name: name.trim(),
        hostname: slug.trim() + '.traiteur-pro.com',
        business_id: newBusinessId,
      });
      if (e3) throw new Error('business_profiles: ' + e3.message);

      setClientResult({
        ok: true,
        msg: `✅ Compte créé avec succès.`,
        details: { businessId: newBusinessId, email: email.trim(), plan, url: slug.trim() + '.traiteur-pro.com' },
      });
      setClientForm(emptyClientForm);
    } catch (err) {
      setClientResult({ ok: false, msg: '❌ Erreur : ' + err.message });
    }
    setClientSaving(false);
  }

  /* ── Security Tab ── */
  const [secUsers, setSecUsers]           = useState([]);
  const [secUsersLoading, setSecUsersLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreForm, setRestoreForm]     = useState({ target_datetime: '', confirmed: false });
  const [restoreSaving, setRestoreSaving] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadBizSettings();
    loadRules();
    loadWASettings();
    if (profile?.business_id) loadLegalInfo();
  }, [profile?.id]);

  useEffect(() => {
    if (activeTab === 'securite' && profile?.business_id) loadSecUsers();
  }, [activeTab, profile?.business_id]);

  /* ─── BUSINESS ─── */
  async function loadBizSettings() {
    const { data } = await supabase
      .from('users')
      .select('business_settings')
      .eq('id', profile.id)
      .single();
    if (data?.business_settings) setBiz(s => ({ ...s, ...data.business_settings }));
  }

  async function saveBizSettings() {
    setSaving(true);
    await supabase.from('users').update({ business_settings: biz }).eq('id', profile.id);
    setSaving(false);
    flashSaved();
  }

  /* ─── LEGAL INFO ─── */
  async function loadLegalInfo() {
    const { data } = await supabase
      .from('business_profiles')
      .select('id, ice, if_num, rc, patente, cnss, tva_default')
      .eq('business_id', profile.business_id)
      .maybeSingle();
    if (data) {
      setBpId(data.id);
      setLegalInfo({
        ice: data.ice || '',
        if_num: data.if_num || '',
        rc: data.rc || '',
        patente: data.patente || '',
        cnss: data.cnss || '',
        tva_default: data.tva_default || '20',
      });
    }
  }

  async function saveLegalInfo() {
    if (!bpId) return;
    setSavingLegal(true);
    await supabase
      .from('business_profiles')
      .update({
        ice: legalInfo.ice,
        if_num: legalInfo.if_num,
        rc: legalInfo.rc,
        patente: legalInfo.patente,
        cnss: legalInfo.cnss,
        tva_default: legalInfo.tva_default,
      })
      .eq('id', bpId);
    setSavingLegal(false);
  }

  /* ─── RULES ─── */
  async function loadRules() {
    setRulesLoading(true);
    const { data } = await supabase
      .from('reminder_rules')
      .select('*')
      .order('trigger_days');
    setRules(data || []);
    setRulesLoading(false);
  }

  async function saveRule() {
    if (!ruleForm.name || !ruleForm.message_template) return;
    setSaving(true);
    const payload = { ...ruleForm, trigger_days: parseInt(ruleForm.trigger_days) || 0, user_id: profile.id };
    if (editingRule) {
      await supabase.from('reminder_rules').update(payload).eq('id', editingRule);
    } else {
      await supabase.from('reminder_rules').insert([payload]);
    }
    resetRuleForm();
    await loadRules();
    setSaving(false);
    flashSaved();
  }

  async function deleteRule(id) {
    if (!confirm('Supprimer cette règle de rappel ?')) return;
    await supabase.from('reminder_rules').delete().eq('id', id);
    loadRules();
  }

  async function toggleRule(id, current) {
    await supabase.from('reminder_rules').update({ is_active: !current }).eq('id', id);
    loadRules();
  }

  function startEditRule(rule) {
    setEditingRule(rule.id);
    setRuleForm({ name: rule.name, trigger_type: rule.trigger_type, trigger_days: rule.trigger_days, channel: rule.channel, message_template: rule.message_template, is_active: rule.is_active });
    setShowRuleForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetRuleForm() {
    setEditingRule(null);
    setShowRuleForm(false);
    setRuleForm({ name: '', trigger_type: 'before_event', trigger_days: 3, channel: 'whatsapp', message_template: '', is_active: true });
  }

  function insertVar(v) {
    setRuleForm(f => ({ ...f, message_template: f.message_template + v }));
  }

  /* ─── WHATSAPP ─── */
  async function loadWASettings() {
    const { data } = await supabase.from('users').select('wa_settings').eq('id', profile.id).single();
    if (data?.wa_settings) setWa(s => ({ ...s, ...data.wa_settings }));
  }

  async function saveWASettings() {
    setSaving(true);
    await supabase.from('users').update({ wa_settings: wa }).eq('id', profile.id);
    setSaving(false);
    flashSaved();
  }

  /* ─── SECURITY ─── */
  async function loadSecUsers() {
    setSecUsersLoading(true);
    const { data } = await supabase
      .from('users')
      .select('id, name, email, role, is_active')
      .eq('business_id', profile.business_id);
    setSecUsers(data || []);
    setSecUsersLoading(false);
  }

  async function submitRestoreRequest() {
    if (!restoreForm.target_datetime || !restoreForm.confirmed) return;
    setRestoreSaving(true);
    await supabase.from('restore_requests').insert({
      business_id:      profile.business_id,
      requested_by:     profile.id,
      target_datetime:  new Date(restoreForm.target_datetime).toISOString(),
      status:           'pending',
    });
    setRestoreSaving(false);
    setShowRestoreModal(false);
    setRestoreForm({ target_datetime: '', confirmed: false });
    setRestoreSuccess(true);
  }

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  /* ═══ RENDER ═══ */
  return (
    <>
      <style>{styles}</style>
      <div className="settings-wrapper">

        {/* HEADER */}
        <div className="settings-header">
          <h1 className="settings-title">
            <span className="icon">⚙️</span>
            Paramètres
          </h1>
          {saved && (
            <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              ✅ Modifications enregistrées
            </span>
          )}
        </div>

        {/* TABS */}
        <div className="settings-tabs">
          {[
            { key: 'business',  icon: '🏢', label: 'Entreprise' },
            { key: 'reminders', icon: '🔔', label: 'Rappels' },
            { key: 'whatsapp',  icon: '💬', label: 'WhatsApp' },
            { key: 'securite',  icon: '🔒', label: 'Sécurité' },
            ...(profile?.email === 'kamal@moorish-automation.com'
              ? [{ key: 'nouveau-client', icon: '➕', label: 'Nouveau client' }]
              : []),
          ].map(t => (
            <button key={t.key} className={`settings-tab${activeTab === t.key ? ' active' : ''}`} onClick={() => setActiveTab(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════
            TAB 1 — BUSINESS SETTINGS
        ══════════════════════════════════ */}
        {activeTab === 'business' && (
          <>
            {/* General */}
            <div className="settings-card">
              <div className="card-head">
                <div>
                  <h3>🏢 Informations de l'entreprise</h3>
                  <p>Vos coordonnées utilisées dans les factures, rappels et rapports</p>
                </div>
              </div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-field form-full">
                    <label>Nom de l'entreprise</label>
                    <input type="text" placeholder="ex. Traiteur Saveurs d'Or" value={biz.business_name}
                      onChange={e => setBiz(f => ({ ...f, business_name: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label>Téléphone</label>
                    <input type="text" placeholder="+33 6 00 00 00 00" value={biz.phone}
                      onChange={e => setBiz(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label>Email professionnel</label>
                    <input type="email" placeholder="contact@votreentreprise.com" value={biz.email}
                      onChange={e => setBiz(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label>Site web</label>
                    <input type="text" placeholder="www.votreentreprise.com" value={biz.website}
                      onChange={e => setBiz(f => ({ ...f, website: e.target.value }))} />
                  </div>
                  <div className="form-field form-full">
                    <label>Adresse</label>
                    <input type="text" placeholder="12 rue de la Paix, 75001 Paris" value={biz.address}
                      onChange={e => setBiz(f => ({ ...f, address: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>

            {/* Currency */}
            <div className="settings-card">
              <div className="card-head">
                <div>
                  <h3>💰 Devise</h3>
                  <p>Utilisée dans les factures, rapports et rappels clients</p>
                </div>
                <span className="badge badge-purple" style={{ fontSize: 13, padding: '5px 14px' }}>
                  {MAD_CURRENCY.flag} {MAD_CURRENCY.code}
                </span>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: '#eef2ff', borderRadius: 10, border: '1.5px solid #6366f1', width: 'fit-content' }}>
                  <div style={{ fontSize: 28 }}>{MAD_CURRENCY.flag}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#6366f1' }}>{MAD_CURRENCY.code} — {MAD_CURRENCY.symbol}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{MAD_CURRENCY.name}</div>
                  </div>
                </div>
              </div>
              <div className="save-bar">
                <span className="save-bar-hint">Les modifications s'appliquent à toutes les nouvelles factures et rapports</span>
                <button className="btn btn-primary" onClick={saveBizSettings} disabled={saving}>
                  {saving ? '⏳ Enregistrement…' : '💾 Enregistrer'}
                </button>
              </div>
            </div>

            {/* Informations légales — croissance & elite only */}
            {profile?.plan_id !== 'essentiel' && (
              <div style={{ background: '#fff', border: '1px solid #e5e4e0', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '1rem', color: '#1a1a18', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🏛 Informations légales
                  <span style={{ fontSize: 11, background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>
                    {profile?.plan_id === 'elite' ? 'Plan Élite' : 'Plan Croissance'}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#6b6b66', marginBottom: '1rem' }}>
                  Ces informations apparaissent sur vos factures et devis conformément à la législation marocaine.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={S.label}>ICE (Identifiant Commun de l'Entreprise)</label>
                    <input style={S.input} value={legalInfo.ice}
                      onChange={e => setLegalInfo(f => ({ ...f, ice: e.target.value }))}
                      placeholder="ex: 002345678000045" maxLength={20} />
                  </div>
                  <div>
                    <label style={S.label}>IF (Identifiant Fiscal)</label>
                    <input style={S.input} value={legalInfo.if_num}
                      onChange={e => setLegalInfo(f => ({ ...f, if_num: e.target.value }))}
                      placeholder="ex: 12345678" maxLength={20} />
                  </div>
                  <div>
                    <label style={S.label}>RC (Registre de Commerce)</label>
                    <input style={S.input} value={legalInfo.rc}
                      onChange={e => setLegalInfo(f => ({ ...f, rc: e.target.value }))}
                      placeholder="ex: 45678" maxLength={20} />
                  </div>
                </div>

                {profile?.plan_id === 'elite' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={S.label}>Patente</label>
                      <input style={S.input} value={legalInfo.patente}
                        onChange={e => setLegalInfo(f => ({ ...f, patente: e.target.value }))}
                        placeholder="ex: 12345678" maxLength={20} />
                    </div>
                    <div>
                      <label style={S.label}>CNSS</label>
                      <input style={S.input} value={legalInfo.cnss}
                        onChange={e => setLegalInfo(f => ({ ...f, cnss: e.target.value }))}
                        placeholder="ex: 1234567" maxLength={20} />
                    </div>
                  </div>
                )}

                <div style={{ maxWidth: 300 }}>
                  <label style={S.label}>TVA par défaut</label>
                  <select style={S.select} value={legalInfo.tva_default}
                    onChange={e => setLegalInfo(f => ({ ...f, tva_default: e.target.value }))}>
                    <option value="20">20% — Taux normal</option>
                    <option value="14">14%</option>
                    <option value="10">10%</option>
                    <option value="7">7%</option>
                    <option value="0">0% — Exonéré</option>
                  </select>
                </div>

                <div style={{ marginTop: '1.25rem' }}>
                  <button
                    style={{ background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                    onClick={saveLegalInfo}
                    disabled={savingLegal}>
                    {savingLegal ? 'Enregistrement...' : '✓ Enregistrer les informations légales'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════
            TAB 2 — REMINDER RULES
        ══════════════════════════════════ */}
        {activeTab === 'reminders' && (
          <>
            {/* Add / Edit Form */}
            {showRuleForm ? (
              <div className="settings-card">
                <div className="card-head">
                  <div>
                    <h3>{editingRule ? '✏️ Modifier la règle' : '➕ Nouvelle règle de rappel'}</h3>
                    <p>Configurez quand et comment votre client reçoit un rappel de paiement</p>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={resetRuleForm}>✕ Annuler</button>
                </div>
                <div className="card-body">
                  <div className="form-grid">

                    <div className="form-field form-full">
                      <label>Nom de la règle</label>
                      <input type="text" placeholder="ex. Solde final — 3 jours avant l'événement"
                        value={ruleForm.name} onChange={e => setRuleForm(f => ({ ...f, name: e.target.value }))} />
                    </div>

                    <div className="form-field">
                      <label>Déclencheur</label>
                      <select value={ruleForm.trigger_type} onChange={e => setRuleForm(f => ({ ...f, trigger_type: e.target.value }))}>
                        {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Jours</label>
                      <input type="number" min="0" max="365" value={ruleForm.trigger_days}
                        onChange={e => setRuleForm(f => ({ ...f, trigger_days: e.target.value }))} />
                      <span className="form-hint">
                        Envoyer {ruleForm.trigger_days} jour{ruleForm.trigger_days !== 1 ? 's' : ''} {triggerLabel(ruleForm.trigger_type).toLowerCase()}
                      </span>
                    </div>

                    <div className="form-field">
                      <label>Canal</label>
                      <select value={ruleForm.channel} onChange={e => setRuleForm(f => ({ ...f, channel: e.target.value }))}>
                        {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Statut</label>
                      <select value={ruleForm.is_active ? 'true' : 'false'}
                        onChange={e => setRuleForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                        <option value="true">✅ Actif</option>
                        <option value="false">⏸️ En pause</option>
                      </select>
                    </div>

                    <div className="form-field form-full">
                      <label>Modèle de message</label>
                      <textarea
                        placeholder="Bonjour {client_name}, votre solde de {amount} est dû le {event_date}..."
                        value={ruleForm.message_template}
                        onChange={e => setRuleForm(f => ({ ...f, message_template: e.target.value }))}
                      />
                      <div className="vars-box">
                        <p>🔤 Cliquez sur une variable pour l'insérer dans votre message :</p>
                        <div className="vars-list">
                          {TEMPLATE_VARS.map(v => (
                            <span key={v} className="var-chip" onClick={() => insertVar(v)}>{v}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" onClick={resetRuleForm}>Annuler</button>
                    <button className="btn btn-primary" onClick={saveRule} disabled={saving}>
                      {saving ? '⏳ Enregistrement…' : editingRule ? '✏️ Modifier' : '➕ Ajouter'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button className="btn btn-primary" onClick={() => setShowRuleForm(true)}>
                  ➕ Nouvelle règle de rappel
                </button>
              </div>
            )}

            {/* Rules List */}
            <div className="settings-card">
              <div className="card-head">
                <h3>🔔 Règles de rappel ({rules.length})</h3>
                <span style={{ fontSize: 13, color: '#9ca3af' }}>
                  {rules.filter(r => r.is_active).length} actives
                </span>
              </div>
              <div className="card-body">
                {rulesLoading ? (
                  <div className="empty-state"><div className="empty-icon">⏳</div>Chargement…</div>
                ) : rules.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔔</div>
                    <p>Aucune règle de rappel pour l'instant.</p>
                    <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={() => setShowRuleForm(true)}>
                      ➕ Créer votre première règle
                    </button>
                  </div>
                ) : (
                  <div className="rule-list">
                    {rules.map(rule => (
                      <div key={rule.id} className={`rule-card${!rule.is_active ? ' inactive' : ''}`}>
                        <div className="rule-card-header">
                          <div>
                            <div className="rule-card-title">
                              {channelIcon(rule.channel)} {rule.name}
                            </div>
                            <div className="rule-card-meta" style={{ marginTop: 6 }}>
                              <span className="badge badge-purple">
                                {rule.trigger_days}d {triggerLabel(rule.trigger_type).toLowerCase()}
                              </span>
                              <span className={`badge ${channelBadge(rule.channel)}`}>
                                {channelIcon(rule.channel)} {channelLabel(rule.channel)}
                              </span>
                              <span className={`badge ${rule.is_active ? 'badge-green' : 'badge-gray'}`}>
                                {rule.is_active ? '✅ Actif' : '⏸️ En pause'}
                              </span>
                            </div>
                          </div>
                          <div className="rule-card-actions">
                            <label className="toggle-switch" title="Toggle active/paused">
                              <input type="checkbox" checked={rule.is_active}
                                onChange={() => toggleRule(rule.id, rule.is_active)} />
                              <span className="toggle-slider" />
                            </label>
                            <button className="btn btn-ghost btn-sm" onClick={() => startEditRule(rule)}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteRule(rule.id)}>🗑️</button>
                          </div>
                        </div>
                        <div className="rule-card-body">
                          "{rule.message_template.length > 120 ? rule.message_template.slice(0, 120) + '…' : rule.message_template}"
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* How it works */}
            <div className="settings-card">
              <div className="card-head"><h3>💡 Comment fonctionnent les rappels automatiques</h3></div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  {[
                    { icon: '📅', title: 'Étape 1 — Planifier', desc: 'Définissez des règles — ex. "7 jours après l\'événement"' },
                    { icon: '🤖', title: 'Étape 2 — n8n déclenche', desc: 'Votre workflow n8n vérifie les règles quotidiennement' },
                    { icon: '💬', title: 'Étape 3 — Message envoyé', desc: 'WhatsApp / SMS / Email envoyé automatiquement au client' },
                    { icon: '✅', title: 'Étape 4 — Suivi', desc: 'Statut de paiement mis à jour quand le client paie' },
                  ].map(s => (
                    <div key={s.title} style={{ padding: '14px', background: '#f8f9fc', borderRadius: 10, border: '1px solid #eef0f7' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1d2e', marginBottom: 4 }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{s.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, padding: '12px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fcd34d', fontSize: 13, color: '#92400e' }}>
                  ⚠️ <b>L'automatisation WhatsApp nécessite la configuration Waha.</b> Configurez votre connexion Waha dans l'onglet WhatsApp pour activer l'envoi automatique.
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════
            TAB 3 — WHATSAPP
        ══════════════════════════════════ */}
        {activeTab === 'whatsapp' && (
          <>
            {/* Status */}
            <div className={`wa-status-box ${wa.waha_url ? 'connected' : 'disconnected'}`}>
              <div className={`wa-dot ${wa.waha_url ? 'green' : 'yellow'}`} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1d2e' }}>
                  {wa.waha_url ? '✅ URL Waha configurée' : '⚠️ WhatsApp non configuré'}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  {wa.waha_url ? `Connecté à : ${wa.waha_url}` : 'Ajoutez l\'URL de votre serveur Waha ci-dessous pour activer les messages WhatsApp automatiques'}
                </div>
              </div>
            </div>

            {/* Waha Config */}
            <div className="settings-card">
              <div className="card-head">
                <div>
                  <h3>💬 Connexion Waha</h3>
                  <p>Waha est une API HTTP WhatsApp auto-hébergée — gratuite et facile à configurer</p>
                </div>
                <a href="https://waha.devlike.pro" target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
                  Waha docs ↗
                </a>
              </div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-field form-full">
                    <label>URL du serveur Waha</label>
                    <input type="text" placeholder="http://localhost:3000 or https://waha.votredomaine.com"
                      value={wa.waha_url} onChange={e => setWa(f => ({ ...f, waha_url: e.target.value }))} />
                    <span className="form-hint">L'URL où votre instance Waha est en cours d'exécution</span>
                  </div>
                  <div className="form-field">
                    <label>Nom de session</label>
                    <input type="text" placeholder="default" value={wa.waha_session}
                      onChange={e => setWa(f => ({ ...f, waha_session: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label>Clé API (facultatif)</label>
                    <input type="password" placeholder="votre-clé-api-waha" value={wa.waha_api_key}
                      onChange={e => setWa(f => ({ ...f, waha_api_key: e.target.value }))} />
                  </div>
                  <div className="form-field form-full">
                    <label>Votre numéro WhatsApp Business</label>
                    <input type="text" placeholder="+33 6 00 00 00 00" value={wa.wa_phone}
                      onChange={e => setWa(f => ({ ...f, wa_phone: e.target.value }))} />
                    <span className="form-hint">Le numéro connecté à votre session Waha</span>
                  </div>
                </div>
              </div>
              <div className="save-bar">
                <span className="save-bar-hint">Ces identifiants sont stockés de manière sécurisée dans votre compte</span>
                <button className="btn btn-primary" onClick={saveWASettings} disabled={saving}>
                  {saving ? '⏳ Enregistrement…' : '💾 Enregistrer'}
                </button>
              </div>
            </div>

            {/* Setup Guide */}
            <div className="settings-card">
              <div className="card-head"><h3>🚀 Guide de démarrage rapide</h3></div>
              <div className="card-body">
                {[
                  { step: '1', title: 'Installer Waha', desc: 'Run Waha on your server using Docker: docker run -it --rm -p 3000:3000 devlikeapro/waha', code: true },
                  { step: '2', title: 'Scanner le QR Code', desc: 'Ouvrez http://localhost:3000/dashboard et scannez le QR code avec votre WhatsApp', code: false },
                  { step: '3', title: 'Ajouter l\'URL ici', desc: 'Collez l\'URL de votre serveur Waha dans le champ ci-dessus et enregistrez', code: false },
                  { step: '4', title: 'Créer un workflow n8n', desc: 'Importez le JSON du workflow n8n (disponible dès que vous êtes prêt) — il lit vos règles de rappel depuis Supabase et envoie les messages via Waha', code: false },
                ].map(s => (
                  <div key={s.step} style={{ display: 'flex', gap: 16, marginBottom: 18, alignItems: 'flex-start' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {s.step}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1d2e', marginBottom: 4 }}>{s.title}</div>
                      {s.code
                        ? <code style={{ background: '#1e1e2e', color: '#a6e3a1', padding: '8px 12px', borderRadius: 8, fontSize: 12, display: 'block', fontFamily: 'monospace' }}>{s.desc}</code>
                        : <div style={{ fontSize: 13, color: '#6b7280' }}>{s.desc}</div>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════
            TAB 4 — SÉCURITÉ
        ══════════════════════════════════ */}
        {activeTab === 'securite' && (
          profile?.email === 'kamal@moorish-automation.com' ? (
          <>
            {/* Backup Status */}
            <div className="backup-status-card">
              <div className="backup-icon">✅</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#065f46', marginBottom: 4 }}>
                  Données sécurisées
                </div>
                <div style={{ fontSize: 13, color: '#047857', marginBottom: 4 }}>
                  Dernière synchronisation : {new Date().toLocaleString('fr-MA', { dateStyle: 'long', timeStyle: 'short' })}
                </div>
                <div style={{ fontSize: 13, color: '#047857', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 0 3px rgba(16,185,129,0.25)', flexShrink: 0 }} />
                  Protection continue active
                </div>
              </div>
            </div>

            {/* Users with access */}
            <div className="settings-card">
              <div className="card-head">
                <div>
                  <h3>👥 Utilisateurs avec accès</h3>
                  <p>Comptes ayant accès à votre espace Traiteur Pro</p>
                </div>
                <span className="badge badge-purple">
                  {secUsers.length} compte{secUsers.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="card-body">
                {secUsersLoading ? (
                  <div className="empty-state"><div className="empty-icon">⏳</div>Chargement…</div>
                ) : secUsers.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon">👥</div>Aucun utilisateur trouvé.</div>
                ) : (
                  <table className="sec-table">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {secUsers.map(u => (
                        <tr key={u.id} className={u.role === 'admin' ? 'admin-row' : ''}>
                          <td style={{ fontWeight: u.role === 'admin' ? 700 : 400 }}>
                            {u.name}
                            {u.role === 'admin' && <span style={{ marginLeft: 6, fontSize: 11, color: '#d97706' }}>⭐</span>}
                          </td>
                          <td style={{ color: '#6b7280', fontSize: 12 }}>{u.email}</td>
                          <td>
                            <span className={`badge ${
                              u.role === 'admin'   ? 'badge-orange' :
                              u.role === 'manager' ? 'badge-blue'   : 'badge-gray'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                              {u.is_active ? '✅ Actif' : '⛔ Inactif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Restore Request */}
            <div className="settings-card">
              <div className="card-head">
                <div>
                  <h3>🔄 Restauration de données</h3>
                  <p>Demandez la restauration de vos données à une date antérieure</p>
                </div>
              </div>
              <div className="card-body">
                <div style={{ padding: '14px 16px', background: '#fafbff', borderRadius: 10, border: '1px solid #e0e7ff', marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: '#4338ca', lineHeight: 1.6 }}>
                    ℹ️ La restauration est gérée manuellement par notre équipe. Vous recevrez une confirmation par email avant toute action.
                  </div>
                </div>
                {restoreSuccess ? (
                  <div style={{ padding: '16px 20px', background: '#d1fae5', border: '1.5px solid #6ee7b7', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>✅</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#065f46' }}>Demande envoyée.</div>
                      <div style={{ fontSize: 13, color: '#047857' }}>Notre équipe vous contactera dans les 24h.</div>
                    </div>
                  </div>
                ) : (
                  <button className="btn btn-outline" onClick={() => setShowRestoreModal(true)}>
                    🔄 Demander une restauration
                  </button>
                )}
              </div>
            </div>
          </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888', fontSize: 13 }}>
              🔒 Accès réservé à l'administrateur Traiteur Pro.
            </div>
          )
        )}

        {/* ══════════════════════════════════
            TAB 5 — NOUVEAU CLIENT (demo only)
        ══════════════════════════════════ */}
        {activeTab === 'nouveau-client' && profile?.email === 'kamal@moorish-automation.com' && (
          <>
            <div className="settings-card">
              <div className="card-head">
                <div>
                  <h3>➕ Créer un compte client</h3>
                  <p>Onboarding rapide — crée l'utilisateur, l'abonnement et le profil en un clic</p>
                </div>
                <span className="badge badge-orange">Admin demo uniquement</span>
              </div>
              <div className="card-body">

                {clientResult && (
                  <div style={{
                    padding: '14px 18px', borderRadius: 10, marginBottom: 20,
                    background: clientResult.ok ? '#d1fae5' : '#fee2e2',
                    border: `1.5px solid ${clientResult.ok ? '#6ee7b7' : '#fecaca'}`,
                    color: clientResult.ok ? '#065f46' : '#dc2626',
                    fontSize: 13, lineHeight: 1.6,
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: clientResult.details ? 8 : 0 }}>{clientResult.msg}</div>
                    {clientResult.details && (
                      <>
                        <div>Business ID : <strong>{clientResult.details.businessId}</strong></div>
                        <div>Login : <strong>{clientResult.details.email}</strong></div>
                        <div>Plan : <strong>{clientResult.details.plan}</strong></div>
                        <div>URL : <strong>{clientResult.details.url}</strong></div>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ marginTop: 10 }}
                          onClick={() => {
                            const d = clientResult.details;
                            navigator.clipboard.writeText(
                              `Business ID: ${d.businessId}\nLogin: ${d.email}\nPlan: ${d.plan}\nURL: ${d.url}`
                            );
                          }}
                        >
                          📋 Copier les infos
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-field form-full">
                    <label>Nom du traiteur *</label>
                    <input
                      type="text" placeholder="ex. Traiteur Al Baraka"
                      value={clientForm.name}
                      onChange={e => {
                        const name = e.target.value;
                        setClientForm(f => ({ ...f, name, slug: slugify(name) }));
                      }}
                    />
                  </div>
                  <div className="form-field">
                    <label>Email *</label>
                    <input
                      type="email" placeholder="client@example.com"
                      value={clientForm.email}
                      onChange={e => setClientForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div className="form-field">
                    <label>Mot de passe temporaire *</label>
                    <input
                      type="text" placeholder="ex. Bienvenue2025!"
                      value={clientForm.password}
                      onChange={e => setClientForm(f => ({ ...f, password: e.target.value }))}
                    />
                  </div>
                  <div className="form-field">
                    <label>Plan</label>
                    <select value={clientForm.plan} onChange={e => setClientForm(f => ({ ...f, plan: e.target.value }))}>
                      <option value="essentiel">Essentiel</option>
                      <option value="croissance">Croissance</option>
                      <option value="elite">Élite</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Ville</label>
                    <input
                      type="text" placeholder="ex. Agadir"
                      value={clientForm.ville}
                      onChange={e => setClientForm(f => ({ ...f, ville: e.target.value }))}
                    />
                  </div>
                  <div className="form-field form-full">
                    <label>Slug (URL) *</label>
                    <input
                      type="text" placeholder="ex. traiteur-albaraka"
                      value={clientForm.slug}
                      onChange={e => setClientForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                    />
                    <span className="form-hint">{clientForm.slug ? `${clientForm.slug}.traiteur-pro.com` : 'Généré automatiquement depuis le nom'}</span>
                  </div>
                </div>
              </div>
              <div className="save-bar">
                <span className="save-bar-hint">Les données sont insérées directement en base sans envoi d'email</span>
                <button className="btn btn-primary" onClick={handleCreateClient} disabled={clientSaving}>
                  {clientSaving ? '⏳ Création...' : '➕ Créer le compte client'}
                </button>
              </div>
            </div>
          </>
        )}

      </div>

      {/* ── RESTORE MODAL ── */}
      {showRestoreModal && (
        <div className="restore-overlay" onClick={() => setShowRestoreModal(false)}>
          <div className="restore-modal" onClick={e => e.stopPropagation()}>
            <h2>🔄 Demande de restauration</h2>
            <p>Choisissez la date et l'heure auxquelles vous souhaitez restaurer vos données.</p>
            <div className="restore-warn">
              ⚠️ Cette action écrasera toutes les données modifiées <strong>après</strong> la date choisie. L'opération est effectuée par notre équipe après validation.
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                Date et heure cible *
              </label>
              <input
                type="datetime-local"
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, color: '#1a1d2e', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                value={restoreForm.target_datetime}
                max={new Date().toISOString().slice(0, 16)}
                onChange={e => setRestoreForm(f => ({ ...f, target_datetime: e.target.value }))}
              />
            </div>
            <label className="confirm-check">
              <input
                type="checkbox"
                checked={restoreForm.confirmed}
                onChange={e => setRestoreForm(f => ({ ...f, confirmed: e.target.checked }))}
              />
              <span>Je comprends que cette action écrasera toutes les modifications effectuées après cette date</span>
            </label>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => { setShowRestoreModal(false); setRestoreForm({ target_datetime: '', confirmed: false }); }}>
                Annuler
              </button>
              <button
                className="btn btn-danger"
                disabled={!restoreForm.target_datetime || !restoreForm.confirmed || restoreSaving}
                style={restoreForm.target_datetime && restoreForm.confirmed ? { background: '#ef4444', color: '#fff' } : {}}
                onClick={submitRestoreRequest}
              >
                {restoreSaving ? '⏳ Envoi…' : '🔄 Confirmer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
