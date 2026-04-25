import { useState, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import { canDo } from '../lib/permissions';

/* ═══════════════════════════════════════════════
   SheetJS is loaded dynamically via CDN
═══════════════════════════════════════════════ */
function loadXLSX() {
  return new Promise((resolve) => {
    if (window.XLSX) { resolve(window.XLSX); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = () => resolve(window.XLSX);
    document.head.appendChild(script);
  });
}

/* ═══════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════ */
const styles = `
  .rapport-wrapper { padding: 24px; font-family: 'Segoe UI', sans-serif; background: #f8f9fc; min-height: 100vh; color: #1a1d2e; }
  .rapport-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 12px; }
  .rapport-title { font-size: 22px; font-weight: 700; color: #1a1d2e; display: flex; align-items: center; gap: 10px; }
  .rapport-title span.icon { width: 40px; height: 40px; background: linear-gradient(135deg, #0891b2, #0e7490); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: white; }
  .rapport-subtitle { font-size: 14px; color: #9ca3af; margin-bottom: 28px; }
  .period-bar { display: flex; align-items: center; gap: 12px; background: #fff; border-radius: 12px; padding: 16px 20px; border: 1px solid #eef0f7; box-shadow: 0 1px 4px rgba(0,0,0,0.05); margin-bottom: 28px; flex-wrap: wrap; }
  .period-bar label { font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .period-bar input, .period-bar select { padding: 8px 14px; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: 14px; color: #1a1d2e; background: #fff; outline: none; font-family: inherit; }
  .period-bar input:focus, .period-bar select:focus { border-color: #0891b2; }
  .reports-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
  .report-card { background: #fff; border-radius: 16px; border: 1.5px solid #eef0f7; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s; }
  .report-card:hover { transform: translateY(-3px); box-shadow: 0 6px 24px rgba(0,0,0,0.1); border-color: #0891b2; }
  .report-card-header { padding: 20px 22px 16px; }
  .report-card-icon { font-size: 36px; margin-bottom: 10px; }
  .report-card-title { font-size: 16px; font-weight: 700; color: #1a1d2e; margin-bottom: 6px; }
  .report-card-desc { font-size: 13px; color: #9ca3af; line-height: 1.6; }
  .report-card-sheets { padding: 0 22px 16px; }
  .sheet-chip { display: inline-flex; align-items: center; gap: 5px; background: #f0f9ff; color: #0891b2; border: 1px solid #bae6fd; border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 600; margin: 3px 3px 0 0; }
  .report-card-footer { padding: 14px 22px; border-top: 1px solid #f0f2f9; display: flex; align-items: center; justify-content: space-between; background: #fafbff; }
  .btn-export { background: #0891b2; color: #fff; border: none; border-radius: 9px; padding: 10px 20px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
  .btn-export:hover { background: #0e7490; transform: translateY(-1px); }
  .btn-export:disabled { background: #9ca3af; cursor: not-allowed; transform: none; }
  .btn-export.loading { background: #0891b2; animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%,100%{ opacity:1; } 50%{ opacity:0.6; } }
  .export-hint { font-size: 12px; color: #9ca3af; }
  .success-toast { position: fixed; bottom: 24px; right: 24px; background: #10b981; color: #fff; padding: 14px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 24px rgba(16,185,129,0.35); z-index: 9999; animation: slideIn 0.3s ease; }
  .error-toast { position: fixed; bottom: 24px; right: 24px; background: #ef4444; color: #fff; padding: 14px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 24px rgba(239,68,68,0.35); z-index: 9999; animation: slideIn 0.3s ease; }
  @keyframes slideIn { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: none; } }
  .quick-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 14px; margin-bottom: 28px; }
  .qs-card { background: #fff; border-radius: 12px; padding: 16px 18px; border: 1px solid #eef0f7; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
  .qs-label { font-size: 11px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .qs-value { font-size: 20px; font-weight: 800; }
  .section-title { font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.6px; margin: 0 0 14px 0; }
  @media (max-width: 640px) { .rapport-wrapper { padding: 14px; } .reports-grid { grid-template-columns: 1fr; } }
`;

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const fmtMAD    = (n) => `${(n||0).toFixed(2)} MAD`;
const fmtDate   = (d) => { if (!d) return ''; return new Date(d).toLocaleDateString('fr-FR'); };

function getMonthRange(monthISO) {
  const [y, m] = monthISO.split('-').map(Number);
  const start = `${monthISO}-01`;
  const end   = new Date(y, m, 0).toISOString().split('T')[0];
  return { start, end };
}

function getYearRange(year) {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

/* ═══════════════════════════════════════════════
   EXCEL BUILDER HELPERS
═══════════════════════════════════════════════ */
function styleHeader(ws, range, color = '0E7490') {
  // Applied via SheetJS cell styles (basic)
}

function buildSheet(XLSX, headers, rows, sheetName) {
  const data = [headers, ...rows];
  const ws   = XLSX.utils.aoa_to_sheet(data);
  // Column widths
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 16) }));
  return ws;
}

