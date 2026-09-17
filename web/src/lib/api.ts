import { apiUrl } from './config'

/**
 * Client for the indexer API. Every call can fail (the indexer is optional infrastructure), so callers
 * fall back to reading the chain directly rather than showing an error.
 */

export interface ApiPass {
  tokenId: number
  holder: string
  sessions: number
  talks: number
  networking: number
  connections: number
  isSpeaker: boolean
  score: number
  tier: number
  mintedAt: number
}

export interface ApiPerk {
  id: string
  tier: number
  title: string
  open: boolean
  body: string | null
}

export interface ApiHealth {
  ok: boolean
  chainId: number
  contract: string
  cursor: string
  head: string
  blocksBehind: number
  backfilling: boolean
  error: string | null
}

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { ...init, headers: { accept: 'application/json', ...init?.headers } })
  if (!response.ok) {
    const detail = await response.json().catch(() => null)
    throw new Error((detail as { error?: string })?.error ?? `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

export const api = {
  health: () => get<ApiHealth>('/health'),
  leaderboard: (limit = 100) => get<{ passes: ApiPass[]; cursor: string }>(`/leaderboard?limit=${limit}`),
  stats: () => get<{ passes: number; check_ins: number; talks: number; connections: number }>('/stats'),
  activity: (limit = 20) =>
    get<{
      activity: { block: number; txHash: string; kind: string; tokenId: number | null; detail: string | null }[]
    }>(`/activity?limit=${limit}`),
  gateNonce: (address: string) => get<{ nonce: string; message: string }>(`/gate/nonce?address=${address}`),
  gateVerify: (body: { address: string; nonce: string; signature: string }) =>
    get<{ token: string; tier: number; tokenId: string; verifiedInMs: number; perks: ApiPerk[] }>('/gate/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  perks: (token: string) =>
    get<{ tier: number; perks: ApiPerk[] }>('/perks', { headers: { authorization: `Bearer ${token}` } }),
}

/** Subscribes to the indexer's live stream. Returns a cleanup function. */
export function subscribeToUpdates(onUpdate: (update: { block: string; passes: number[]; kinds: string[] }) => void) {
  if (typeof EventSource === 'undefined') return () => {}
  const source = new EventSource(`${apiUrl}/stream`)
  source.onmessage = (event) => {
    try {
      onUpdate(JSON.parse(event.data))
    } catch {
      // A malformed frame is not worth breaking the page over.
    }
  }
  return () => source.close()
}
