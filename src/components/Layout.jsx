import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPlanNav } from '../lib/plans'
import { useLang } from '../context/LangContext'
import { t } from '../lib/i18n'
import LangToggle from './LangToggle'

const navRoutes = {
  dashboard:    '/',
  calculateur:  '/calculateur',
  plats:        '/plats',
  evenements:   '/evenements',
  devis:        '/devis',
  paiements:    '/paiements',
  liste:        '/liste-courses',
  stock:        '/stock',
  artdelatable: '/art-de-la-table',
  patisserie:   '/patisserie',
  personnel:    '/personnel',
  comptabilite: '/comptabilite',
  settings:     '/settings',
  factures:     '/factures',
  rapports:     '/rapports',
  admin:        '/admin',
}

const navIcons = {
  dashboard:   '🏠',
  calculateur: '🧮',
  plats:       '🍽',
  evenements:  '📅',
  devis:       '📄',
  paiements:   '💰',
  liste:       '🛒',
  stock:       '📦',
  artdelatable:'🫖',
  patisserie:  '🍯',
  personnel:   '👥',
  comptabilite:'📊',
  factures:    '🧾',
  rapports:    '📈',
  settings:    '⚙️',
  admin:       '👑',
}

const navLabels = {
  dashboard:   'Tableau de bord',
  calculateur: 'Calculateur',
  plats:       'Plats',
  evenements:  'Événements',
  devis:       'Devis',
  paiements:   'Paiements',
  liste:       'Liste de courses',
  stock:       'Stock',
  artdelatable:'Art de la Table',
  patisserie:  'Pâtisserie',
  personnel:   'Personnel',
  comptabilite:'Comptabilité',
  factures:    'Factures',
  rapports:    'Rapports',
  settings:    'Paramètres',
  admin:       'Mes clients',
}

const DemoBanner = () => (
  <div style={{
    background: '#f59e0b',
    color: '#fff',
    textAlign: 'center',
    padding: '7px 1rem',
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '0.2px',
    flexShrink: 0,
  }}>
    🎯 Compte démo — Les données sont fictives. Explorez librement !
  </div>
)

