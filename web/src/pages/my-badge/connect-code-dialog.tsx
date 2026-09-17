import { ArrowClockwiseIcon } from '@phosphor-icons/react'
import { useCallback, useEffect, useState } from 'react'
import { useSignTypedData } from 'wagmi'
import { QrCode } from '@/components/qr-code'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCollectionName } from '@/hooks/use-badge'
import { badgeAddress, chain } from '@/lib/config'
import { connectUrl } from '@/lib/codes'
import { describeError } from '@/lib/errors'

const CODE_LIFETIME_SECONDS = 10 * 60

interface ConnectCodeDialogProps {
  tokenId: bigint
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Signs an EIP-712 "Connect" message (free, no gas) and shows it as a QR code. Whoever scans it can
 * submit the connection, and the contract checks the signature came from this badge's holder.
 */
export function ConnectCodeDialog({ tokenId, open, onOpenChange }: ConnectCodeDialogProps) {
  const name = useCollectionName()
  const { signTypedDataAsync, isPending } = useSignTypedData()
  const [code, setCode] = useState<{ url: string; expiresAt: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const createCode = useCallback(async () => {
    if (!name) return
    setError(null)
    const deadline = BigInt(Math.floor(Date.now() / 1000) + CODE_LIFETIME_SECONDS)
    try {
      const signature = await signTypedDataAsync({
        domain: { name, version: '1', chainId: chain.id, verifyingContract: badgeAddress },
        types: { Connect: [{ name: 'tokenId', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
        primaryType: 'Connect',
        message: { tokenId, deadline },
      })
      setCode({ url: connectUrl({ peerTokenId: tokenId, deadline, signature }), expiresAt: Number(deadline) * 1000 })
    } catch (signError) {
      setError(describeError(signError))
    }
  }, [name, signTypedDataAsync, tokenId])

  useEffect(() => {
    if (open && !code && !isPending && !error) void createCode()
  }, [open, code, isPending, error, createCode])

  useEffect(() => {
    if (!open) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [open])

  const secondsLeft = code ? Math.max(0, Math.round((code.expiresAt - now) / 1000)) : 0
  const expired = code !== null && secondsLeft === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Your connect code</DialogTitle>
          <DialogDescription>
            Let another attendee scan this. You both gain a networking point once their transaction confirms.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {code && !expired && <QrCode value={code.url} label="Connect code" />}
          {!code && !error && <p className="py-16 text-sm text-muted-foreground">Sign the message in your wallet. It costs no gas.</p>}
          {error && <p role="alert" className="py-8 text-center text-sm text-destructive">{error}</p>}
          {expired && <p className="py-16 text-sm text-muted-foreground">This code expired.</p>}

          {code && !expired && (
            <p className="font-mono text-[13px] text-muted-foreground tabular">
              Expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
            </p>
          )}
          {(expired || error) && (
            <Button
              variant="outline"
              onClick={() => {
                setCode(null)
                setError(null)
              }}
            >
              <ArrowClockwiseIcon weight="bold" data-icon="inline-start" />
              New code
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
