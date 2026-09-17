import { cn } from 'cn'

/** A pass seen head-on: rounded card, lanyard slot, access band. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 22" aria-hidden="true" className={cn('h-[22px] w-4', className)}>
      <rect x="0.75" y="0.75" width="14.5" height="20.5" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="5.5" y="3" width="5" height="1.6" rx="0.8" fill="currentColor" />
      <rect x="0.75" y="9" width="14.5" height="4.5" fill="var(--signal)" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <BrandMark />
      <span className="font-display text-[26px] leading-none tracking-[-0.01em]">LOYL</span>
    </span>
  )
}
