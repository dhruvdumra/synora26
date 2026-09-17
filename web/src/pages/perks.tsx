import { LockSimpleIcon, LockSimpleOpenIcon, WalletIcon } from '@phosphor-icons/react'
import { cn } from 'cn'
import { Link } from 'react-router'
import { Page, PageHeader, StatePanel } from '@/components/page'
import { TierTag } from '@/components/tier-tag'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/wallet-button'
import { useBadge, useMyBadgeId } from '@/hooks/use-badge'
import { tierInfo } from '@/lib/tiers'

const ZONES = [
  { tier: 1, title: 'Session resources', description: 'Slides, recordings and code from every talk.' },
  { tier: 2, title: 'Sponsor perks', description: 'Credits and discount codes from event partners.' },
  { tier: 3, title: 'Speaker room', description: 'The schedule, green room access and the speaker chat.' },
]

function hasAccess(holderTier: number, zoneTier: number) {
  return holderTier === 3 || holderTier >= zoneTier
}

export function PerksPage() {
  const { isConnected, tokenId } = useMyBadgeId()
  const { badge } = useBadge(tokenId)

  if (!isConnected) {
    return (
      <Page>
        <StatePanel icon={<WalletIcon weight="bold" />} title="Perks open by tier" action={<WalletButton size="lg" />}>
          Connect the wallet holding your pass to see which doors are open.
        </StatePanel>
      </Page>
    )
  }

  const tier = badge?.tier ?? -1

  return (
    <Page>
      <PageHeader
        title="Perks"
        description={
          tokenId
            ? 'Your pass is checked at the moment you open a perk, so access always matches your tier on-chain.'
            : 'Mint a pass to start opening doors.'
        }
        actions={
          !tokenId && (
            <Button size="lg" variant="signal" asChild>
              <Link to="/badge">Mint my pass</Link>
            </Button>
          )
        }
      />

      <ul className="flex flex-col">
        {ZONES.map((zone) => {
          const open = tier >= 0 && hasAccess(tier, zone.tier)
          return (
            <li
              key={zone.tier}
              className="grid gap-4 border-t-2 border-foreground py-8 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-10"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <TierTag tier={zone.tier} />
                  {zone.tier < 3 && <span className="text-sm text-muted-foreground">and above</span>}
                </div>
                <h2 className={cn('font-display text-[clamp(2.5rem,6vw,4rem)] uppercase', !open && 'text-foreground/35')}>
                  {zone.title}
                </h2>
                <p className="max-w-[48ch] text-muted-foreground">{zone.description}</p>
              </div>
              <div
                className={cn(
                  'font-condensed flex items-center gap-2 self-start rounded-md px-4 py-3 text-sm font-bold tracking-[0.04em] uppercase sm:self-center',
                  open ? 'bg-signal text-signal-ink' : 'bg-foreground/[0.06] text-muted-foreground',
                )}
              >
                {open ? <LockSimpleOpenIcon weight="bold" className="size-4" /> : <LockSimpleIcon weight="bold" className="size-4" />}
                {open ? 'Access granted' : `Needs ${tierInfo(zone.tier).name}`}
              </div>
            </li>
          )
        })}
      </ul>
    </Page>
  )
}
