import { cn } from 'cn'
import { tierInfo } from '@/lib/tiers'

/** Access chip: a slice of the pass's tier band. */
export function TierTag({ tier, className }: { tier: number; className?: string }) {
  const info = tierInfo(tier)
  return (
    <span
      className={cn(
        'font-condensed inline-flex h-6 items-center rounded-sm px-2 text-[12px] leading-none font-bold tracking-[0.06em] uppercase',
        info.chipClass,
        className,
      )}
    >
      {info.name}
    </span>
  )
}