/* ═══════════════════════════════════════════════
   EXPORT FUNCTIONS
═══════════════════════════════════════════════ */

/* 1 — RAPPORT FINANCIER MENSUEL */
async function exportFinancier(XLSX, month, year) {
  const monthISO = `${year}-${String(month+1).padStart(2,'0')}`;
  const { start, end } = getMonthRange(monthISO);

  const [{ data: payments }, { data: expenses }, { data: payroll }, { data: events }] = await Promise.all([
    supabase.from('payments').select('*').gte('payment_date', start).lte('payment_date', end),
    supabase.from('expenses').select('*').gte('date', start).lte('date', end),
    supabase.from('payroll').select('*, users(name)').eq('period', monthISO),
    supabase.from('events').select('*').gte('event_date', start).lte('event_date', end),
  ]);

  const wb = XLSX.utils.book_new();

  /* Summary sheet */
  const totalRecettes = (payments||[]).reduce((s,p)=>s+(p.amount||0),0);
  const totalDepenses = (expenses||[]).reduce((s,e)=>s+(e.amount||0),0);
  const totalPaie     = (payroll||[]).reduce((s,p)=>s+(p.net_salary||0),0);
  const benefice      = totalRecettes - totalDepenses - totalPaie;

  const summaryData = [
    ['RAPPORT FINANCIER MENSUEL', ''],
    ['Période', `${MONTHS_FR[month]} ${year}`],
    ['', ''],
    ['INDICATEURS', 'MONTANT (MAD)'],
    ['Recettes encaissées', totalRecettes.toFixed(2)],
    ['Dépenses opérationnelles', totalDepenses.toFixed(2)],
    ['Masse salariale', totalPaie.toFixed(2)],
    ['Bénéfice net', benefice.toFixed(2)],
    ['Marge (%)', totalRecettes>0 ? `${((benefice/totalRecettes)*100).toFixed(1)}%` : '0%'],
    ['', ''],
    ['Nombre d\'événements', (events||[]).length],
    ['Nombre de paiements', (payments||[]).length],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');

  /* Payments sheet */
  const wsPayments = buildSheet(XLSX,
    ['Date', 'Événement', 'Client', 'Montant (MAD)', 'Type', 'Méthode'],
    (payments||[]).map(p => [fmtDate(p.payment_date), p.event_id||'', p.client_name||'', (p.amount||0).toFixed(2), p.payment_type||'', p.payment_method||'']),
    'Paiements'
  );
  XLSX.utils.book_append_sheet(wb, wsPayments, 'Paiements');

  /* Expenses sheet */
  const wsExp = buildSheet(XLSX,
    ['Date', 'Catégorie', 'Description', 'Montant (MAD)', 'TVA (%)', 'Montant TVA'],
    (expenses||[]).map(e => [fmtDate(e.date), e.category||'', e.description||'', (e.amount||0).toFixed(2), e.tax_rate||0, (e.tax_amount||0).toFixed(2)]),
    'Dépenses'
  );
  XLSX.utils.book_append_sheet(wb, wsExp, 'Dépenses');

  /* Payroll sheet */
  const wsPay = buildSheet(XLSX,
    ['Employé', 'Salaire base', 'Primes', 'Déductions', 'Salaire net', 'Statut', 'Date paiement'],
    (payroll||[]).map(p => [p.users?.name||'', (p.base_salary||0).toFixed(2), (p.bonuses||0).toFixed(2), (p.deductions||0).toFixed(2), (p.net_salary||0).toFixed(2), p.status||'', fmtDate(p.payment_date)]),
    'Paie'
  );
  XLSX.utils.book_append_sheet(wb, wsPay, 'Paie du personnel');

  XLSX.writeFile(wb, `Rapport_Financier_${MONTHS_FR[month]}_${year}.xlsx`);
}

/* 2 — RAPPORT ÉVÉNEMENTS */
async function exportEvenements(XLSX, year) {
  const { start, end } = getYearRange(year);
  const { data: events } = await supabase.from('events').select('*').gte('event_date', start).lte('event_date', end).order('event_date');
  const { data: pays }   = await supabase.from('payments').select('event_id, amount');

  const paidByEvent = {};
  (pays||[]).forEach(p => { paidByEvent[p.event_id] = (paidByEvent[p.event_id]||0)+(p.amount||0); });

  const wb = XLSX.utils.book_new();

  const wsEvents = buildSheet(XLSX,
    ['Date événement', 'Client', 'Téléphone', 'Type', 'Invités', 'Montant total', 'Montant payé', 'Solde', 'Statut'],
    (events||[]).map(ev => {
      const paid  = paidByEvent[ev.id]||0;
      const solde = (ev.total_amount||0) - paid;
      return [fmtDate(ev.event_date), ev.client_name||'', ev.client_phone||'', ev.event_type||'', ev.guest_count||0, (ev.total_amount||0).toFixed(2), paid.toFixed(2), solde.toFixed(2), ev.status||''];
    }),
    'Événements'
  );
  XLSX.utils.book_append_sheet(wb, wsEvents, 'Événements');

  /* Summary by month */
  const byMonth = {};
  (events||[]).forEach(ev => {
    const m = ev.event_date?.slice(0,7);
    if (!m) return;
    if (!byMonth[m]) byMonth[m] = { count: 0, revenue: 0 };
    byMonth[m].count++;
    byMonth[m].revenue += (ev.total_amount||0);
  });

  const wsMoyen = buildSheet(XLSX,
    ['Mois', 'Nb événements', 'Chiffre d\'affaires (MAD)'],
    Object.entries(byMonth).sort().map(([m, v]) => [m, v.count, v.revenue.toFixed(2)]),
    'Par mois'
  );
  XLSX.utils.book_append_sheet(wb, wsMoyen, 'Par mois');

  XLSX.writeFile(wb, `Rapport_Evenements_${year}.xlsx`);
}

/* 3 — RAPPORT DÉPENSES ANNUEL */
async function exportDepenses(XLSX, year) {
  const { start, end } = getYearRange(year);
  const { data: expenses } = await supabase.from('expenses').select('*').gte('date', start).lte('date', end).order('date');

  const wb = XLSX.utils.book_new();

  const wsAll = buildSheet(XLSX,
    ['Date', 'Catégorie', 'Description', 'Montant HT (MAD)', 'TVA (%)', 'Montant TVA', 'TTC'],
    (expenses||[]).map(e => {
      const ht  = e.tax_included ? (e.amount/(1+(e.tax_rate||0)/100)) : (e.amount);
      const ttc = e.tax_included ? e.amount : (e.amount + (e.tax_amount||0));
      return [fmtDate(e.date), e.category||'', e.description||'', ht.toFixed(2), e.tax_rate||0, (e.tax_amount||0).toFixed(2), ttc.toFixed(2)];
    }),
    'Dépenses'
  );
  XLSX.utils.book_append_sheet(wb, wsAll, 'Toutes les dépenses');

  /* By category */
  const byCat = {};
  (expenses||[]).forEach(e => {
    const c = e.category || 'other';
    if (!byCat[c]) byCat[c] = 0;
    byCat[c] += (e.amount||0);
  });
  const wsCat = buildSheet(XLSX,
    ['Catégorie', 'Total (MAD)', 'Part (%)'],
    (() => {
      const total = Object.values(byCat).reduce((s,v)=>s+v,0);
      return Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([c,v]) => [c, v.toFixed(2), total>0?`${((v/total)*100).toFixed(1)}%`:'0%']);
    })(),
    'Par catégorie'
  );
  XLSX.utils.book_append_sheet(wb, wsCat, 'Par catégorie');

  /* By month */
  const byMonth = {};
  (expenses||[]).forEach(e => {
    const m = e.date?.slice(0,7);
    if (!m) return;
    if (!byMonth[m]) byMonth[m] = 0;
    byMonth[m] += (e.amount||0);
  });
  const wsMon = buildSheet(XLSX,
    ['Mois', 'Total dépenses (MAD)'],
    Object.entries(byMonth).sort().map(([m,v]) => [m, v.toFixed(2)]),
    'Par mois'
  );
  XLSX.utils.book_append_sheet(wb, wsMon, 'Par mois');

  XLSX.writeFile(wb, `Rapport_Depenses_${year}.xlsx`);
}

