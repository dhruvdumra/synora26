import { cn } from 'cn'
import type { ReactNode } from 'react'

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn('relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16', className)}>{children}</main>
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-2xl flex-col gap-2">
        <h1 className="font-display text-4xl leading-[1.1] sm:text-5xl">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

interface StatePanelProps {
  icon: ReactNode
  title: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}

/** Empty, locked and error states share one quiet layout. */
export function StatePanel({ icon, title, children, action, className }: StatePanelProps) {
  return (
    <div
      role="status"
      className={cn(
        'mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border bg-card px-6 py-12 text-center',
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-foreground [&_svg]:size-5">
        {icon}
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-medium">{title}</h2>
        {children && <div className="text-sm text-muted-foreground">{children}</div>}
      </div>
      {action}
    </div>
  )
}
