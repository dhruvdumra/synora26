import { useMemo } from 'react'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { badgeAbi } from '@/lib/badge-abi'
import { badgeAddress, chain, isConfigured } from '@/lib/config'
import { decodeTokenUri } from '@/lib/format'

const contract = { address: badgeAddress, abi: badgeAbi, chainId: chain.id } as const

export interface BadgeView {
  tokenId: bigint
  holder: `0x${string}`
  sessionsAttended: number
  talksGiven: number
  networkingScore: number
  connections: number
  isSpeaker: boolean
  mintedAt: number
  score: number
  tier: number
  image: string | null
}

/** Live view of one badge: traits, derived score and tier, and the on-chain SVG. */
export function useBadge(tokenId: bigint | undefined) {
  const query = useReadContracts({
    contracts: [
      { ...contract, functionName: 'getBadge', args: [tokenId ?? 0n] },
      { ...contract, functionName: 'tokenURI', args: [tokenId ?? 0n] },
    ],
    query: { enabled: isConfigured && tokenId !== undefined && tokenId > 0n },
  })

  const badge = useMemo<BadgeView | null>(() => {
    const [details, uri] = query.data ?? []
    if (tokenId === undefined || details?.status !== 'success') return null
    const [traits, score, tier, holder] = details.result
    return {
      tokenId,
      holder,
      sessionsAttended: traits.sessionsAttended,
      talksGiven: traits.talksGiven,
      networkingScore: traits.networkingScore,
      connections: traits.connections,
      isSpeaker: traits.isSpeaker,
      mintedAt: Number(traits.mintedAt),
      score: Number(score),
      tier,
      image: uri?.status === 'success' ? (decodeTokenUri(uri.result)?.image ?? null) : null,
    }
  }, [query.data, tokenId])

  const notFound = query.data?.[0]?.status === 'failure'
  return { badge, notFound, isLoading: query.isLoading, refetch: query.refetch }
}

/** The connected wallet's badge id, if it has one. */
export function useMyBadgeId() {
  const { address, isConnected } = useAccount()
  const query = useReadContract({
    ...contract,
    functionName: 'tokenOf',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: isConfigured && !!address },
  })
  const tokenId = query.data && query.data > 0n ? query.data : undefined
  return {
    address,
    isConnected,
    tokenId,
    hasBadge: tokenId !== undefined,
    isLoading: isConnected && query.isLoading,
    refetch: query.refetch,
  }
}

export function useCollectionName() {
  const query = useReadContract({ ...contract, functionName: 'name', query: { enabled: isConfigured } })
  return query.data
}

export function useTotalMinted() {
  const query = useReadContract({ ...contract, functionName: 'totalMinted', query: { enabled: isConfigured } })
  return query.data
}
