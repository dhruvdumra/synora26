import { cn } from 'cn'
import { Link } from 'react-router'
import { TierTag } from '@/components/tier-tag'
import type { BadgeView } from '@/hooks/use-badge'
import { usePassHistory } from '@/hooks/use-pass-history'
import { GOLD_SCORE, nextTierProgress, tierInfo, TIERS } from '@/lib/tiers'

/** What the holder can do next, rather than repeating the pass's own numbers. */
function RouteUp({ badge }: { badge: BadgeView }) {
  if (badge.tier === 3) {
    return <p className="text-muted-foreground">Speaker opens every door. Nothing left to earn.</p>
  }

  // Gold is the top score tier, so the only way up is a talk recorded by staff.
  if (badge.tier === 2) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-lg text-muted-foreground">
          Gold is the highest tier points can reach. Speaker is granted when staff record a talk.
        </p>
        <ul className="flex flex-col border-y border-foreground/15">
          <li className="flex items-baseline justify-between gap-4 py-3">
            <span>Give a talk</span>
            <span className="shrink-0 font-mono text-sm whitespace-nowrap text-muted-foreground">
              staff records it
            </span>
          </li>
        </ul>
      </div>
    )
  }

  const { next, remaining } = nextTierProgress(badge.score, badge.tier)
  const target = next?.name ?? 'Gold'
  const rows = [
    { action: 'Check in to a session', detail: `+1 each, ${remaining} to go` },
    { action: 'Give a talk', detail: `+3 each, ${Math.ceil(remaining / 3)} to go` },
    { action: 'Meet another attendee', detail: `+1 each, ${remaining} to go` },
  ]

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg">
        <span className="font-mono text-2xl tabular">{remaining}</span>
        <span className="text-muted-foreground">
          {' '}
          more {remaining === 1 ? 'point' : 'points'} to {target}
        </span>
      </p>
      <ul className="flex flex-col divide-y divide-foreground/10 border-y border-foreground/15">
        {rows.map((row) => (
          <li key={row.action} className="flex items-baseline justify-between gap-4 py-3">
            <span>{row.action}</span>
            <span className="shrink-0 font-mono text-sm whitespace-nowrap text-muted-foreground tabular">
              {row.detail}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Which perks this tier opens, so the pass explains its own value. */
function Doors({ tier }: { tier: number }) {
  const doors = [
    { tier: 1, label: 'Session resources' },
    { tier: 2, label: 'Sponsor perks' },
    { tier: 3, label: 'Speaker room' },
  ]
  return (
    <ul className="flex flex-col gap-2">
      {doors.map((door) => {
        const open = tier === 3 || tier >= door.tier
        return (
          <li key={door.tier} className="flex items-center justify-between gap-4">
            <span className={cn(!open && 'text-muted-foreground')}>{door.label}</span>
            <span
              className={cn(
                'font-condensed shrink-0 rounded-sm px-2 py-1 text-[11px] font-bold tracking-[0.06em] uppercase',
                open ? 'bg-signal text-signal-ink' : 'bg-foreground/[0.07] text-muted-foreground',
              )}
            >
              {open ? 'Open' : `${TIERS[door.tier].name} only`}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function History({ tokenId }: { tokenId: bigint }) {
  const { data, isError } = usePassHistory(tokenId)
  if (isError || !data || data.length === 0) return null
  return (
    <ol className="flex flex-col divide-y divide-foreground/10 border-t border-foreground/15">
      {data.map((entry) => (
        <li key={`${entry.blockNumber}-${entry.tier}-${entry.issued}`} className="flex items-center justify-between gap-4 py-3">
          <span className="flex items-center gap-3">
            <TierTag tier={entry.tier} />
            <span className="text-muted-foreground">{entry.issued ? 'Issued' : 'Re-issued'}</span>
          </span>
          <span className="shrink-0 font-mono text-sm text-muted-foreground tabular">block {entry.blockNumber.toString()}</span>
        </li>
      ))}
    </ol>
  )
}

export function BadgeDetails({ badge, showRoute = true }: { badge: BadgeView; showRoute?: boolean }) {
  const info = tierInfo(badge.tier)
  const networkNote =
    badge.connections > 0
      ? `${badge.connections} from people you met`
      : badge.networkingScore > 0
        ? 'awarded by staff'
        : 'meet someone to earn these'

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-[clamp(3.5rem,10vw,6rem)] uppercase">{info.name}</h1>
        <p className="max-w-[44ch] text-lg text-muted-foreground">{info.summary}</p>
      </div>

      {showRoute && (
        <section aria-labelledby="route-up" className="flex flex-col gap-4">
          <h2 id="route-up" className="font-display text-3xl uppercase">
            Route up
          </h2>
          <RouteUp badge={badge} />
        </section>
      )}

      <section aria-labelledby="doors" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="doors" className="font-display text-3xl uppercase">
            Doors
          </h2>
          <Link to="/perks" className="text-sm text-muted-foreground underline hover:text-foreground">
            All perks
          </Link>
        </div>
        <Doors tier={badge.tier} />
      </section>

      <section aria-labelledby="ledger" className="flex flex-col gap-4">
        <h2 id="ledger" className="font-display text-3xl uppercase">
          Ledger
        </h2>
        <dl className="flex flex-col divide-y divide-foreground/10 border-y border-foreground/15">
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-muted-foreground">Networking points</dt>
            <dd className="text-right">
              <span className="font-mono tabular">{badge.networkingScore}</span>
              <span className="ml-2 text-sm text-muted-foreground">{networkNote}</span>
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-3">
            {badge.tier < 2 ? (
              <>
                <dt className="text-muted-foreground">Punches toward Gold</dt>
                <dd className="font-mono tabular">
                  {Math.min(badge.score, GOLD_SCORE)} / {GOLD_SCORE}
                </dd>
              </>
            ) : (
              <>
                <dt className="text-muted-foreground">Talks recorded</dt>
                <dd className="font-mono tabular">{badge.talksGiven}</dd>
              </>
            )}
          </div>
        </dl>
        <History tokenId={badge.tokenId} />
      </section>
    </div>
  )
}
