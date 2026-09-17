import { ScanIcon, UsersThreeIcon } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { parseEventLogs } from 'viem'
import { badgeAbi } from '@/lib/badge-abi'
import { ScannerDialog } from '@/components/scanner-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ActionRecord } from '@/hooks/use-contract-action'
import { useContractAction } from '@/hooks/use-contract-action'
import type { SessionView } from '@/hooks/use-sessions'
import { parseTokenIdList } from '@/lib/codes'
import { badgeNumber } from '@/lib/format'

interface CheckInPanelProps {
  session: SessionView | undefined
  onRecord: (record: ActionRecord) => void
}

const MAX_BATCH = 200

export function CheckInPanel({ session, onRecord }: CheckInPanelProps) {
  const { send, busy } = useContractAction()
  const [tokenInput, setTokenInput] = useState('')
  const [batchInput, setBatchInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const batchIds = parseTokenIdList(batchInput)

  if (!session) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Select an open session on the left to start checking people in.
      </p>
    )
  }
  const activeSession = session

  function checkInOne(tokenId: bigint) {
    return send('checkIn', [tokenId, activeSession.id], {
      pending: `Checking in ${badgeNumber(tokenId)}`,
      success: `Checked in ${badgeNumber(tokenId)} to ${activeSession.name}`,
      onRecord,
    })
  }

  async function submitSingle(event: FormEvent) {
    event.preventDefault()
    const [tokenId] = parseTokenIdList(tokenInput)
    if (!tokenId) return
    if (await checkInOne(tokenId)) setTokenInput('')
  }

  async function submitBatch(event: FormEvent) {
    event.preventDefault()
    if (batchIds.length === 0 || batchIds.length > MAX_BATCH) return
    const receipt = await send('checkInBatch', [batchIds, activeSession.id], {
      pending: `Checking in ${batchIds.length} badges`,
      success: (batchReceipt) => {
        const [event] = parseEventLogs({ abi: badgeAbi, eventName: 'BatchCheckIn', logs: batchReceipt.logs })
        if (!event) return `Batch checked in to ${activeSession.name}`
        const { processed, skipped } = event.args
        return `${processed} checked in to ${activeSession.name}${skipped > 0n ? `, ${skipped} skipped` : ''}`
      },
      onRecord,
    })
    if (receipt) setBatchInput('')
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={submitSingle} className="flex flex-col gap-2">
        <Label htmlFor="checkin-token">Pass number</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="checkin-token"
            inputMode="numeric"
            autoComplete="off"
            placeholder="12"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            className="w-32 font-mono"
          />
          <Button type="submit" variant="signal" disabled={!parseTokenIdList(tokenInput).length || busy !== null}>
            Check in
          </Button>
          <Button type="button" variant="outline" onClick={() => setScanning(true)}>
            <ScanIcon weight="bold" data-icon="inline-start" />
            Scan pass
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Checking in to {session.name}.</p>
      </form>

      <form onSubmit={submitBatch} className="flex flex-col gap-2 border-t pt-8">
        <Label htmlFor="checkin-batch" className="flex items-center gap-2">
          <UsersThreeIcon weight="bold" className="size-4" />
          Batch check-in
        </Label>
        <Textarea
          id="checkin-batch"
          rows={4}
          placeholder="3, 4, 5, 9, 12"
          value={batchInput}
          onChange={(event) => setBatchInput(event.target.value)}
          className="font-mono"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            One transaction for the whole room. Already checked-in or unknown numbers are skipped, not failed.
          </p>
          <Button type="submit" disabled={batchIds.length === 0 || batchIds.length > MAX_BATCH || busy !== null}>
            {batchIds.length > MAX_BATCH
              ? `Max ${MAX_BATCH} per batch`
              : batchIds.length > 0
                ? `Check in ${batchIds.length} ${batchIds.length === 1 ? 'pass' : 'passes'}`
                : 'Check in batch'}
          </Button>
        </div>
      </form>

      <ScannerDialog
        open={scanning}
        onOpenChange={setScanning}
        title={`Scan into ${session.name}`}
        description="Scan the door code on the attendee's pass page. The camera stays open for the next person."
        onCode={(code) => {
          if (code.kind !== 'badge') {
            toast.error('That is not a door code.')
            return false
          }
          void checkInOne(code.tokenId)
          return false
        }}
      />
    </div>
  )
}