const UpgradeBanner = () => (
  <div style={{
    background: '#1a3a2a',
    color: '#4ade80',
    padding: '6px 16px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flexShrink: 0,
  }}>
    🚀 Passez au Plan Croissance pour débloquer la gestion d'événements
    <button
      onClick={() => window.location.href = '/settings'}
      style={{
        background: '#4ade80',
        color: '#000',
        border: 'none',
        borderRadius: 4,
        padding: '2px 10px',
        fontSize: '11px',
        fontWeight: '700',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      Upgrader
    </button>
  </div>
)

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const navItems = getPlanNav(profile?.plan_id).map(key => ({ key }))
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) setMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function handleNav(path) {
    navigate(path)
    setMenuOpen(false)
  }

  const activeKey = Object.entries(navRoutes).find(([, path]) => path === location.pathname)?.[0] || 'dashboard'

  const SidebarContent = () => {
    const { lang, toggleLang } = useLang()
    return (
      <>
        {/* Logo */}
        <div style={{ padding: '0 1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>T</span>
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>Traiteur Pro</div>
              <div style={{ fontSize: '11px', opacity: 0.7, color: '#fff' }}>Gestion traiteur</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
          {[
            ...navItems,
            ...(profile?.email === 'kamal@moorish-automation.com' ? [{ key: 'admin' }] : []),
          ].map(item => {
            const isActive = activeKey === item.key
            return (
              <div
                key={item.key}
                onClick={() => handleNav(navRoutes[item.key] || '/')}
                style={{
                  padding: '11px 1.5rem',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
                  fontWeight: isActive ? '600' : '400',
                  color: '#fff',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: '17px' }}>{navIcons[item.key] || '•'}</span>
                {t(lang, item.key) || navLabels[item.key] || item.key}
              </div>
            )
          })}
        </nav>

        {/* User + Déconnexion */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff', marginBottom: '2px' }}>{profile?.name}</div>
          <div style={{ fontSize: '11px', opacity: 0.6, color: '#fff', marginBottom: '12px', textTransform: 'capitalize' }}>{profile?.role}</div>
          {lang === 'fr' ? (
            <button onClick={toggleLang} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1.5px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.08)',
              cursor: 'pointer',
            }}>
              <img src="https://flagcdn.com/w20/fr.png"
                   width="20" height="14"
                   style={{borderRadius:'2px', opacity:1}}
                   alt="FR" />
              <span style={{color:'rgba(255,255,255,0.3)', fontSize:'11px'}}>|</span>
              <img src="https://flagcdn.com/w20/ma.png"
                   width="20" height="14"
                   style={{borderRadius:'2px', opacity:0.35}}
                   alt="MA" />
            </button>
          ) : (
            <button onClick={toggleLang} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1.5px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.08)',
              cursor: 'pointer',
            }}>
              <img src="https://flagcdn.com/w20/fr.png"
                   width="20" height="14"
                   style={{borderRadius:'2px', opacity:0.35}}
                   alt="FR" />
              <span style={{color:'rgba(255,255,255,0.3)', fontSize:'11px'}}>|</span>
              <img src="https://flagcdn.com/w20/ma.png"
                   width="20" height="14"
                   style={{borderRadius:'2px', opacity:1}}
                   alt="MA" />
            </button>
          )}
          <button
            onClick={signOut}
            style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', border: 'none', marginTop: '8px' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            {t(lang, 'logout')}
          </button>
        </div>
      </>
    )
  }

  // ── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Inter, sans-serif' }}>

        {/* Top bar */}
        <div style={{ background: '#1a5c3a', color: '#fff', padding: '0 1rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: '700' }}>T</span>
            </div>
            <span style={{ fontWeight: '600', fontSize: '15px' }}>Traiteur Pro</span>
          </div>
          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}
          >
            <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff', borderRadius: '2px', transition: 'all .2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff', borderRadius: '2px', opacity: menuOpen ? 0 : 1, transition: 'all .2s' }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff', borderRadius: '2px', transition: 'all .2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>

        {/* ✅ DEMO BANNER — mobile */}
        <DemoBanner />
        {profile?.plan_id === 'essentiel' && <UpgradeBanner />}

        {/* Overlay */}
        {menuOpen && (
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }}
          />
        )}

        {/* Mobile drawer */}
        <div style={{
          position: 'fixed', top: 0, left: 0, height: '100vh',
          width: '280px', background: '#1a5c3a', zIndex: 1000,
          display: 'flex', flexDirection: 'column', paddingTop: '1rem',
          transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        }}>
          <SidebarContent />
        </div>

        {/* Page content */}
        <main style={{ flex: 1, background: '#f8f7f4', overflowY: 'auto' }}>
          {children}
        </main>

        {/* Bottom nav bar */}
        <div style={{ background: '#fff', borderTop: '1px solid #e5e4e0', display: 'flex', flexShrink: 0, zIndex: 100 }}>
          {[
            { key: 'dashboard',   icon: '🏠', label: 'Accueil' },
            { key: 'calculateur', icon: '🧮', label: 'Calcul.' },
            { key: 'evenements',  icon: '📅', label: 'Événements' },
            { key: 'paiements',   icon: '💰', label: 'Paiements' },
            { key: 'stock',       icon: '📦', label: 'Stock' },
          ].filter(item => getPlanNav(profile?.plan_id).includes(item.key)).map(item => {
            const isActive = activeKey === item.key
            return (
              <button
                key={item.key}
                onClick={() => handleNav(navRoutes[item.key])}
                style={{
                  flex: 1, padding: '8px 4px', border: 'none', background: 'none',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '2px',
                  color: isActive ? '#1a5c3a' : '#6b6b66',
                  borderTop: isActive ? '2px solid #1a5c3a' : '2px solid transparent',
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: isActive ? '600' : '400' }}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── DESKTOP LAYOUT ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <aside style={{ width: '220px', background: '#1a5c3a', color: '#fff', display: 'flex', flexDirection: 'column', padding: '1.5rem 0', flexShrink: 0, overflowY: 'auto' }}>
        <SidebarContent />
      </aside>
      <main style={{ flex: 1, background: '#f8f7f4', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* ✅ DEMO BANNER — desktop */}
        <DemoBanner />
        {profile?.plan_id === 'essentiel' && <UpgradeBanner />}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
