import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch profile from DB by auth user id (reliable under RLS: id = auth.uid()).
  // Validates that business_id is present — required for multi-tenancy inserts.
  // Also fetches subscription plan and merges plan_id into the profile object.
  async function fetchAndCacheProfile(authUser) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()
    if (data) {
      if (!data.business_id) {
        console.warn('[AuthContext] profile loaded but business_id is null — check users table')
      }
      // Fetch subscription plan for this business
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_id')
        .eq('business_id', data.business_id)
        .single()
      const profileWithPlan = { ...data, plan_id: sub?.plan_id || 'essentiel' }
      localStorage.setItem('tp_profile', JSON.stringify(profileWithPlan))
      setProfile(profileWithPlan)
      return profileWithPlan
    }
    return data
  }

  async function signIn(email, password) {
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const prof = await fetchAndCacheProfile(authData.user)
    if (!prof) throw new Error('Compte introuvable ou désactivé.')
    return prof
  }

  async function signOut() {
    await supabase.auth.signOut()
    localStorage.removeItem('tp_profile')
    setUser(null)
    setProfile(null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authUser = session?.user ?? null
      setUser(authUser)
      if (authUser) {
        // Check cache first — but discard it if business_id is missing (stale cache)
        const cached = (() => { try { return JSON.parse(localStorage.getItem('tp_profile') || 'null') } catch { return null } })()
        if (cached?.business_id && cached.id === authUser.id && cached.plan_id) {
          setProfile(cached)
          setLoading(false)
        } else {
          // Cache is stale or missing business_id — re-fetch from DB
          localStorage.removeItem('tp_profile')
          fetchAndCacheProfile(authUser).finally(() => setLoading(false))
        }
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'INITIAL_SESSION') return
        setUser(session?.user ?? null)
        if (!session?.user) {
          localStorage.removeItem('tp_profile')
          setProfile(null)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}