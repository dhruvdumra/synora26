import { HandshakeIcon, LinkBreakIcon, WalletIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useReadContract } from 'wagmi'
import { BadgeArt } from '@/components/badge-art'
import { Page, StatePanel } from '@/components/page'
import { TierTag } from '@/components/tier-tag'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/wallet-button'
import { useBadge, useMyBadgeId } from '@/hooks/use-badge'
import { useContractAction } from '@/hooks/use-contract-action'
import { badgeAbi } from '@/lib/badge-abi'
import { parseConnectParams } from '@/lib/codes'
import { badgeAddress, chain } from '@/lib/config'
import { badgeNumber } from '@/lib/format'

export function ConnectPage() {
  const [params] = useSearchParams()
  const code = parseConnectParams(params)
  const navigate = useNavigate()
  const { isConnected, tokenId: myTokenId, isLoading } = useMyBadgeId()
  const { badge: peer, notFound } = useBadge(code?.peerTokenId)
  const { send, busy } = useContractAction()
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const alreadyConnected = useReadContract({
    address: badgeAddress,
    abi: badgeAbi,
    chainId: chain.id,
    functionName: 'isConnected',
    args: [myTokenId ?? 0n, code?.peerTokenId ?? 0n],
    query: { enabled: !!myTokenId && !!code },
  })

  if (!code || notFound) {
    return (
      <Page>
        <StatePanel icon={<LinkBreakIcon weight="bold" />} title="This connect code is not valid">
          Ask the other attendee to open their badge and show a fresh code.
        </StatePanel>
      </Page>
    )
  }

  const secondsLeft = Number(code.deadline) - now
  const expired = secondsLeft <= 0
  const isSelf = myTokenId !== undefined && myTokenId === code.peerTokenId

  let blocker: string | null = null
  if (expired) blocker = 'This code expired. Ask for a fresh one.'
  else if (isSelf) blocker = 'This is your own code. Share it with someone else.'
  else if (alreadyConnected.data) blocker = 'You are already connected with this attendee.'

  return (
    <Page className="max-w-3xl">
      <div className="grid items-center gap-10 sm:grid-cols-[220px_1fr]">
        <BadgeArt image={peer?.image ?? null} tier={peer?.tier ?? 0} alt={`Badge ${badgeNumber(code.peerTokenId)}`} />
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              {peer && <TierTag tier={peer.tier} />}
              <span className="font-mono text-[13px] text-muted-foreground">Badge {badgeNumber(code.peerTokenId)}</span>
            </div>
            <h1 className="font-display text-4xl leading-[1.1]">Connect with this attendee</h1>
            <p className="text-muted-foreground">
              Their wallet signed this code. Confirming adds a networking point to both badges.
            </p>
          </div>

          {!isConnected ? (
            <StatePanel icon={<WalletIcon weight="bold" />} title="Connect your wallet first" className="mx-0 items-start py-6 text-left" action={<WalletButton />} />
          ) : isLoading ? null : !myTokenId ? (
            <p className="text-sm text-muted-foreground">
              You need a badge to connect. <Link to="/badge" className="text-foreground underline underline-offset-4">Mint yours first.</Link>
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="self-start"
                disabled={blocker !== null || busy !== null}
                onClick={async () => {
                  const receipt = await send('connect', [code.peerTokenId, code.deadline, code.signature], {
                    pending: `Connecting with ${badgeNumber(code.peerTokenId)}`,
                    success: `Connected with ${badgeNumber(code.peerTokenId)}`,
                  })
                  if (receipt) navigate('/badge')
                }}
              >
                <HandshakeIcon weight="bold" data-icon="inline-start" />
                {busy ? 'Connecting...' : 'Confirm connection'}
              </Button>
              <p className="text-sm text-muted-foreground" role={blocker ? 'alert' : undefined}>
                {blocker ?? `Code valid for ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </Page>
  )
}
