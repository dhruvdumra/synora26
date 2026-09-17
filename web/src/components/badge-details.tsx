import { TierTag } from '@/components/tier-tag'
import type { BadgeView } from '@/hooks/use-badge'
import { badgeNumber } from '@/lib/format'
import { nextTierProgress, tierInfo } from '@/lib/tiers'

function progressLabel(score: number, tier: number) {
  const { next, remaining } = nextTierProgress(score, tier)
  if (tier === 3) return 'Speaker badges unlock every perk.'
  if (!next) return 'Top tier reached.'
  return `${remaining} ${remaining === 1 ? 'point' : 'points'} to ${next.name}`
}

/** Tier headline, progress toward the next tier and the raw traits. */
export function BadgeDetails({ badge }: { badge: BadgeView }) {
  const info = tierInfo(badge.tier)
  const { percent } = nextTierProgress(badge.score, badge.tier)

  const stats = [
    { label: 'Sessions', value: badge.sessionsAttended, hint: '1 point each' },
    { label: 'Talks', value: badge.talksGiven, hint: '3 points each' },
    { label: 'Networking', value: badge.networkingScore, hint: `${badge.connections} connections` },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <TierTag tier={badge.tier} />
          <span className="font-mono text-[13px] text-muted-foreground">Badge {badgeNumber(badge.tokenId)}</span>
        </div>
        <h1 className="font-display text-5xl leading-[1.05] font-normal sm:text-6xl">{info.name}</h1>
        <p className="text-muted-foreground">{info.summary}</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-4xl tabular">{badge.score}</span>
            <span className="text-sm text-muted-foreground">score</span>
          </p>
          <p className={`text-sm font-medium ${info.inkClass}`}>{progressLabel(badge.score, badge.tier)}</p>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Progress to next tier"
        >
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out-soft"
            style={{ width: `${percent}%`, backgroundColor: info.swatch }}
          />
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border bg-border">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 bg-card p-4 sm:p-5">
            <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            <dd className="font-mono text-2xl tabular">{stat.value}</dd>
            <dd className="text-xs text-muted-foreground">{stat.hint}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
