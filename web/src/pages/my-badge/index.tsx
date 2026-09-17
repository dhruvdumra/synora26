import { QrCodeIcon, ScanIcon, WalletIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { BadgeArt } from '@/components/badge-art'
import { BadgeDetails } from '@/components/badge-details'
import { Page, StatePanel } from '@/components/page'
import { QrCode } from '@/components/qr-code'
import { ScannerDialog } from '@/components/scanner-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { WalletButton } from '@/components/wallet-button'
import { useBadge, useMyBadgeId } from '@/hooks/use-badge'
import { useTierChange } from '@/hooks/use-tier-change'
import { badgeUrl, connectPath } from '@/lib/codes'
import { badgeNumber } from '@/lib/format'
import { tierInfo } from '@/lib/tiers'
import { ConnectCodeDialog } from './connect-code-dialog'
import { MintPanel } from './mint-panel'

const layout = 'grid gap-12 md:grid-cols-[minmax(0,360px)_1fr] md:gap-16 lg:grid-cols-[minmax(0,400px)_1fr] lg:gap-24'

export function MyBadgePage() {
  const { address, isConnected, tokenId, isLoading } = useMyBadgeId()

  if (!isConnected || !address) {
    return (
      <Page>
        <StatePanel icon={<WalletIcon weight="bold" />} title="Your pass lives in your wallet" action={<WalletButton size="lg" />}>
          Connect a wallet to mint your pass or see where it stands.
        </StatePanel>
      </Page>
    )
  }

  if (isLoading) {
    return (
      <Page>
        <div className={layout}>
          <Skeleton className="aspect-[540/860] w-full rounded-[22px]" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-64" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
      </Page>
    )
  }

  return <Page>{tokenId ? <OwnedPass tokenId={tokenId} /> : <MintPanel address={address} />}</Page>
}

function OwnedPass({ tokenId }: { tokenId: bigint }) {
  const navigate = useNavigate()
  const { badge } = useBadge(tokenId)
  const { pulse, lastChange } = useTierChange(tokenId, badge?.tier)
  const [showConnectCode, setShowConnectCode] = useState(false)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    if (!lastChange) return
    const reached = tierInfo(lastChange.to)
    toast.success(`Pass re-issued at ${reached.name}`, {
      description: reached.summary,
      action: { label: 'Perks', onClick: () => navigate('/perks') },
    })
  }, [lastChange, navigate])

  return (
    <div className={layout}>
      <div className="flex flex-col gap-5 pt-16 md:sticky md:top-24 md:self-start">
        <BadgeArt
          image={badge?.image ?? null}
          pulse={pulse}
          strap="header"
          swing
          alt={badge ? `Pass ${badgeNumber(tokenId)}, ${tierInfo(badge.tier).name} access` : 'Loading pass'}
          className="max-w-[320px] md:max-w-none"
        />
        <p className="text-center text-sm text-muted-foreground">Drawn by the contract. Re-issues the moment your tier changes.</p>
      </div>

      <div className="flex flex-col gap-12">
        {badge ? <BadgeDetails badge={badge} /> : <Skeleton className="h-80 w-full" />}

        <section aria-labelledby="door-code" className="grid gap-6 rounded-xl bg-card p-6 ring-1 ring-foreground/10 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
          <QrCode value={badgeUrl(tokenId)} label={`Pass ${badgeNumber(tokenId)} door code`} className="justify-self-start" />
          <div className="flex flex-col gap-2">
            <h2 id="door-code" className="font-display text-4xl uppercase">
              Door code
            </h2>
            <p className="max-w-[40ch] text-muted-foreground">
              Hold this up at the session door. Staff scan it and your pass updates within a block.
            </p>
          </div>
        </section>

        <section aria-labelledby="meet" className="flex flex-col gap-5 border-t border-foreground/15 pt-8">
          <div className="flex flex-col gap-2">
            <h2 id="meet" className="font-display text-4xl uppercase">
              Meet someone
            </h2>
            <p className="max-w-[48ch] text-muted-foreground">
              Swap codes with another checked-in attendee. Each new connection adds a point to both passes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" variant="outline" onClick={() => setShowConnectCode(true)}>
              <QrCodeIcon weight="bold" data-icon="inline-start" />
              Show my code
            </Button>
            <Button size="lg" variant="outline" onClick={() => setScanning(true)}>
              <ScanIcon weight="bold" data-icon="inline-start" />
              Scan their code
            </Button>
          </div>
        </section>
      </div>

      <ConnectCodeDialog tokenId={tokenId} open={showConnectCode} onOpenChange={setShowConnectCode} />
      <ScannerDialog
        open={scanning}
        onOpenChange={setScanning}
        title="Scan a connect code"
        description="Point your camera at the code on the other attendee's screen."
        onCode={(code) => {
          if (code.kind === 'connect') {
            navigate(connectPath(code.code))
            return true
          }
          toast.error('That is not a connect code. Ask them to open "Show my code".')
          return false
        }}
      />
    </div>
  )
}
