import { LockSimpleIcon, LockSimpleOpenIcon, SignatureIcon, WalletIcon } from '@phosphor-icons/react'
import { useMutation } from '@tanstack/react-query'
import { cn } from 'cn'
import { useState } from 'react'
import { Link } from 'react-router'
import { useAccount, useSignMessage } from 'wagmi'
import { Page, PageHeader, StatePanel } from '@/components/page'
import { TierTag } from '@/components/tier-tag'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/wallet-button'
import { useMyBadgeId } from '@/hooks/use-badge'
import { api, type ApiPerk } from '@/lib/api'
import { describeError } from '@/lib/errors'
import { tierInfo } from '@/lib/tiers'

const PLACEHOLDER: ApiPerk[] = [
  { id: 'session-resources', tier: 1, title: 'Session resources', open: false, body: null },
  { id: 'sponsor-perks', tier: 2, title: 'Sponsor perks', open: false, body: null },
  { id: 'speaker-room', tier: 3, title: 'Speaker room', open: false, body: null },
]

export function PerksPage() {
  const { isConnected, address } = useAccount()
  const { tokenId } = useMyBadgeId()
  const { signMessageAsync } = useSignMessage()
  const [perks, setPerks] = useState<ApiPerk[] | null>(null)
  const [verifiedInMs, setVerifiedInMs] = useState<number | null>(null)

  const signIn = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error('Connect a wallet first.')
      const { nonce, message } = await api.gateNonce(address)
      const signature = await signMessageAsync({ message })
      return api.gateVerify({ address, nonce, signature })
    },
    onSuccess: (result) => {
      setPerks(result.perks)
      setVerifiedInMs(result.verifiedInMs)
    },
  })

  if (!isConnected) {
    return (
      <Page>
        <StatePanel icon={<WalletIcon weight="bold" />} title="Perks open by tier" action={<WalletButton size="lg" />}>
          Connect the wallet holding your pass to see which doors are open.
        </StatePanel>
      </Page>
    )
  }

  const rows = perks ?? PLACEHOLDER

  return (
    <Page>
      <PageHeader
        title="Perks"
        description="Perks are released by the server, not the browser, so a locked perk never reaches a wallet that has not earned it. Sign once to prove the pass is yours."
        actions={
          !tokenId ? (
            <Button size="lg" variant="signal" asChild>
              <Link to="/badge">Mint my pass</Link>
            </Button>
          ) : !perks ? (
            <Button size="lg" variant="signal" disabled={signIn.isPending} onClick={() => signIn.mutate()}>
              <SignatureIcon weight="bold" data-icon="inline-start" />
              {signIn.isPending ? 'Waiting for signature...' : 'Sign to open'}
            </Button>
          ) : undefined
        }
      />

      {signIn.isError && (
        <p role="alert" className="mb-8 rounded-md bg-destructive/10 px-4 py-3 text-destructive">
          {describeError(signIn.error)}
        </p>
      )}

      {verifiedInMs !== null && (
        <p className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-signal" />
          Signature checked and tier read from the chain in{' '}
          <span className="font-mono text-foreground tabular">{verifiedInMs} ms</span>. Signing costs no gas.
        </p>
      )}

      <ul className="flex flex-col">
        {rows.map((perk) => (
          <li
            key={perk.id}
            className="grid gap-4 border-t-2 border-foreground py-8 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-10"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <TierTag tier={perk.tier} />
                {perk.tier < 3 && <span className="text-sm text-muted-foreground">and above</span>}
              </div>
              <h2
                className={cn(
                  'font-display text-[clamp(2.5rem,6vw,4rem)] uppercase',
                  !perk.open && 'text-foreground/35',
                )}
              >
                {perk.title}
              </h2>
              {perk.body ? (
                <p className="max-w-[60ch] rounded-md bg-card p-4 ring-1 ring-foreground/10">{perk.body}</p>
              ) : (
                <p className="max-w-[48ch] text-muted-foreground">
                  {perks
                    ? `Reach ${tierInfo(perk.tier).name} and this opens automatically.`
                    : 'Sign with your wallet to check what your pass opens.'}
                </p>
              )}
            </div>
            <div
              className={cn(
                'font-condensed flex items-center gap-2 self-start rounded-md px-4 py-3 text-sm font-bold tracking-[0.04em] uppercase',
                perk.open ? 'bg-signal text-signal-ink' : 'bg-foreground/[0.06] text-muted-foreground',
              )}
            >
              {perk.open ? (
                <LockSimpleOpenIcon weight="bold" className="size-4" />
              ) : (
                <LockSimpleIcon weight="bold" className="size-4" />
              )}
              {perk.open ? 'Access granted' : `Needs ${tierInfo(perk.tier).name}`}
            </div>
          </li>
        ))}
      </ul>
    </Page>
  )
}
