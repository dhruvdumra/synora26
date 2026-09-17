import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import { badgeAbi } from '@/lib/badge-abi'
import { badgeAddress, chain, startBlock } from '@/lib/config'

export interface HistoryEntry {
  tier: number
  blockNumber: bigint
  issued: boolean
}

/**
 * Every tier this pass has held, read from contract events. Some public RPCs limit log ranges, so a
 * failure here is not fatal: the page simply omits the history.
 */
export function usePassHistory(tokenId: bigint | undefined) {
  const client = usePublicClient({ chainId: chain.id })

  return useQuery({
    queryKey: ['pass-history', chain.id, badgeAddress, tokenId?.toString()],
    enabled: !!client && tokenId !== undefined,
    retry: false,
    staleTime: 10_000,
    queryFn: async (): Promise<HistoryEntry[]> => {
      if (!client || tokenId === undefined) return []
      const [minted, changes] = await Promise.all([
        client.getContractEvents({
          address: badgeAddress,
          abi: badgeAbi,
          eventName: 'BadgeMinted',
          args: { tokenId },
          fromBlock: startBlock,
        }),
        client.getContractEvents({
          address: badgeAddress,
          abi: badgeAbi,
          eventName: 'TierChanged',
          args: { tokenId },
          fromBlock: startBlock,
        }),
      ])

      const entries: HistoryEntry[] = minted.map((log) => ({
        tier: 0,
        blockNumber: log.blockNumber,
        issued: true,
      }))
      for (const log of changes) {
        entries.push({ tier: log.args.newTier ?? 0, blockNumber: log.blockNumber, issued: false })
      }
      return entries.sort((a, b) => Number(b.blockNumber - a.blockNumber))
    },
  })
}
