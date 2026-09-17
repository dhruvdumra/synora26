import { useQuery } from '@tanstack/react-query'
import { useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { badgeAbi } from '@/lib/badge-abi'
import { badgeAddress, chain, isConfigured } from '@/lib/config'
import { decodeTokenUri } from '@/lib/format'

/** A pass earning its way up, drawn by the contract's own renderer through previewURI. */
const STEPS = [
  { sessionsAttended: 2, talksGiven: 0, networkingScore: 1, connections: 1, isSpeaker: false, mintedAt: 0 },
  { sessionsAttended: 5, talksGiven: 0, networkingScore: 3, connections: 3, isSpeaker: false, mintedAt: 0 },
  { sessionsAttended: 8, talksGiven: 0, networkingScore: 8, connections: 6, isSpeaker: false, mintedAt: 0 },
  { sessionsAttended: 8, talksGiven: 1, networkingScore: 8, connections: 6, isSpeaker: true, mintedAt: 0 },
] as const

const DEMO_HOLDER = '0x5eb1ac3f0b0a7c9e9c5c0d1e2f3a4b5c6d7e8f90' as const
const TIER_NAMES = ['Bronze', 'Silver', 'Gold', 'Speaker']
const STEP_MS = 3400

export function useDemoPass(enabled: boolean) {
  const client = usePublicClient({ chainId: chain.id })
  // Someone asking for reduced motion sees one pass, held still.
  const reduceMotion = useReducedMotion()

  /** Read one at a time: four on-chain renders in a single multicall would blow the call gas limit. */
  const query = useQuery({
    queryKey: ['demo-pass', chain.id, badgeAddress],
    enabled: enabled && isConfigured && !!client,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const images: (string | null)[] = []
      for (const step of STEPS) {
        const uri = await client!.readContract({
          address: badgeAddress,
          abi: badgeAbi,
          functionName: 'previewURI',
          args: [1n, DEMO_HOLDER, step],
        })
        images.push(decodeTokenUri(uri)?.image ?? null)
      }
      return images
    },
  })

  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!enabled || reduceMotion || !query.data) return
    const timer = window.setInterval(() => setStep((current) => (current + 1) % STEPS.length), STEP_MS)
    return () => window.clearInterval(timer)
  }, [enabled, reduceMotion, query.data])

  return {
    image: query.data?.[step] ?? null,
    tier: step,
    tierName: TIER_NAMES[step],
    isError: query.isError,
  }
}
