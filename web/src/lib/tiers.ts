export type TierId = 0 | 1 | 2 | 3

export interface TierInfo {
  id: TierId
  name: string
  /** Score needed to reach the tier, or null when it is granted by staff. */
  threshold: number | null
  /** Solid accent, used for rings and art. */
  swatch: string
  /** Tailwind classes for a tag: soft background with readable ink. */
  tagClass: string
  /** Tailwind text class with AA contrast on the page background. */
  inkClass: string
  summary: string
}

export const SILVER_SCORE = 7
export const GOLD_SCORE = 15

export const TIERS: readonly TierInfo[] = [
  {
    id: 0,
    name: 'Bronze',
    threshold: 0,
    swatch: 'var(--tier-bronze)',
    tagClass: 'bg-bronze-soft text-bronze-ink',
    inkClass: 'text-bronze-ink',
    summary: 'Every badge starts here the moment it is minted.',
  },
  {
    id: 1,
    name: 'Silver',
    threshold: SILVER_SCORE,
    swatch: 'var(--tier-silver)',
    tagClass: 'bg-silver-soft text-silver-ink',
    inkClass: 'text-silver-ink',
    summary: 'Reached at 7 points. Unlocks session resources.',
  },
  {
    id: 2,
    name: 'Gold',
    threshold: GOLD_SCORE,
    swatch: 'var(--tier-gold)',
    tagClass: 'bg-gold-soft text-gold-ink',
    inkClass: 'text-gold-ink',
    summary: 'Reached at 15 points. Unlocks sponsor perks.',
  },
  {
    id: 3,
    name: 'Speaker',
    threshold: null,
    swatch: 'var(--tier-speaker)',
    tagClass: 'bg-speaker-soft text-speaker-ink',
    inkClass: 'text-speaker-ink',
    summary: 'Granted when staff record a talk. Unlocks the speaker room.',
  },
]

export function tierInfo(tier: number | undefined): TierInfo {
  return TIERS[tier ?? 0] ?? TIERS[0]
}

/** Progress toward the next score-based tier. Speakers and Gold holders are complete. */
export function nextTierProgress(score: number, tier: number) {
  if (tier >= 2) return { next: null, remaining: 0, percent: 100 }
  const next = tier === 0 ? TIERS[1] : TIERS[2]
  const floor = tier === 0 ? 0 : SILVER_SCORE
  const target = next.threshold ?? GOLD_SCORE
  const percent = Math.min(100, Math.round(((score - floor) / (target - floor)) * 100))
  return { next, remaining: Math.max(0, target - score), percent }
}
