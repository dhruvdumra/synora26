import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Lifts content into place as it enters the viewport. Content is fully visible from the first frame;
 * only position animates, so slow devices and screenshots never show a half-faded page.
 */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { y: 18 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
