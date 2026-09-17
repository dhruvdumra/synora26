import { createPublicClient, http } from 'viem'
import { badgeAbi } from './badge-abi.ts'
import { badgeAddress, chain, rpcUrl } from './config.ts'

export const client = createPublicClient({ chain, transport: http(rpcUrl) })

/** Reads in small parallel batches. Plain calls work on any node, with or without Multicall3. */
async function batched<T, R>(items: T[], size: number, read: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []
  for (let index = 0; index < items.length; index += size) {
    const chunk = items.slice(index, index + size)
    const settled = await Promise.allSettled(chunk.map(read))
    for (const result of settled) {
      if (result.status === 'fulfilled') out.push(result.value)
    }
  }
  return out
}

export const badge = { address: badgeAddress, abi: badgeAbi } as const

export interface PassState {
  tokenId: bigint
  holder: string
  sessions: number
  talks: number
  networking: number
  connections: number
  isSpeaker: boolean
  score: number
  tier: number
  mintedAt: number
}

/** Reads current state for the given passes. The chain stays the source of truth; this is only a cache. */
export async function readPasses(tokenIds: bigint[]): Promise<PassState[]> {
  return batched(tokenIds, 10, async (tokenId) => {
    const [traits, score, tier, holder] = await client.readContract({
      ...badge,
      functionName: 'getBadge',
      args: [tokenId],
    })
    return {
      tokenId,
      holder,
      sessions: traits.sessionsAttended,
      talks: traits.talksGiven,
      networking: traits.networkingScore,
      connections: traits.connections,
      isSpeaker: traits.isSpeaker,
      score: Number(score),
      tier,
      mintedAt: Number(traits.mintedAt),
    }
  })
}

export async function readSessions(sessionIds: bigint[]) {
  return batched(sessionIds, 10, async (id) => {
    const session = await client.readContract({ ...badge, functionName: 'getSession', args: [id] })
    return { id, ...session }
  })
}

export async function readTier(tokenId: bigint) {
  return client.readContract({ ...badge, functionName: 'tierOf', args: [tokenId] })
}

export async function readTokenOf(holder: `0x${string}`) {
  return client.readContract({ ...badge, functionName: 'tokenOf', args: [holder] })
}
