import { CopyIcon, SealCheckIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useBalance } from 'wagmi'
import { QrCode } from '@/components/qr-code'
import { Button } from '@/components/ui/button'
import { useContractAction } from '@/hooks/use-contract-action'
import { chain, isLocalChain } from '@/lib/config'

export function MintPanel({ address }: { address: `0x${string}` }) {
  const { send, busy } = useContractAction()
  const balance = useBalance({ address, chainId: chain.id })
  const hasGas = balance.data ? balance.data.value > 0n : true

  return (
    <div className="grid gap-10 rounded-xl border bg-card p-6 sm:p-10 md:grid-cols-[1fr_auto] md:items-center">
      <div className="flex max-w-lg flex-col gap-5">
        <div className="flex size-11 items-center justify-center rounded-lg bg-bronze-soft text-bronze-ink">
          <SealCheckIcon weight="bold" className="size-5" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl leading-[1.1]">Claim your badge</h1>
          <p className="text-muted-foreground">
            Your badge starts at Bronze. It cannot be transferred, so the progress you earn stays with this wallet.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            disabled={busy !== null || !hasGas}
            onClick={() => void send('mint', [], { pending: 'Minting your badge', success: 'Badge minted' })}
          >
            {busy === 'mint' ? 'Minting...' : 'Mint badge'}
          </Button>
          {!hasGas && (
            <p className="text-sm text-muted-foreground">
              {isLocalChain ? 'This account has no ETH.' : 'No Sepolia ETH for gas. Ask staff to mint it for you.'}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 border-t pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-10">
        <QrCode value={address} label="Wallet address" />
        <p className="max-w-[210px] text-center text-xs text-muted-foreground">
          No gas? Staff can scan your address and mint the badge for you.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void navigator.clipboard.writeText(address).then(() => toast.success('Address copied'))
          }}
        >
          <CopyIcon weight="bold" data-icon="inline-start" />
          Copy address
        </Button>
      </div>
    </div>
  )
}
