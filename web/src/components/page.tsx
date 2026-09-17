import { cn } from 'cn'
import type { ReactNode } from 'react'

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn('relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 sm:py-16', className)}>{children}</main>
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-col gap-5 border-b border-foreground/15 pb-8 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-3xl flex-col gap-3">
        <h1 className="font-display text-[clamp(3rem,8vw,5.5rem)] uppercase">{title}</h1>
        {description && <p className="max-w-[60ch] text-lg text-muted-foreground">{description}</p>}
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

/** Empty, locked and error states: one quiet layout. */
export function StatePanel({ icon, title, children, action, className }: StatePanelProps) {
  return (
    <div
      role="status"
      className={cn(
        'mx-auto flex max-w-lg flex-col items-start gap-5 rounded-xl border border-foreground/10 bg-card p-8 sm:p-10',
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-md bg-foreground text-background [&_svg]:size-5">
        {icon}
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-4xl uppercase">{title}</h2>
        {children && <div className="text-muted-foreground">{children}</div>}
      </div>
      {action}
    </div>
  )
}
