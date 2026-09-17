import { useMemo } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { badgeAbi } from '@/lib/badge-abi'
import { badgeAddress, chain, isConfigured } from '@/lib/config'

const contract = { address: badgeAddress, abi: badgeAbi, chainId: chain.id } as const

export interface SessionView {
  id: bigint
  name: string
  active: boolean
  attendance: number
  createdAt: number
}

export function useSessions() {
  const count = useReadContract({ ...contract, functionName: 'sessionCount', query: { enabled: isConfigured } })
  const total = Number(count.data ?? 0n)

  const details = useReadContracts({
    allowFailure: false,
    contracts: Array.from({ length: total }, (_, index) => ({
      ...contract,
      functionName: 'getSession' as const,
      args: [BigInt(index + 1)] as const,
    })),
    query: { enabled: total > 0 },
  })

  const sessions = useMemo<SessionView[]>(() => {
    if (!details.data) return []
    return details.data
      .map((session, index) => ({
        id: BigInt(index + 1),
        name: session.name,
        active: session.active,
        attendance: session.attendance,
        createdAt: Number(session.createdAt),
      }))
      .reverse()
  }, [details.data])

  return { sessions, isLoading: count.isLoading || (total > 0 && details.isLoading) }
}
