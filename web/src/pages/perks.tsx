import { CheckCircleIcon, LockIcon, WalletIcon } from '@phosphor-icons/react'
import { cn } from 'cn'
import { Link } from 'react-router'
import { Page, PageHeader, StatePanel } from '@/components/page'
import { TierTag } from '@/components/tier-tag'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/wallet-button'
import { useBadge, useMyBadgeId } from '@/hooks/use-badge'

const PERKS = [
  { tier: 1, title: 'Session resources', description: 'Slides, recordings and code from every talk.' },
  { tier: 2, title: 'Sponsor perks', description: 'Credits and discount codes from event partners.' },
  { tier: 3, title: 'Speaker room', description: 'Schedule, green room access and the speaker chat.' },
]

function unlocks(holderTier: number, perkTier: number) {
  return holderTier === 3 || holderTier >= perkTier
}

export function PerksPage() {
  const { isConnected, tokenId } = useMyBadgeId()
  const { badge } = useBadge(tokenId)

  if (!isConnected) {
    return (
      <Page>
        <StatePanel icon={<WalletIcon weight="bold" />} title="Connect to see your perks" action={<WalletButton size="lg" />}>
          Perks unlock from the tier on your badge.
        </StatePanel>
      </Page>
    )
  }

  const tier = badge?.tier ?? -1

  return (
    <Page>
      <PageHeader
        title="Perks"
        description={tokenId ? 'Each tier opens more. Your badge is checked the moment you open a perk.' : 'Mint a badge to start unlocking perks.'}
        actions={!tokenId && <Button asChild><Link to="/badge">Mint a badge</Link></Button>}
      />
      <ul className="grid gap-4 md:grid-cols-3">
        {PERKS.map((perk) => {
          const open = tier >= 0 && unlocks(tier, perk.tier)
          return (
            <li key={perk.tier} className={cn('flex flex-col gap-4 rounded-xl border bg-card p-6', !open && 'bg-muted/40')}>
              <div className="flex items-center justify-between">
                <TierTag tier={perk.tier} />
                {open ? (
                  <CheckCircleIcon weight="fill" className="size-5 text-success" aria-label="Unlocked" />
                ) : (
                  <LockIcon weight="bold" className="size-5 text-muted-foreground" aria-label="Locked" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="font-medium">{perk.title}</h2>
                <p className="text-sm text-muted-foreground">{perk.description}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </Page>
  )
}
