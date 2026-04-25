import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

const S = {
  wrap:       { minHeight: '100vh', background: '#f9f8f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, direction: 'ltr', textAlign: 'left' },
  card:       { background: '#fff', borderRadius: 16, padding: 40, width: '100%', maxWidth: 560, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', direction: 'ltr', textAlign: 'left' },
  logo:       { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 },
  logoDot:    { width: 10, height: 10, borderRadius: '50%', background: '#2d6a4f' },
  logoText:   { fontSize: 18, fontWeight: 700, color: '#1a1a18' },
  title:      { fontSize: 22, fontWeight: 700, color: '#1a1a18', marginBottom: 4 },
  subtitle:   { fontSize: 14, color: '#888', marginBottom: 28 },
  formRow:    { marginBottom: 16 },
  label:      { fontSize: 12, color: '#555', marginBottom: 4, display: 'block', fontWeight: 500 },
  input:      { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' },
  inputErr:   { borderColor: '#c0392b' },
  errSpan:    { color: '#c0392b', fontSize: 11, marginTop: 3, display: 'block' },
  row2:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  pwWrap:     { position: 'relative' },
  pwToggle:   { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888', padding: 0 },
  btnPrimary: { background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: 8 },
  successBox: { background: '#f0fdf4', border: '1px solid #c3e6d4', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#166534', marginBottom: 16 },
  errorBox:   { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#dc2626', marginBottom: 16 },
  foot:       { marginTop: 20, textAlign: 'center', fontSize: 13, color: '#888' },
  link:       { color: '#2d6a4f', textDecoration: 'none', fontWeight: 600 },
  badge:      { background: '#f0fdf4', border: '1px solid #c3e6d4', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#166534', textAlign: 'center', marginBottom: 20 },
};

const emptyForm = {
  businessName: '', adminName: '', email: '', password: '',
  confirmPassword: '', city: '', plan: 'croissance',
};

function slugify(name) {
  return name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 50);
}

function validate(form) {
  const e = {};
  if (!form.businessName.trim() || form.businessName.trim().length < 2)
    e.businessName = 'Le nom du traiteur doit contenir au moins 2 caractères';
  if (!form.adminName.trim())
    e.adminName = 'Votre nom est obligatoire';
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    e.email = 'Adresse email invalide';
  if (!form.password || form.password.length < 8)
    e.password = 'Le mot de passe doit contenir au moins 8 caractères';
  if (form.confirmPassword !== form.password)
    e.confirmPassword = 'Les mots de passe ne correspondent pas';
  return e;
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  async function handleSubmit() {
    const e = validate(form);
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setSaving(true);

    const newBizId = crypto.randomUUID();
    const slug = slugify(form.businessName.trim());

    // STEP 1 — Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
    });

    if (authError) {
      setBanner({ type: 'error', text: authError.message });
      setSaving(false);
      return;
    }

    const newUserId = authData.user.id;

    // STEP 2 — Insert into users table using the real Auth UUID
    const { error: userErr } = await supabase.from('users').insert({
      id: newUserId,
      name: form.adminName.trim(),
      email: form.email.trim().toLowerCase(),
      password_hash: 'supabase_auth',
      role: 'admin',
      business_id: newBizId,
      is_active: true,
    });

    if (userErr) {
      setBanner({ type: 'error', text: userErr.message });
      setSaving(false);
      return;
    }

    const { error: subErr } = await supabase.from('subscriptions').insert({
      business_id: newBizId,
      plan_id: form.plan,
    });

    if (subErr) {
      setBanner({ type: 'error', text: subErr.message });
      setSaving(false);
      return;
    }

    const { error: bpErr } = await supabase.from('business_profiles').insert({
      slug: slug,
      business_name: form.businessName.trim(),
      business_id: newBizId,
      hostname: slug + '.traiteur-pro.com',
      onboarding_complete: false,
    });

    if (bpErr) {
      setBanner({ type: 'error', text: bpErr.message });
      setSaving(false);
      return;
    }

    // STEP 4 — Sign out so the new user can log in fresh
    await supabase.auth.signOut();

    setBanner({ type: 'success', text: '✅ Compte créé ! Connectez-vous avec votre email.' });
    setSaving(false);
    setTimeout(() => navigate('/login'), 3000);
  }

  return (
    <div style={S.wrap}>
      <div style={S.card}>

        <div style={S.logo}>
          <div style={S.logoDot} />
          <span style={S.logoText}>Traiteur Pro</span>
        </div>

        <p style={S.title}>Créer votre compte</p>
        <p style={S.subtitle}>Démarrez en 2 minutes — sans carte bancaire.</p>

        <div style={S.badge}>🎁 Essai gratuit 14 jours · Toutes fonctionnalités incluses</div>

        {banner && (
          <div style={banner.type === 'success' ? S.successBox : S.errorBox}>
            {banner.text}
          </div>
        )}

        {/* Business + Admin name */}
        <div style={S.row2}>
          <div style={S.formRow}>
            <label style={S.label}>Nom du traiteur *</label>
            <input
              style={{ ...S.input, ...(errors.businessName ? S.inputErr : {}) }}
              placeholder="ex: Traiteur Al Baraka"
              value={form.businessName}
              onChange={e => set('businessName', e.target.value)}
            />
            {errors.businessName && <span style={S.errSpan}>{errors.businessName}</span>}
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Votre nom *</label>
            <input
              style={{ ...S.input, ...(errors.adminName ? S.inputErr : {}) }}
              placeholder="Mohamed Alami"
              value={form.adminName}
              onChange={e => set('adminName', e.target.value)}
            />
            {errors.adminName && <span style={S.errSpan}>{errors.adminName}</span>}
          </div>
        </div>

        {/* Email */}
        <div style={S.formRow}>
          <label style={S.label}>Email professionnel *</label>
          <input
            type="email"
            style={{ ...S.input, ...(errors.email ? S.inputErr : {}) }}
            placeholder="contact@montraiteur.ma"
            value={form.email}
            onChange={e => set('email', e.target.value)}
          />
          {errors.email && <span style={S.errSpan}>{errors.email}</span>}
        </div>

        {/* Password */}
        <div style={S.row2}>
          <div style={S.formRow}>
            <label style={S.label}>Mot de passe * (min 8 car.)</label>
            <div style={S.pwWrap}>
              <input
                type={showPw ? 'text' : 'password'}
                style={{ ...S.input, paddingRight: 40, ...(errors.password ? S.inputErr : {}) }}
                placeholder="••••••••"
                value={form.password}
                onChange={e => set('password', e.target.value)}
              />
              <button style={S.pwToggle} onClick={() => setShowPw(v => !v)} type="button">
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && <span style={S.errSpan}>{errors.password}</span>}
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Confirmer le mot de passe *</label>
            <div style={S.pwWrap}>
              <input
                type={showPw2 ? 'text' : 'password'}
                style={{ ...S.input, paddingRight: 40, ...(errors.confirmPassword ? S.inputErr : {}) }}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)}
              />
              <button style={S.pwToggle} onClick={() => setShowPw2(v => !v)} type="button">
                {showPw2 ? '🙈' : '👁'}
              </button>
            </div>
            {errors.confirmPassword && <span style={S.errSpan}>{errors.confirmPassword}</span>}
          </div>
        </div>

        {/* Ville + Plan */}
        <div style={S.row2}>
          <div style={S.formRow}>
            <label style={S.label}>Ville</label>
            <input
              style={S.input}
              placeholder="Agadir"
              value={form.city}
              onChange={e => set('city', e.target.value)}
            />
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Plan</label>
            <select style={S.input} value={form.plan} onChange={e => set('plan', e.target.value)}>
              <option value="essentiel">Essentiel — 199 MAD/mois</option>
              <option value="croissance">Croissance — 399 MAD/mois</option>
              <option value="elite">Élite — 699 MAD/mois</option>
            </select>
          </div>
        </div>

        <button style={{ ...S.btnPrimary, opacity: saving ? 0.65 : 1 }} onClick={handleSubmit} disabled={saving}>
          {saving ? 'Création en cours...' : 'Créer mon compte →'}
        </button>

        <div style={S.foot}>
          <div style={{ marginBottom: 6, fontSize: 12, color: '#aaa' }}>
            Essai gratuit 14 jours · Sans carte bancaire
          </div>
          Déjà un compte ?{' '}
          <Link to="/login" style={S.link}>Connexion →</Link>
        </div>

      </div>
    </div>
  );
}
