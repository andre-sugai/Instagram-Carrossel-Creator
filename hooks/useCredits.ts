import { useCreditsContext } from '../contexts/CreditsContext'

export function useCredits() {
  const { credits, loading, refreshCredits } = useCreditsContext()
  return { credits, loading, refresh: refreshCredits }
}
