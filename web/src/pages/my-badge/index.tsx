import { HandshakeIcon, QrCodeIcon, ScanIcon, WalletIcon } from '@phosphor-icons/react'
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

export function MyBadgePage() {
  const { address, isConnected, tokenId, isLoading } = useMyBadgeId()

  if (!isConnected || !address) {
    return (
      <Page>
        <StatePanel
          icon={<WalletIcon weight="bold" />}
          title="Connect to see your badge"
          action={<WalletButton size="lg" />}
        >
          Your badge lives in your wallet. Connect it to mint a badge or check your progress.
        </StatePanel>
      </Page>
    )
  }

  if (isLoading) {
    return (
      <Page>
        <div className="grid gap-10 md:grid-cols-[minmax(0,440px)_1fr]">
          <Skeleton className="aspect-square w-full rounded-[28px]" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-14 w-48" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </Page>
    )
  }

  return <Page>{tokenId ? <OwnedBadge tokenId={tokenId} /> : <MintPanel address={address} />}</Page>
}

function OwnedBadge({ tokenId }: { tokenId: bigint }) {
  const navigate = useNavigate()
  const { badge } = useBadge(tokenId)
  const { pulse, lastChange } = useTierChange(tokenId, badge?.tier)
  const [showConnectCode, setShowConnectCode] = useState(false)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    if (!lastChange) return
    const reached = tierInfo(lastChange.to)
    toast.success(`${reached.name} reached`, {
      description: reached.summary,
      action: { label: 'View perks', onClick: () => navigate('/perks') },
    })
  }, [lastChange, navigate])

  if (!badge) {
    return <Skeleton className="aspect-square w-full max-w-[440px] rounded-[28px]" />
  }

  return (
    <div className="grid gap-10 md:grid-cols-[minmax(0,440px)_1fr] md:gap-14 lg:gap-20">
      <div className="flex flex-col gap-4">
        <BadgeArt image={badge.image} tier={badge.tier} pulse={pulse} alt={`Badge ${badgeNumber(tokenId)}, ${tierInfo(badge.tier).name} tier`} />
        <p className="text-center text-xs text-muted-foreground">
          Rendered by the contract. Updates as soon as a check-in lands on-chain.
        </p>
      </div>

      <div className="flex flex-col gap-10">
        <BadgeDetails badge={badge} />

        <section aria-labelledby="checkin-heading" className="flex flex-col gap-5 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
          <QrCode value={badgeUrl(tokenId)} label={`Badge ${badgeNumber(tokenId)} check-in code`} className="self-center" />
          <div className="flex flex-col gap-2">
            <h2 id="checkin-heading" className="flex items-center gap-2 font-medium">
              <QrCodeIcon weight="bold" className="size-4" />
              Check-in code
            </h2>
            <p className="text-sm text-muted-foreground">
              Show this at the session door. Staff scan it and your badge updates within a block.
            </p>
          </div>
        </section>

        <section aria-labelledby="network-heading" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="network-heading" className="flex items-center gap-2 font-medium">
              <HandshakeIcon weight="bold" className="size-4" />
              Meet someone
            </h2>
            <p className="text-sm text-muted-foreground">
              Swap codes with another checked-in attendee. Each new connection adds a point to both badges.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setShowConnectCode(true)}>
              <QrCodeIcon weight="bold" data-icon="inline-start" />
              Show my code
            </Button>
            <Button variant="outline" onClick={() => setScanning(true)}>
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
