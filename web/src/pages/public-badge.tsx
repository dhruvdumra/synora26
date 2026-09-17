import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { BadgeArt } from '@/components/badge-art'
import { BadgeDetails } from '@/components/badge-details'
import { Page, StatePanel } from '@/components/page'
import { SessionSelect } from '@/components/session-select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useBadge } from '@/hooks/use-badge'
import { useContractAction } from '@/hooks/use-contract-action'
import { useRoles } from '@/hooks/use-roles'
import { useSessions } from '@/hooks/use-sessions'
import { useTierChange } from '@/hooks/use-tier-change'
import { badgeNumber, shortAddress } from '@/lib/format'
import { tierInfo } from '@/lib/tiers'

export function PublicBadgePage() {
  const { tokenId: param } = useParams()
  const tokenId = param && /^\d+$/.test(param) ? BigInt(param) : undefined
  const { badge, notFound } = useBadge(tokenId)
  const { pulse } = useTierChange(tokenId, badge?.tier)
  const { isStaff } = useRoles()

  if (tokenId === undefined || notFound) {
    return (
      <Page>
        <StatePanel icon={<MagnifyingGlassIcon weight="bold" />} title="No such pass">
          No pass has been issued with that number yet.
        </StatePanel>
      </Page>
    )
  }

  return (
    <Page>
      <div className="grid gap-12 md:grid-cols-[minmax(0,360px)_1fr] md:gap-16 lg:grid-cols-[minmax(0,400px)_1fr] lg:gap-24">
        <div className="pt-16 md:sticky md:top-24 md:self-start">
          <BadgeArt
            image={badge?.image ?? null}
            pulse={pulse}
            strap="header"
            swing
            alt={badge ? `Pass ${badgeNumber(tokenId)}, ${tierInfo(badge.tier).name} access` : 'Loading pass'}
            className="max-w-[320px] md:max-w-none"
          />
        </div>
        <div className="flex flex-col gap-10">
          {badge ? <BadgeDetails badge={badge} /> : <Skeleton className="h-80 w-full" />}
          {badge && (
            <p className="text-muted-foreground">
              Held by <span className="font-mono text-sm text-foreground">{shortAddress(badge.holder)}</span>
            </p>
          )}
          {isStaff && badge && <QuickCheckIn tokenId={tokenId} />}
        </div>
      </div>
    </Page>
  )
}

/** Lets staff who scanned a badge with their phone camera check it in without opening the console. */
function QuickCheckIn({ tokenId }: { tokenId: bigint }) {
  const { sessions } = useSessions()
  const { send, busy } = useContractAction()
  const [sessionId, setSessionId] = useState<bigint | undefined>()
  const selected = sessions.find((session) => session.id === (sessionId ?? sessions.find((s) => s.active)?.id))

  return (
    <section aria-labelledby="quick-checkin" className="flex flex-col gap-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
      <h2 id="quick-checkin" className="font-display text-3xl uppercase">
        Check in at the door
      </h2>
      <Label htmlFor="quick-session" className="sr-only">
        Session
      </Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <SessionSelect id="quick-session" sessions={sessions} value={selected?.id} onChange={setSessionId} className="flex-1" />
        <Button
          variant="signal"
          disabled={!selected || busy !== null}
          onClick={() =>
            selected &&
            void send('checkIn', [tokenId, selected.id], {
              pending: `Checking in ${badgeNumber(tokenId)}`,
              success: `Checked in ${badgeNumber(tokenId)} to ${selected.name}`,
            })
          }
        >
          Check in {badgeNumber(tokenId)}
        </Button>
      </div>
    </section>
  )
}
