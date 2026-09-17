import { MicrophoneStageIcon, SealCheckIcon, StarIcon } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { isAddress } from 'viem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionRecord } from '@/hooks/use-contract-action'
import { useContractAction } from '@/hooks/use-contract-action'
import { parseTokenIdList } from '@/lib/codes'
import { badgeNumber, shortAddress } from '@/lib/format'

export function BadgeActionsPanel({ onRecord }: { onRecord: (record: ActionRecord) => void }) {
  const { send, busy } = useContractAction()
  const [tokenInput, setTokenInput] = useState('')
  const [points, setPoints] = useState('3')
  const [mintAddress, setMintAddress] = useState('')

  const [tokenId] = parseTokenIdList(tokenInput)
  const pointValue = Number(points)
  const validPoints = Number.isInteger(pointValue) && pointValue >= 1 && pointValue <= 10

  function recordTalk() {
    if (!tokenId) return
    void send('markSpeaker', [tokenId], {
      pending: `Recording a talk for ${badgeNumber(tokenId)}`,
      success: `Recorded a talk for ${badgeNumber(tokenId)}`,
      onRecord,
    })
  }

  function awardPoints() {
    if (!tokenId || !validPoints) return
    void send('logNetworking', [tokenId, pointValue], {
      pending: `Awarding ${pointValue} points to ${badgeNumber(tokenId)}`,
      success: `Awarded ${pointValue} points to ${badgeNumber(tokenId)}`,
      onRecord,
    })
  }

  async function sponsorMint(event: FormEvent) {
    event.preventDefault()
    const address = mintAddress.trim()
    if (!isAddress(address)) return
    const receipt = await send('mintTo', [address], {
      pending: `Minting for ${shortAddress(address)}`,
      success: `Minted a badge for ${shortAddress(address)}`,
      onRecord,
    })
    if (receipt) setMintAddress('')
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="action-token">Badge number</Label>
          <Input
            id="action-token"
            inputMode="numeric"
            autoComplete="off"
            placeholder="12"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            className="w-32 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Button variant="outline" disabled={!tokenId || busy !== null} onClick={recordTalk}>
            <MicrophoneStageIcon weight="bold" data-icon="inline-start" />
            Record a talk
          </Button>
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="action-points">Points</Label>
              <Input
                id="action-points"
                type="number"
                min={1}
                max={10}
                value={points}
                onChange={(event) => setPoints(event.target.value)}
                className="w-20 font-mono"
                aria-invalid={!validPoints}
              />
            </div>
            <Button variant="outline" disabled={!tokenId || !validPoints || busy !== null} onClick={awardPoints}>
              <StarIcon weight="bold" data-icon="inline-start" />
              Award points
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          A talk is worth 3 points and grants the Speaker tier. Awards are capped at 10 points each.
        </p>
      </div>

      <form onSubmit={sponsorMint} className="flex flex-col gap-2 border-t pt-8">
        <Label htmlFor="mint-address">Sponsored mint</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="mint-address"
            autoComplete="off"
            spellCheck={false}
            placeholder="0x wallet address"
            value={mintAddress}
            onChange={(event) => setMintAddress(event.target.value)}
            className="font-mono"
            aria-invalid={mintAddress.length > 0 && !isAddress(mintAddress.trim())}
          />
          <Button type="submit" variant="outline" disabled={!isAddress(mintAddress.trim()) || busy !== null}>
            <SealCheckIcon weight="bold" data-icon="inline-start" />
            Mint for attendee
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">For attendees without gas. Staff pay the fee, the badge goes to their wallet.</p>
      </form>
    </div>
  )
}
