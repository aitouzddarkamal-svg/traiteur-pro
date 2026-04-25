import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const S = {
  wrap:       { minHeight: '100vh', background: '#f9f8f5', padding: '24px 16px' },
  card:       { background: '#fff', borderRadius: 16, padding: 32, maxWidth: 680, margin: '0 auto', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid #f0f0f0' },
  logo:       { display: 'flex', alignItems: 'center', gap: 8 },
  logoDot:    { width: 10, height: 10, borderRadius: '50%', background: '#2d6a4f' },
  logoText:   { fontSize: 18, fontWeight: 700, color: '#1a1a18' },
  bizName:    { fontSize: 13, color: '#888', marginTop: 2 },
  badge:      { background: '#f0fdf4', color: '#166534', border: '1px solid #c3e6d4', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 500 },
  title:      { fontSize: 22, fontWeight: 700, color: '#1a1a18', marginBottom: 4 },
  meta:       { fontSize: 13, color: '#888', marginBottom: 24 },
  section:    { marginBottom: 24 },
  secTitle:   { fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { fontSize: 11, fontWeight: 600, color: '#888', textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #f0f0f0', textTransform: 'uppercase' },
  td:         { fontSize: 13, padding: '12px 12px', borderBottom: '1px solid #f8f8f8' },
  totals:     { background: '#f9f8f5', borderRadius: 10, padding: 16, marginTop: 20 },
  totalRow:   { display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: '#555' },
  totalFinal: { display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#1a1a18', paddingTop: 8, borderTop: '2px solid #e5e4e0', marginTop: 8 },
  footer:     { marginTop: 32, paddingTop: 20, borderTop: '1px solid #f0f0f0', textAlign: 'center', fontSize: 12, color: '#aaa' },
  error:      { textAlign: 'center', padding: '60px 20px', color: '#888' },
  btnWA:      { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25D366', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%', marginTop: 20 },
};

const fmt = n => Number(n || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DevisPublic() {
  const { token } = useParams();
  const [devis, setDevis] = useState(null);
  const [biz, setBiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('devis')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setDevis(data);

      const { data: bp } = await supabase
        .from('business_profiles')
        .select('business_name, phone, email, ice, if_num, rc')
        .eq('business_id', data.business_id)
        .maybeSingle();
      setBiz(bp);
      setLoading(false);
    }
    load();
  }, [token]);

  if (loading) return (
    <div style={S.error}>
      <p>Chargement du devis...</p>
    </div>
  );

  if (notFound) return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={S.error}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Devis introuvable</p>
          <p>Ce lien est invalide ou a expiré.</p>
        </div>
      </div>
    </div>
  );

  const items = Array.isArray(devis.items) ? devis.items : [];
  const tvaAmt = (devis.total_ht * (parseFloat(devis.tva_rate) / 100));

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={S.header}>
          <div>
            <div style={S.logo}>
              <div style={S.logoDot} />
              <span style={S.logoText}>{biz?.business_name || 'Traiteur Pro'}</span>
            </div>
            {biz?.phone && <div style={S.bizName}>📞 {biz.phone}</div>}
            {biz?.email && <div style={S.bizName}>✉️ {biz.email}</div>}
            {biz?.ice && <div style={S.bizName}>ICE: {biz.ice}</div>}
          </div>
          <span style={S.badge}>
            {devis.status === 'accepted' ? '✅ Accepté' : devis.status === 'sent' ? '📤 Envoyé' : '📋 Devis'}
          </span>
        </div>

        <h2 style={S.title}>Devis — {devis.client_name}</h2>
        <p style={S.meta}>
          📅 Date événement : {devis.event_date ? new Date(devis.event_date).toLocaleDateString('fr-MA') : '—'}
          {devis.valid_until && ` · Valable jusqu'au : ${new Date(devis.valid_until).toLocaleDateString('fr-MA')}`}
        </p>

        {items.length > 0 && (
          <div style={S.section}>
            <p style={S.secTitle}>Détail des prestations</p>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Description</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Qté</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Prix unit.</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td style={S.td}>{item.description || item.name}</td>
                    <td style={{ ...S.td, textAlign: 'right' }}>{item.quantity || 1}</td>
                    <td style={{ ...S.td, textAlign: 'right' }}>{fmt(item.unit_price || item.price)} MAD</td>
                    <td style={{ ...S.td, textAlign: 'right', fontWeight: 500 }}>
                      {fmt((item.quantity || 1) * (item.unit_price || item.price || 0))} MAD
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={S.totals}>
          <div style={S.totalRow}>
            <span>Sous-total HT</span>
            <span>{fmt(devis.total_ht)} MAD</span>
          </div>
          <div style={S.totalRow}>
            <span>TVA ({devis.tva_rate}%)</span>
            <span>{fmt(tvaAmt)} MAD</span>
          </div>
          <div style={S.totalFinal}>
            <span>TOTAL TTC</span>
            <span>{fmt(devis.total_ttc || devis.total_ht + tvaAmt)} MAD</span>
          </div>
        </div>

        {devis.notes && (
          <div style={{ ...S.section, marginTop: 20, background: '#f9f8f5', borderRadius: 8, padding: 14 }}>
            <p style={S.secTitle}>Notes</p>
            <p style={{ fontSize: 13, color: '#555' }}>{devis.notes}</p>
          </div>
        )}

        <button style={S.btnWA} onClick={() => {
          const msg = `Bonjour, merci de consulter votre devis Traiteur Pro :\n${window.location.href}`;
          window.open('https://wa.me/?text=' + encodeURIComponent(msg));
        }}>
          📲 Partager ce devis via WhatsApp
        </button>

        <div style={S.footer}>
          Propulsé par <strong>Traiteur Pro</strong> · Moorish Automation
        </div>
      </div>
    </div>
  );
}
