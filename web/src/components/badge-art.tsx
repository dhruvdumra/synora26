import { cn } from 'cn'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { EVENT_NAME } from '@/lib/config'

interface PassArtProps {
  /** SVG data URI returned by the contract's tokenURI. */
  image: string | null
  alt: string
  /** Increments when the tier changes: the pass re-issues and a scan line crosses it. */
  pulse?: number
  /** Whether the lanyard runs up off the top of the section, as if hung from the header. */
  strap?: 'header' | 'none'
  /** Swing to rest when the pass first appears. */
  swing?: boolean
  className?: string
}

const STRAP_TEXT = Array.from({ length: 12 }, () => `LOYL   ${EVENT_NAME.toUpperCase()}   `).join('')

function Lanyard({ className }: { className: string }) {
  return (
    <div aria-hidden="true" className={cn('absolute bottom-[95.2%] left-1/2 w-7 -translate-x-1/2', className)}>
      <div className="absolute inset-x-0 top-0 bottom-3 overflow-hidden bg-signal">
        <span
          className="font-condensed absolute top-0 left-1/2 -translate-x-1/2 text-[10px] leading-none font-bold tracking-[0.12em] whitespace-nowrap text-signal-ink/80"
          style={{ writingMode: 'vertical-rl' }}
        >
          {STRAP_TEXT}
        </span>
      </div>
      {/* Clip that holds the pass by its slot. */}
      <div className="absolute bottom-0 left-1/2 h-5 w-4 -translate-x-1/2 rounded-[3px] border-2 border-[#8b9099] bg-[#b9bec6] dark:border-[#6b7079] dark:bg-[#4a4e56]" />
    </div>
  )
}

export function BadgeArt({ image, alt, pulse = 0, strap = 'none', swing = false, className }: PassArtProps) {
  const reduceMotion = useReducedMotion()
  const animateSwing = swing && !reduceMotion

  return (
    <motion.figure
      className={cn('relative mx-auto w-full', className)}
      style={{ transformOrigin: '50% -40%' }}
      initial={animateSwing ? { rotate: 4.5 } : false}
      animate={{ rotate: 0 }}
      transition={{ type: 'spring', stiffness: 42, damping: 7, mass: 1 }}
    >
      {strap === 'header' && <Lanyard className="h-[1400px]" />}

      <div className="relative aspect-[540/860] w-full drop-shadow-[0_28px_36px_rgb(12_13_15/0.22)] dark:drop-shadow-[0_20px_28px_rgb(0_0_0/0.35)]">
        {image ? (
          <AnimatePresence initial={false} mode="popLayout">
            <motion.img
              key={image}
              src={image}
              alt={alt}
              width={540}
              height={860}
              draggable={false}
              className="absolute inset-0 size-full select-none"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, transition: { duration: 0.25 } }}
              transition={{ duration: reduceMotion ? 0.15 : 0.55, ease: [0.16, 1, 0.3, 1], delay: reduceMotion ? 0 : 0.15 }}
            />
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 animate-pulse rounded-[5.5%] bg-pass/90" role="img" aria-label="Loading pass" />
        )}

        {pulse > 0 && !reduceMotion && (
          <motion.span
            key={pulse}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 h-[3px] bg-signal"
            initial={{ top: '2%', opacity: 1 }}
            animate={{ top: '98%', opacity: [1, 1, 0] }}
            transition={{ duration: 1.1, ease: [0.45, 0, 0.2, 1], delay: 0.2 }}
          />
        )}
      </div>
    </motion.figure>
  )
}
