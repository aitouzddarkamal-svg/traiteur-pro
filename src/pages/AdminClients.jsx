import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PLAN_LABELS = { essentiel: 'Essentiel', croissance: 'Croissance', elite: 'Élite' };
const PLAN_COLORS = {
  essentiel:  { bg: '#f0f9ff', color: '#0369a1' },
  croissance: { bg: '#f0fdf4', color: '#166534' },
  elite:      { bg: '#fdf4ff', color: '#7e22ce' },
};

const S = {
  page:      { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  title:     { fontSize: '1.5rem', fontWeight: '700', color: '#1a1a18', margin: 0 },
  subtitle:  { fontSize: '0.85rem', color: '#888', marginTop: 4 },
  statGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 },
  statBox:   { background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '16px', textAlign: 'center' },
  statNum:   { fontSize: 26, fontWeight: 700, color: '#2d6a4f' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  table:     { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8e8e8' },
  th:        { fontSize: 11, fontWeight: 600, color: '#888', textAlign: 'left', padding: '10px 14px', borderBottom: '2px solid #f0f0f0', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#fafafa' },
  td:        { fontSize: 13, padding: '12px 14px', borderBottom: '1px solid #f5f5f5', verticalAlign: 'middle' },
  badge:     { display: 'inline-block', fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 600 },
  btnSm:     { background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' },
  btnGhost:  { background: 'transparent', color: '#555', border: '1px solid #ddd', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  accessDenied: { textAlign: 'center', padding: '80px 20px' },
};

export default function AdminClients() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isOwner = profile?.email === 'kamal@moorish-automation.com';

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (isOwner) loadClients(); else setLoading(false); }, []);

  async function loadClients() {
    setLoading(true);

    const { data: businesses } = await supabase
      .from('business_profiles')
      .select('id, slug, business_name, business_id, hostname, created_at');

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('business_id, plan_id, status');

    const { data: admins } = await supabase
      .from('users')
      .select('business_id, name, email, role')
      .eq('role', 'admin');

    const merged = (businesses || []).map(bp => {
      const sub = (subscriptions || []).find(s => s.business_id === bp.business_id);
      const admin = (admins || []).find(u => u.business_id === bp.business_id);
      return {
        ...bp,
        plan_id: sub?.plan_id || 'essentiel',
        admin_name: admin?.name || '—',
        admin_email: admin?.email || '—',
      };
    });

    setClients(merged);
    setLoading(false);
  }

  if (!isOwner) return (
    <div style={S.accessDenied}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
      <p style={{ fontSize: 15, color: '#888' }}>Accès réservé à l'administrateur Traiteur Pro.</p>
    </div>
  );

  const totalClients = clients.length;
  const byPlan = plan => clients.filter(c => c.plan_id === plan).length;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Dashboard Admin — Clients</h1>
          <p style={S.subtitle}>Vue complète de tous vos clients Traiteur Pro · Moorish Automation</p>
        </div>
        <button style={S.btnSm} onClick={() => navigate('/settings?tab=nouveau-client')}>
          + Nouveau client
        </button>
      </div>

      <div style={S.statGrid}>
        <div style={S.statBox}><div style={S.statNum}>{totalClients}</div><div style={S.statLabel}>Clients total</div></div>
        <div style={S.statBox}><div style={{ ...S.statNum, color: '#0369a1' }}>{byPlan('essentiel')}</div><div style={S.statLabel}>Plan Essentiel</div></div>
        <div style={S.statBox}><div style={{ ...S.statNum, color: '#166534' }}>{byPlan('croissance')}</div><div style={S.statLabel}>Plan Croissance</div></div>
        <div style={S.statBox}><div style={{ ...S.statNum, color: '#7e22ce' }}>{byPlan('elite')}</div><div style={S.statLabel}>Plan Élite</div></div>
      </div>

      {loading ? <p style={{ color: '#888' }}>Chargement...</p> : (
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Traiteur</th>
              <th style={S.th}>Admin</th>
              <th style={S.th}>Email</th>
              <th style={S.th}>Plan</th>
              <th style={S.th}>URL</th>
              <th style={S.th}>Créé le</th>
              <th style={S.th}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => {
              const pc = PLAN_COLORS[c.plan_id] || { bg: '#f5f5f5', color: '#555' };
              return (
                <tr key={c.id}>
                  <td style={S.td}><div style={{ fontWeight: 600 }}>{c.business_name}</div><div style={{ fontSize: 11, color: '#aaa' }}>{c.slug}</div></td>
                  <td style={S.td}>{c.admin_name}</td>
                  <td style={{ ...S.td, fontSize: 12, color: '#555' }}>{c.admin_email}</td>
                  <td style={S.td}><span style={{ ...S.badge, background: pc.bg, color: pc.color }}>{PLAN_LABELS[c.plan_id] || c.plan_id}</span></td>
                  <td style={{ ...S.td, fontSize: 11 }}><a href={`https://${c.hostname}`} target="_blank" rel="noreferrer" style={{ color: '#2d6a4f' }}>{c.hostname}</a></td>
                  <td style={{ ...S.td, fontSize: 12, color: '#888' }}>{c.created_at ? new Date(c.created_at).toLocaleDateString('fr-MA') : '—'}</td>
                  <td style={S.td}><span style={{ ...S.badge, background: '#f0fdf4', color: '#166534' }}>Actif</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
