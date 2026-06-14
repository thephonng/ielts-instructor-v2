import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile } from '../lib/auth'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Lấy session hiện tại khi load trang
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getProfile(session.user.id)
          .then(setProfile)
          .catch(console.error)
      }
      setLoading(false)
    })

    // Lắng nghe thay đổi auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          try {
            const p = await getProfile(session.user.id)
            setProfile(p)
          } catch (e) {
            console.error(e)
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const isPremium = profile?.plan === 'premium' &&
    (!profile?.plan_expires_at || new Date(profile.plan_expires_at) > new Date())

  return { user, profile, loading, isPremium }
}