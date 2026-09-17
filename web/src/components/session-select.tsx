import { CaretDownIcon } from '@phosphor-icons/react'
import { cn } from 'cn'
import type { SessionView } from '@/hooks/use-sessions'

interface SessionSelectProps {
  id: string
  sessions: SessionView[]
  value: bigint | undefined
  onChange: (sessionId: bigint) => void
  className?: string
}

/** Native select for reliability on phones at the door, styled to match inputs. */
export function SessionSelect({ id, sessions, value, onChange, className }: SessionSelectProps) {
  const open = sessions.filter((session) => session.active)
  return (
    <div className={cn('relative', className)}>
      <select
        id={id}
        value={value?.toString() ?? ''}
        onChange={(event) => event.target.value && onChange(BigInt(event.target.value))}
        className="h-9 w-full appearance-none rounded-md border border-input bg-transparent pr-9 pl-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        <option value="" disabled>
          {open.length ? 'Choose a session' : 'No open sessions'}
        </option>
        {open.map((session) => (
          <option key={session.id.toString()} value={session.id.toString()}>
            {session.name}
          </option>
        ))}
      </select>
      <CaretDownIcon
        weight="bold"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}