/* 4 — RAPPORT PAIE ANNUEL */
async function exportPayroll(XLSX, year) {
  const { data: payroll } = await supabase.from('payroll').select('*, users(name)').gte('period', `${year}-01`).lte('period', `${year}-12`).order('period');

  const wb = XLSX.utils.book_new();

  const wsAll = buildSheet(XLSX,
    ['Période', 'Employé', 'Salaire base', 'Primes', 'Déductions', 'Salaire net', 'Statut', 'Date paiement'],
    (payroll||[]).map(p => [p.period||'', p.users?.name||'', (p.base_salary||0).toFixed(2), (p.bonuses||0).toFixed(2), (p.deductions||0).toFixed(2), (p.net_salary||0).toFixed(2), p.status||'', fmtDate(p.payment_date)]),
    'Paie'
  );
  XLSX.utils.book_append_sheet(wb, wsAll, 'Toutes les fiches');

  /* By employee */
  const byEmp = {};
  (payroll||[]).forEach(p => {
    const n = p.users?.name || 'Inconnu';
    if (!byEmp[n]) byEmp[n] = { total: 0, months: 0 };
    byEmp[n].total  += (p.net_salary||0);
    byEmp[n].months += 1;
  });
  const wsEmp = buildSheet(XLSX,
    ['Employé', 'Total versé (MAD)', 'Nb mois', 'Moyenne mensuelle'],
    Object.entries(byEmp).map(([n,v]) => [n, v.total.toFixed(2), v.months, (v.total/v.months).toFixed(2)]),
    'Par employé'
  );
  XLSX.utils.book_append_sheet(wb, wsEmp, 'Par employé');

  XLSX.writeFile(wb, `Rapport_Paie_${year}.xlsx`);
}

