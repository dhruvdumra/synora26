import { cn } from 'cn'

/** Simple geometric mark echoing the progress ring drawn on every badge. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('size-5', className)}>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="3" />
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray="68 100"
        transform="rotate(-90 12 12)"
      />
    </svg>
  )
}
