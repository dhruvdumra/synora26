import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api, subscribeToUpdates, type ApiPass } from '@/lib/api'

/** Cached leaderboard from the indexer. `null` data means the indexer is unreachable; read the chain instead. */
export function useIndexedLeaderboard(limit = 100) {
  const client = useQueryClient()

  const query = useQuery({
    queryKey: ['indexer', 'leaderboard', limit],
    queryFn: () => api.leaderboard(limit),
    retry: false,
    staleTime: 5_000,
  })

  // The indexer pushes a frame whenever it applies new events, so no polling is needed.
  useEffect(() => {
    if (query.isError) return
    return subscribeToUpdates(() => {
      void client.invalidateQueries({ queryKey: ['indexer'] })
    })
  }, [client, query.isError])

  return {
    passes: query.data?.passes as ApiPass[] | undefined,
    isLoading: query.isLoading,
    isUnavailable: query.isError,
  }
}

export function useIndexerHealth() {
  return useQuery({ queryKey: ['indexer', 'health'], queryFn: api.health, retry: false, staleTime: 15_000 })
}

export function useEventStats() {
  return useQuery({ queryKey: ['indexer', 'stats'], queryFn: api.stats, retry: false, staleTime: 10_000 })
}
