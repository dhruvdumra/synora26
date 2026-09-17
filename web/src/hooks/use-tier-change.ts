import { useEffect, useRef, useState } from 'react'

/**
 * Detects when a badge's tier moves while the page is open. Returns a counter that increments on each
 * change (usable as an animation key) and the direction of the latest change.
 */
export function useTierChange(tokenId: bigint | undefined, tier: number | undefined) {
  const previous = useRef<{ tokenId?: bigint; tier?: number }>({})
  const [pulse, setPulse] = useState(0)
  const [lastChange, setLastChange] = useState<{ from: number; to: number } | null>(null)

  useEffect(() => {
    if (tokenId === undefined || tier === undefined) return
    const before = previous.current
    if (before.tokenId === tokenId && before.tier !== undefined && before.tier !== tier) {
      setLastChange({ from: before.tier, to: tier })
      setPulse((count) => count + 1)
    }
    previous.current = { tokenId, tier }
  }, [tokenId, tier])

  return { pulse, lastChange }
}
