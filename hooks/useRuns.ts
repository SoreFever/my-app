import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Run } from '@/types/run'

export function useRuns(userId: string) {
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('runs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRuns(data ?? [])
        setLoading(false)
      })
  }, [userId])

  return { runs, loading }
}