/* 5 — RAPPORT PROFIT PAR ÉVÉNEMENT */
async function exportProfit(XLSX, year) {
  const { start, end } = getYearRange(year);
  const { data: events } = await supabase.from('events').select('*').gte('event_date', start).lte('event_date', end).order('event_date');
  const { data: pays }   = await supabase.from('payments').select('event_id, amount');
  const { data: exps }   = await supabase.from('expenses').select('event_id, amount, category').not('event_id','is',null);

  const paidByEvent = {};
  (pays||[]).forEach(p => { paidByEvent[p.event_id]=(paidByEvent[p.event_id]||0)+(p.amount||0); });
  const expByEvent  = {};
  (exps||[]).forEach(e => { expByEvent[e.event_id]=(expByEvent[e.event_id]||0)+(e.amount||0); });

  const wb = XLSX.utils.book_new();

  const rows = (events||[]).map(ev => {
    const rev    = paidByEvent[ev.id]||0;
    const charge = expByEvent[ev.id]||0;
    const profit = rev - charge;
    const margin = rev>0 ? ((profit/rev)*100).toFixed(1)+'%' : '0%';
    return [fmtDate(ev.event_date), ev.client_name||'', ev.event_type||'', ev.guest_count||0, rev.toFixed(2), charge.toFixed(2), profit.toFixed(2), margin];
  });

  const ws = buildSheet(XLSX,
    ['Date', 'Client', 'Type', 'Invités', 'Recettes (MAD)', 'Charges (MAD)', 'Profit (MAD)', 'Marge (%)'],
    rows, 'Profit'
  );
  XLSX.utils.book_append_sheet(wb, ws, 'Profit par événement');

  /* Summary row */
  const totalRev    = (events||[]).reduce((s,ev)=>s+(paidByEvent[ev.id]||0),0);
  const totalCharge = (events||[]).reduce((s,ev)=>s+(expByEvent[ev.id]||0),0);
  const totalProfit = totalRev - totalCharge;
  const wsSummary   = buildSheet(XLSX,
    ['Indicateur', 'Valeur'],
    [
      ['Nombre d\'événements', (events||[]).length],
      ['Recettes totales (MAD)', totalRev.toFixed(2)],
      ['Charges totales (MAD)', totalCharge.toFixed(2)],
      ['Profit total (MAD)', totalProfit.toFixed(2)],
      ['Marge moyenne', totalRev>0?`${((totalProfit/totalRev)*100).toFixed(1)}%`:'0%'],
    ],
    'Résumé'
  );
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');

  XLSX.writeFile(wb, `Rapport_Profit_${year}.xlsx`);
}

