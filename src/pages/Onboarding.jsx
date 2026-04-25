import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const S = {
  wrap:       { minHeight: '100vh', background: '#f9f8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, direction: 'ltr', textAlign: 'left' },
  card:       { background: '#fff', borderRadius: 16, padding: 40, width: '100%', maxWidth: 560, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', direction: 'ltr', textAlign: 'left' },
  logo:       { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 },
  logoDot:    { width: 10, height: 10, borderRadius: '50%', background: '#2d6a4f' },
  logoText:   { fontSize: 18, fontWeight: 700, color: '#1a1a18' },
  progress:   { display: 'flex', gap: 8, marginBottom: 32 },
  step:       { height: 4, flex: 1, borderRadius: 2, background: '#e5e4e0' },
  stepActive: { background: '#2d6a4f' },
  title:      { fontSize: 22, fontWeight: 700, color: '#1a1a18', marginBottom: 6 },
  subtitle:   { fontSize: 14, color: '#888', marginBottom: 28 },
  formRow:    { marginBottom: 16 },
  label:      { fontSize: 12, color: '#555', marginBottom: 4, display: 'block', fontWeight: 500 },
  input:      { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  row2:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  btnPrimary: { background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' },
  btnSkip:    { background: 'transparent', color: '#888', border: 'none', fontSize: 13, cursor: 'pointer', width: '100%', marginTop: 10, textDecoration: 'underline' },
  btnRow:     { display: 'flex', gap: 10, marginTop: 8 },
  btnBack:    { background: 'transparent', color: '#555', border: '1px solid #ddd', borderRadius: 8, padding: '12px 24px', fontSize: 14, cursor: 'pointer', flex: 1 },
  infoBox:    { background: '#f0fdf4', border: '1px solid #c3e6d4', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534', marginBottom: 16 },
};

const STEPS = ['Entreprise', 'Légal', 'Prêt !'];

export default function Onboarding() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    business_name: '', phone: '', whatsapp: '',
    address: '', city: '', ice: '', if_num: '', rc: '', tva_default: '20',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function saveAndNext() {
    if (step === 0) {
      if (!form.business_name.trim() || !form.phone.trim()) return;
      setStep(1);
    } else if (step === 1) {
      setSaving(true);
      const { data: bp } = await supabase
        .from('business_profiles').select('id')
        .eq('business_id', profile.business_id).maybeSingle();
      if (bp) {
        await supabase.from('business_profiles').update({
          business_name: form.business_name,
          phone: form.phone,
          whatsapp: form.whatsapp || form.phone,
          address: form.address,
          ice: form.ice || null,
          if_num: form.if_num || null,
          rc: form.rc || null,
          tva_default: form.tva_default,
          onboarding_complete: true,
        }).eq('id', bp.id);
      }
      setSaving(false);
      setStep(2);
    } else {
      navigate('/');
    }
  }

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={S.logo}>
          <div style={S.logoDot} />
          <span style={S.logoText}>Traiteur Pro</span>
        </div>
        <div style={S.progress}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: i <= step ? '#2d6a4f' : '#bbb', marginBottom: 4, fontWeight: 500 }}>{i + 1}. {s}</div>
              <div style={{ ...S.step, ...(i <= step ? S.stepActive : {}) }} />
            </div>
          ))}
        </div>
        {step === 0 && (
          <>
            <p style={S.title}>Bienvenue sur Traiteur Pro 👋</p>
            <p style={S.subtitle}>Configurez votre espace en 2 minutes.</p>
            <div style={S.formRow}>
              <label style={S.label}>Nom du traiteur *</label>
              <input style={S.input} value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="ex: Traiteur Al Baraka" />
            </div>
            <div style={S.row2}>
              <div style={S.formRow}>
                <label style={S.label}>Téléphone *</label>
                <input style={S.input} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="06 xx xx xx xx" />
              </div>
              <div style={S.formRow}>
                <label style={S.label}>Ville</label>
                <input style={S.input} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Agadir" />
              </div>
            </div>
            <div style={S.formRow}>
              <label style={S.label}>Adresse</label>
              <input style={S.input} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Quartier, rue..." />
            </div>
            <button style={{ ...S.btnPrimary, opacity: (!form.business_name || !form.phone) ? 0.5 : 1 }}
              onClick={saveAndNext} disabled={!form.business_name || !form.phone}>
              Continuer →
            </button>
          </>
        )}
        {step === 1 && (
          <>
            <p style={S.title}>Informations légales</p>
            <p style={S.subtitle}>Optionnel — ajoutez-les plus tard dans Paramètres.</p>
            {profile?.plan_id !== 'essentiel' ? (
              <>
                <div style={S.infoBox}>Ces informations apparaissent sur vos factures DGI.</div>
                <div style={S.row2}>
                  <div style={S.formRow}><label style={S.label}>ICE</label><input style={S.input} value={form.ice} onChange={e => set('ice', e.target.value)} placeholder="002345678000045" maxLength={20} /></div>
                  <div style={S.formRow}><label style={S.label}>IF</label><input style={S.input} value={form.if_num} onChange={e => set('if_num', e.target.value)} placeholder="12345678" maxLength={20} /></div>
                </div>
                <div style={S.row2}>
                  <div style={S.formRow}><label style={S.label}>RC</label><input style={S.input} value={form.rc} onChange={e => set('rc', e.target.value)} placeholder="45678" maxLength={20} /></div>
                  <div style={S.formRow}>
                    <label style={S.label}>TVA par défaut</label>
                    <select style={S.input} value={form.tva_default} onChange={e => set('tva_default', e.target.value)}>
                      <option value="20">20% — Taux normal</option>
                      <option value="14">14%</option>
                      <option value="10">10%</option>
                      <option value="7">7%</option>
                      <option value="0">0% — Exonéré</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <div style={S.infoBox}>Plan Essentiel — informations légales non requises.</div>
            )}
            <div style={S.btnRow}>
              <button style={S.btnBack} onClick={() => setStep(0)}>← Retour</button>
              <button style={{ ...S.btnPrimary, flex: 2 }} onClick={saveAndNext} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Terminer →'}
              </button>
            </div>
            <button style={S.btnSkip} onClick={saveAndNext}>Passer — je le ferai plus tard</button>
          </>
        )}
        {step === 2 && (
          <>
            <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>✅</div>
            <p style={{ ...S.title, textAlign: 'center' }}>Votre espace est prêt !</p>
            <p style={{ ...S.subtitle, textAlign: 'center' }}>Voici vos premières étapes recommandées.</p>
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 8 }}>Par où commencer :</p>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>1. 🍽 Ajoutez vos plats dans Plats</p>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>2. 📦 Ajoutez vos ingrédients dans Stock</p>
              <p style={{ fontSize: 13, color: '#555' }}>3. 📅 Créez votre premier événement</p>
            </div>
            <button style={S.btnPrimary} onClick={() => navigate('/')}>Accéder au tableau de bord →</button>
          </>
        )}
      </div>
    </div>
  );
}
