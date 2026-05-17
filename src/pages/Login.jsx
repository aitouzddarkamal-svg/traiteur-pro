import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F2', direction: 'ltr', textAlign: 'left' }}>
      <div style={{ background: '#fff', borderRadius: '14px', padding: '2.5rem', width: '100%', maxWidth: '400px', boxShadow: '0 4px 24px rgba(107,39,55,0.08)', direction: 'ltr', textAlign: 'left' }}>

        {/* Logo + Titre */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#6B2737', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#FAF7F2', fontSize: '22px', fontWeight: '600' }}>T</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#2C1810', marginBottom: '4px' }}>Traiteur Pro</h1>
          <p style={{ fontSize: '14px', color: '#8B6F6F' }}>Connectez-vous à votre espace</p>
        </div>

        {/* Bannière essai 30 jours */}
        <div style={{ background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '1.5rem', textAlign: 'center', direction: 'ltr', unicodeBidi: 'embed' }}>
          <span style={{
            fontSize: '13px',
            color: '#6B2737',
            fontWeight: '600',
            direction: 'ltr',
            unicodeBidi: 'embed',
            display: 'inline-block'
          }}>
            🎁 30 jours d&apos;essai gratuit · Sans carte bancaire
          </span>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', fontSize: '14px', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#2C1810' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@traiteur-pro.com"
              required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ddd0', borderRadius: '8px', fontSize: '14px', background: '#FAF7F2', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#2C1810' }}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e8ddd0', borderRadius: '8px', fontSize: '14px', background: '#FAF7F2', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '11px', background: loading ? '#a08040' : '#6B2737', color: '#FAF7F2', borderRadius: '8px', fontSize: '15px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', border: 'none' }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#8B6F6F', marginTop: '1.5rem' }}>
          Traiteur Marocain © 2026
        </p>
      </div>
    </div>
  )
}
