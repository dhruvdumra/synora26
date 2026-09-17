import { isHex, type Hex } from 'viem'

/**
 * QR payloads are plain app URLs, so any phone camera opens the right page directly,
 * and the in-app scanner can parse them without a custom format.
 */

export function badgeUrl(tokenId: bigint) {
  return `${window.location.origin}/badge/${tokenId.toString()}`
}

export interface ConnectCode {
  peerTokenId: bigint
  deadline: bigint
  signature: Hex
}

export function connectPath({ peerTokenId, deadline, signature }: ConnectCode) {
  const params = new URLSearchParams({
    peer: peerTokenId.toString(),
    deadline: deadline.toString(),
    sig: signature,
  })
  return `/connect?${params.toString()}`
}

export function connectUrl(code: ConnectCode) {
  return `${window.location.origin}${connectPath(code)}`
}

export function parseConnectParams(params: URLSearchParams): ConnectCode | null {
  const peer = params.get('peer')
  const deadline = params.get('deadline')
  const sig = params.get('sig')
  if (!peer || !deadline || !sig || !/^\d+$/.test(peer) || !/^\d+$/.test(deadline) || !isHex(sig)) {
    return null
  }
  return { peerTokenId: BigInt(peer), deadline: BigInt(deadline), signature: sig }
}

export type ScannedCode =
  | { kind: 'badge'; tokenId: bigint }
  | { kind: 'connect'; code: ConnectCode }
  | { kind: 'unknown'; raw: string }

export function parseScannedCode(raw: string): ScannedCode {
  const text = raw.trim()
  if (/^\d+$/.test(text)) return { kind: 'badge', tokenId: BigInt(text) }
  try {
    const url = new URL(text)
    const badgeMatch = url.pathname.match(/^\/badge\/(\d+)\/?$/)
    if (badgeMatch) return { kind: 'badge', tokenId: BigInt(badgeMatch[1]) }
    if (url.pathname.replace(/\/$/, '') === '/connect') {
      const code = parseConnectParams(url.searchParams)
      if (code) return { kind: 'connect', code }
    }
  } catch {
    // Not a URL, fall through.
  }
  return { kind: 'unknown', raw: text }
}

/** Parses "12, 13 14\n15" style input into unique badge ids. */
export function parseTokenIdList(input: string): bigint[] {
  const ids = input
    .split(/[\s,;]+/)
    .map((part) => part.trim())
    .filter((part) => /^\d+$/.test(part) && part !== '0')
    .map((part) => BigInt(part))
  return [...new Map(ids.map((id) => [id.toString(), id])).values()]
}
