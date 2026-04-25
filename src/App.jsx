import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { supabase } from './lib/supabaseClient'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Calculateur from './pages/Calculateur'
import ListeCourses from './pages/ListeCourses'
import Devis from './pages/Devis'
import Evenements from './pages/Evenements'
import EvenementMultiJours from './pages/EvenementMultiJours'
import Paiements from './pages/Paiements'
import Personnel from './pages/Personnel'
import Stock from './pages/Stock'
import ArtDeLaTable from './pages/ArtDeLaTable'
import Patisserie from './pages/Patisserie'
import Plats from './pages/Plats'
import Comptabilite from './pages/Comptabilite'
import Settings from './pages/Settings'
import AdminClients from './pages/AdminClients'
import Facture from './pages/Facture'
import Rapport from './pages/Rapport'
import LandingPage from './pages/LandingPage'
import LandingPagePublic from './pages/LandingPagePublic'
import Onboarding from './pages/Onboarding'
import Register from './pages/Register'
import DevisPublic from './pages/DevisPublic'
import InvoicePublic from './pages/InvoicePublic'

/* Hostnames that render the full admin app */
const ADMIN_HOSTS = [
  'traiteur-pro.netlify.app',
  'traiteur-pro-app.netlify.app',
  'localhost'
]

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', height:'100vh', gap:16 }}>
        <div style={{ fontSize:40 }}>⚠️</div>
        <p style={{ fontSize:16, color:'#555' }}>Une erreur est survenue.</p>
        <button style={{ background:'#2d6a4f', color:'#fff', border:'none',
          borderRadius:8, padding:'10px 20px', cursor:'pointer' }}
          onClick={() => window.location.href = '/'}>
          Retour au tableau de bord
        </button>
      </div>
    );
    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  const { user, loading, profile } = useAuth()
  const location = useLocation()
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    async function checkOnboarding() {
      const SKIP = ['kamal@moorish-automation.com', 'demo@traiteur-pro.com', 'demo@catering-pro.com']
      if (!profile || SKIP.includes(profile.email)) {
        setOnboardingChecked(true)
        return
      }
      const { data } = await supabase
        .from('business_profiles')
        .select('onboarding_complete')
        .eq('business_id', profile.business_id)
        .maybeSingle()
      if (data && data.onboarding_complete === false) {
        setNeedsOnboarding(true)
      }
      setOnboardingChecked(true)
    }
    if (profile) checkOnboarding()
    else setOnboardingChecked(true)
  }, [profile])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b6b66', fontFamily: 'Inter, sans-serif' }}>
      Chargement...
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (!onboardingChecked) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888', fontSize: 14 }}>
      Chargement...
    </div>
  )
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />
  }
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login"        element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/"             element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/calculateur"  element={<ProtectedRoute><Calculateur /></ProtectedRoute>} />
      <Route path="/liste-courses" element={<ProtectedRoute><ListeCourses /></ProtectedRoute>} />
      <Route path="/devis"        element={<ProtectedRoute><Devis /></ProtectedRoute>} />
      <Route path="/evenements"   element={<ProtectedRoute><Evenements /></ProtectedRoute>} />
      <Route path="/evenements/:eventId/jours" element={<ProtectedRoute><EvenementMultiJours /></ProtectedRoute>} />
      <Route path="/paiements"    element={<ProtectedRoute><Paiements /></ProtectedRoute>} />
      <Route path="/personnel"    element={<ProtectedRoute><Personnel /></ProtectedRoute>} />
      <Route path="/stock"        element={<ProtectedRoute><Stock /></ProtectedRoute>} />
      <Route path="/art-de-la-table" element={<ProtectedRoute><ArtDeLaTable /></ProtectedRoute>} />
      <Route path="/patisserie"      element={<ProtectedRoute><Patisserie /></ProtectedRoute>} />
      <Route path="/plats"        element={<ProtectedRoute><Plats /></ProtectedRoute>} />
      <Route path="/comptabilite" element={<ProtectedRoute><Comptabilite /></ProtectedRoute>} />
      <Route path="/settings"     element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/admin"        element={<ProtectedRoute><AdminClients /></ProtectedRoute>} />
      <Route path="/factures"     element={<ProtectedRoute><Facture /></ProtectedRoute>} />
      <Route path="/rapports"     element={<ProtectedRoute><Rapport /></ProtectedRoute>} />
      {/* TODO: remove before production */}
      <Route path="/register" element={<Register />} />
      <Route path="/devis/:token" element={<DevisPublic />} />
      <Route path="/portal/:token" element={<InvoicePublic />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/test-landing" element={<LandingPage hostname="monassabat-chrif.com" />} />
      <Route path="/landing" element={<LandingPagePublic />} />
      <Route path="*"             element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const hostname = window.location.hostname

  if (!ADMIN_HOSTS.includes(hostname)) {
    return <LandingPage hostname={hostname} />
  }

  return (
    <AuthProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ErrorBoundary>
    </AuthProvider>
  )
}
