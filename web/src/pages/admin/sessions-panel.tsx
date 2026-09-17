import { PlusIcon } from '@phosphor-icons/react'
import { cn } from 'cn'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import type { ActionRecord } from '@/hooks/use-contract-action'
import { useContractAction } from '@/hooks/use-contract-action'
import type { SessionView } from '@/hooks/use-sessions'

interface SessionsPanelProps {
  sessions: SessionView[]
  isLoading: boolean
  selected: bigint | undefined
  onSelect: (sessionId: bigint) => void
  onRecord: (record: ActionRecord) => void
}

export function SessionsPanel({ sessions, isLoading, selected, onSelect, onRecord }: SessionsPanelProps) {
  const { send, busy } = useContractAction()
  const [name, setName] = useState('')

  async function createSession(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const receipt = await send('createSession', [trimmed], {
      pending: `Creating "${trimmed}"`,
      success: `Created session "${trimmed}"`,
      onRecord,
    })
    if (receipt) setName('')
  }

  return (
    <section aria-labelledby="sessions-heading" className="flex flex-col gap-5">
      <h2 id="sessions-heading" className="font-display text-3xl uppercase">
        Sessions
      </h2>

      <form onSubmit={createSession} className="flex flex-col gap-2">
        <Label htmlFor="session-name">New session</Label>
        <div className="flex gap-2">
          <Input
            id="session-name"
            value={name}
            maxLength={64}
            placeholder="Gas Golfing Workshop"
            onChange={(event) => setName(event.target.value)}
          />
          <Button type="submit" variant="outline" size="icon" disabled={!name.trim() || busy !== null} aria-label="Create session">
            <PlusIcon weight="bold" />
          </Button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Create the first session, then check attendees in to it.
        </p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Sessions">
          {sessions.map((session) => {
            const isSelected = session.id === selected
            return (
              <li
                key={session.id.toString()}
                className={cn(
                  'flex items-center gap-3 rounded-md bg-card p-3.5 ring-1 ring-foreground/10 transition-shadow',
                  isSelected && 'ring-2 ring-foreground',
                  !session.active && 'opacity-70',
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(session.id)}
                  disabled={!session.active}
                  aria-pressed={isSelected}
                  className="flex min-w-0 flex-1 flex-col items-start text-left disabled:cursor-not-allowed"
                >
                  <span className="w-full truncate font-semibold">{session.name}</span>
                  <span className="font-mono text-xs text-muted-foreground tabular">
                    {session.attendance} checked in{session.active ? '' : ', closed'}
                  </span>
                </button>
                <Switch
                  checked={session.active}
                  disabled={busy !== null}
                  aria-label={`${session.active ? 'Close' : 'Reopen'} ${session.name}`}
                  onCheckedChange={(active) =>
                    void send('setSessionActive', [session.id, active], {
                      pending: `${active ? 'Reopening' : 'Closing'} "${session.name}"`,
                      success: `${active ? 'Reopened' : 'Closed'} "${session.name}"`,
                      onRecord,
                    })
                  }
                />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
