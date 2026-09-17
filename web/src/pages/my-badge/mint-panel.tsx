import { CopyIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useBalance } from 'wagmi'
import { QrCode } from '@/components/qr-code'
import { Button } from '@/components/ui/button'
import { useContractAction } from '@/hooks/use-contract-action'
import { chain, isLocalChain } from '@/lib/config'
import { shortAddress } from '@/lib/format'

/** An unissued pass: the outline waiting for its band. */
function BlankPass() {
  return (
    <div
      aria-hidden="true"
      className="relative aspect-[540/860] w-[220px] shrink-0 rounded-[20px] border-2 border-dashed border-foreground/25 sm:w-[280px]"
    >
      <span className="absolute top-[4%] left-1/2 h-[2%] w-[16%] -translate-x-1/2 rounded-full border-2 border-dashed border-foreground/25" />
      <span className="absolute inset-x-0 top-[35%] h-[17%] bg-foreground/[0.06]" />
      <span className="font-display absolute top-[39%] left-[9%] text-[clamp(2.5rem,4vw,3.5rem)] text-foreground/25 uppercase">Bronze</span>
    </div>
  )
}

export function MintPanel({ address }: { address: `0x${string}` }) {
  const { send, busy } = useContractAction()
  const balance = useBalance({ address, chainId: chain.id })
  const hasGas = balance.data ? balance.data.value > 0n : true

  return (
    <div className="grid gap-14 md:grid-cols-[280px_1fr] md:items-center md:gap-20">
      <BlankPass />

      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-[clamp(3.5rem,9vw,6.5rem)] uppercase">Claim your pass</h1>
          <p className="max-w-[46ch] text-xl leading-snug text-muted-foreground">
            It starts at Bronze and is locked to this wallet, so everything you earn stays with you.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button
            size="lg"
            variant="signal"
            disabled={busy !== null || !hasGas}
            onClick={() => void send('mint', [], { pending: 'Issuing your pass', success: 'Pass issued' })}
          >
            {busy === 'mint' ? 'Issuing...' : 'Mint my pass'}
          </Button>
          {!hasGas && (
            <p className="text-muted-foreground">
              {isLocalChain ? 'This account has no ETH.' : 'No Sepolia ETH for gas. Staff can mint it for you.'}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-5 border-t border-foreground/15 pt-8 sm:flex-row sm:items-center">
          <QrCode value={address} label="Wallet address" />
          <div className="flex flex-col items-start gap-2">
            <h2 className="font-display text-3xl uppercase">No gas?</h2>
            <p className="max-w-[36ch] text-muted-foreground">
              Show this to staff. They mint the pass straight to <span className="font-mono text-sm text-foreground">{shortAddress(address)}</span>.
            </p>
            <Button
              variant="ghost"
              className="-ml-3"
              onClick={() => {
                void navigator.clipboard.writeText(address).then(() => toast.success('Address copied'))
              }}
            >
              <CopyIcon weight="bold" data-icon="inline-start" />
              Copy address
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
