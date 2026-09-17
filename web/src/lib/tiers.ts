export type TierId = 0 | 1 | 2 | 3

export interface TierInfo {
  id: TierId
  name: string
  /** Score needed to reach the tier, or null when it is granted by staff. */
  threshold: number | null
  /** Band color, identical to the on-chain pass. */
  swatch: string
  /** Tailwind classes for an access chip: band color with band ink. */
  chipClass: string
  summary: string
}

export const SILVER_SCORE = 7
export const GOLD_SCORE = 15

export const TIERS: readonly TierInfo[] = [
  {
    id: 0,
    name: 'Bronze',
    threshold: 0,
    swatch: '#e08a4b',
    chipClass: 'bg-bronze text-band-ink',
    summary: 'Every pass starts here the moment it is minted.',
  },
  {
    id: 1,
    name: 'Silver',
    threshold: SILVER_SCORE,
    swatch: '#c3cbd6',
    chipClass: 'bg-silver text-band-ink',
    summary: 'Seven points in. Opens session resources.',
  },
  {
    id: 2,
    name: 'Gold',
    threshold: GOLD_SCORE,
    swatch: '#f2c94c',
    chipClass: 'bg-gold text-band-ink',
    summary: 'Fifteen points in. Opens sponsor perks.',
  },
  {
    id: 3,
    name: 'Speaker',
    threshold: null,
    swatch: '#a48bff',
    chipClass: 'bg-speaker text-band-ink',
    summary: 'Granted when staff record your talk. Opens every door.',
  },
]

export function tierInfo(tier: number | undefined): TierInfo {
  return TIERS[tier ?? 0] ?? TIERS[0]
}

/** Progress toward the next score-based tier. Speakers and Gold holders are complete. */
export function nextTierProgress(score: number, tier: number) {
  if (tier >= 2) return { next: null, remaining: 0 }
  const next = tier === 0 ? TIERS[1] : TIERS[2]
  const target = next.threshold ?? GOLD_SCORE
  return { next, remaining: Math.max(0, target - score) }
}
