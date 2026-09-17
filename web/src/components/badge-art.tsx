import { cn } from 'cn'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Skeleton } from '@/components/ui/skeleton'
import { tierInfo } from '@/lib/tiers'

interface BadgeArtProps {
  image: string | null
  tier: number
  alt: string
  /** Increments when the tier changes, which plays the level-up pulse. */
  pulse?: number
  className?: string
}

/**
 * Renders the SVG returned by tokenURI. When the artwork changes, the new render cross-fades in;
 * a tier change adds a short ring pulse in the new tier's color.
 */
export function BadgeArt({ image, tier, alt, pulse = 0, className }: BadgeArtProps) {
  const reduceMotion = useReducedMotion()
  const swatch = tierInfo(tier).swatch

  if (!image) {
    return <Skeleton className={cn('aspect-square w-full rounded-[28px]', className)} aria-label="Loading badge" />
  }

  return (
    <div className={cn('relative aspect-square w-full', className)}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.img
          key={image}
          src={image}
          alt={alt}
          width={500}
          height={500}
          className="absolute inset-0 size-full rounded-[7.2%] shadow-[0_1px_2px_rgb(28_28_26/0.04),0_12px_40px_-12px_rgb(28_28_26/0.12)]"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </AnimatePresence>

      {pulse > 0 && !reduceMotion && (
        <motion.span
          key={pulse}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[7.2%]"
          style={{ boxShadow: `0 0 0 2px ${swatch}` }}
          initial={{ opacity: 0.9, scale: 1 }}
          animate={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
    </div>
  )
}
