import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export function useCredits() {
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchCredits = async () => {
    if (!user) {
      setCredits(null)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setCredits(data.credits)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCredits()

    if (!user) return

    // Subscrever a mudanças em tempo real
    const channel = supabase
      .channel('credits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Credit update received:', payload)
          fetchCredits()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return { credits, loading, refresh: fetchCredits }
}