/* 6 — RAPPORT CLIENTS */
async function exportClients(XLSX) {
  const { data: events } = await supabase.from('events').select('client_name, client_phone, event_date, total_amount, status, event_type').order('client_name');
  const { data: pays }   = await supabase.from('payments').select('event_id, amount');
  const paidByEvent = {};
  (pays||[]).forEach(p => { paidByEvent[p.event_id]=(paidByEvent[p.event_id]||0)+(p.amount||0); });

  // Group by client
  const clients = {};
  (events||[]).forEach(ev => {
    const n = ev.client_name || 'Inconnu';
    if (!clients[n]) clients[n] = { phone: ev.client_phone||'', events: 0, total: 0, paid: 0 };
    clients[n].events++;
    clients[n].total += (ev.total_amount||0);
    clients[n].paid  += (paidByEvent[ev.id]||0);
  });

  const wb = XLSX.utils.book_new();

  const ws = buildSheet(XLSX,
    ['Client', 'Téléphone', 'Nb événements', 'CA total (MAD)', 'Montant payé (MAD)', 'Solde (MAD)'],
    Object.entries(clients).map(([n,v]) => [n, v.phone, v.events, v.total.toFixed(2), v.paid.toFixed(2), (v.total-v.paid).toFixed(2)]),
    'Clients'
  );
  XLSX.utils.book_append_sheet(wb, ws, 'Clients');

  XLSX.writeFile(wb, `Rapport_Clients_Tous.xlsx`);
}

