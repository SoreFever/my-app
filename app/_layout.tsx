// app/_layout.tsx
import { useState, useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { supabase } from '@/supabase'

export default function RootLayout() {
  const [userId, setUserId] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    supabase.auth.getClaims().then(({ data }) => {
      setUserId(data?.claims?.sub ?? null)
      setInitialized(true)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, _session) => {
      const { data } = await supabase.auth.getClaims()
      setUserId(data?.claims?.sub ?? null)
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!initialized) return
    const inAuthGroup = segments[0] === 'auth'

    if (!userId && !inAuthGroup) {
      router.replace('/auth')
    } else if (userId && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [userId, initialized, segments])

  if (!initialized) return null // or a splash/loading screen

  return <Stack screenOptions={{ headerShown: false }} />
}