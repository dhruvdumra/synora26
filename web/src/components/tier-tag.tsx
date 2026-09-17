import { cn } from 'cn'
import { tierInfo } from '@/lib/tiers'

export function TierTag({ tier, className }: { tier: number; className?: string }) {
  const info = tierInfo(tier)
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium tracking-[0.06em] uppercase',
        info.tagClass,
        className,
      )}
    >
      {info.name}
    </span>
  )
}