/* ═══════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════ */
export default function Rapport() {
  const { profile } = useContext(AuthContext);
  const canViewFinances = canDo(profile?.role, 'canViewFinances');
  const [month,  setMonth]  = useState(new Date().getMonth());
  const [year,   setYear]   = useState(new Date().getFullYear());
  const [toast,  setToast]  = useState(null);
  const [loading, setLoading] = useState({});

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleExport(key, fn) {
    setLoading(l => ({ ...l, [key]: true }));
    try {
      const XLSX = await loadXLSX();
      await fn(XLSX);
      showToast('✅ Fichier Excel téléchargé !');
    } catch (err) {
      console.error(err);
      showToast('❌ Erreur lors de l\'export', 'error');
    } finally {
      setLoading(l => ({ ...l, [key]: false }));
    }
  }

  const reports = [
    {
      key:   'financier',
      icon:  '📊',
      title: 'Rapport financier mensuel',
      desc:  'Résumé complet du mois : recettes, dépenses, paie, bénéfice net et marge.',
      sheets:['Résumé', 'Paiements', 'Dépenses', 'Paie du personnel'],
      period:'month',
      fn:    (XLSX) => exportFinancier(XLSX, month, year),
    },
    {
      key:   'evenements',
      icon:  '🎉',
      title: 'Rapport des événements',
      desc:  'Liste complète des événements de l\'année avec recettes, soldes et répartition mensuelle.',
      sheets:['Événements', 'Par mois'],
      period:'year',
      fn:    (XLSX) => exportEvenements(XLSX, year),
    },
    {
      key:   'depenses',
      icon:  '💳',
      title: 'Rapport des dépenses',
      desc:  'Toutes les dépenses de l\'année avec détail TVA, répartition par catégorie et par mois.',
      sheets:['Toutes les dépenses', 'Par catégorie', 'Par mois'],
      period:'year',
      fn:    (XLSX) => exportDepenses(XLSX, year),
    },
    {
      key:   'paie',
      icon:  '👷',
      title: 'Rapport de paie annuel',
      desc:  'Récapitulatif des salaires versés par mois et par employé sur l\'année.',
      sheets:['Toutes les fiches', 'Par employé'],
      period:'year',
      fn:    (XLSX) => exportPayroll(XLSX, year),
    },
    {
      key:   'profit',
      icon:  '📈',
      title: 'Rapport profit par événement',
      desc:  'Analyse de rentabilité : recettes, charges directes, profit net et marge par événement.',
      sheets:['Profit par événement', 'Résumé'],
      period:'year',
      fn:    (XLSX) => exportProfit(XLSX, year),
    },
    {
      key:   'clients',
      icon:  '👥',
      title: 'Rapport clients',
      desc:  'Vue consolidée de tous vos clients avec chiffre d\'affaires, paiements et soldes.',
      sheets:['Clients'],
      period:'none',
      fn:    (XLSX) => exportClients(XLSX),
    },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (!canViewFinances) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
      <p style={{ fontSize: 15, color: '#888' }}>Accès réservé — vous n'avez pas la permission de consulter les rapports financiers.</p>
    </div>
  );

  return (
    <>
      <style>{styles}</style>

      {toast && (
        <div className={toast.type === 'error' ? 'error-toast' : 'success-toast'}>
          {toast.msg}
        </div>
      )}

      <div className="rapport-wrapper">
        <div className="rapport-header">
          <h1 className="rapport-title">
            <span className="icon">📥</span>
            Rapports & Exports
          </h1>
        </div>
        <p className="rapport-subtitle">Exportez vos données en fichiers Excel prêts pour votre comptable ou vos archives.</p>

        {/* Period selector */}
        <div className="period-bar">
          <label>Mois</label>
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))}>
            {MONTHS_FR.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <label>Année</label>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 8 }}>
            Période sélectionnée : <b style={{ color: '#0891b2' }}>{MONTHS_FR[month]} {year}</b>
          </span>
        </div>

        {/* Reports grid */}
        <p className="section-title">Rapports disponibles</p>
        <div className="reports-grid">
          {reports.map(r => (
            <div key={r.key} className="report-card">
              <div className="report-card-header">
                <div className="report-card-icon">{r.icon}</div>
                <div className="report-card-title">{r.title}</div>
                <div className="report-card-desc">{r.desc}</div>
              </div>
              <div className="report-card-sheets">
                {r.sheets.map(s => (
                  <span key={s} className="sheet-chip">📄 {s}</span>
                ))}
              </div>
              <div className="report-card-footer">
                <span className="export-hint">
                  {r.period === 'month' && `${MONTHS_FR[month]} ${year}`}
                  {r.period === 'year'  && `Année ${year}`}
                  {r.period === 'none'  && 'Tous les temps'}
                </span>
                <button
                  className={`btn-export${loading[r.key] ? ' loading' : ''}`}
                  onClick={() => handleExport(r.key, r.fn)}
                  disabled={!!loading[r.key]}
                >
                  {loading[r.key] ? '⏳ Export…' : '⬇️ Exporter Excel'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info box */}
        <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 12, padding: '16px 20px', marginTop: 8, fontSize: 13, color: '#0369a1' }}>
          <b>💡 Comment utiliser ces rapports :</b>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, lineHeight: 2 }}>
            <li>Les fichiers téléchargés sont en format <b>.xlsx</b> — compatibles avec Excel, Google Sheets et LibreOffice</li>
            <li>Le <b>Rapport financier mensuel</b> est idéal à envoyer à votre comptable chaque fin de mois</li>
            <li>Le <b>Rapport profit</b> nécessite que vous ayez lié des dépenses aux événements (onglet Dépenses)</li>
            <li>Tous les montants sont en <b>MAD</b> avec détail TVA</li>
          </ul>
        </div>
      </div>
    </>
  );
}
