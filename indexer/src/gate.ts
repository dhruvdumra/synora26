import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { isAddress, verifyMessage, type Address } from 'viem'
import { readTier, readTokenOf } from './chain.ts'
import { gateDomain, sessionSecret, sessionTtlSeconds } from './config.ts'

/**
 * Perks are delivered by the server, not the browser, so a locked perk never ships to a wallet that
 * has not earned it. The holder signs a nonce (free, no gas), the server verifies the signature and
 * then reads the tier from the chain before releasing anything.
 */

export interface Perk {
  id: string
  tier: number
  title: string
  body: string
}

const PERKS: Perk[] = [
  {
    id: 'session-resources',
    tier: 1,
    title: 'Session resources',
    body: 'Slides, recordings and code from every session are in the shared drive: loyl.example/resources (sample link, replace before the event).',
  },
  {
    id: 'sponsor-perks',
    tier: 2,
    title: 'Sponsor perks',
    body: 'Partner credits: use code LOYL-GOLD at checkout with the event sponsors (sample code, replace before the event).',
  },
  {
    id: 'speaker-room',
    tier: 3,
    title: 'Speaker room',
    body: 'Green room is behind the main stage. Speaker chat invite: loyl.example/speakers (sample link, replace before the event).',
  },
]

const nonces = new Map<string, number>()
const NONCE_TTL_MS = 5 * 60 * 1000

export function issueNonce(): string {
  const nonce = randomBytes(16).toString('hex')
  nonces.set(nonce, Date.now() + NONCE_TTL_MS)
  for (const [key, expiry] of nonces) if (expiry < Date.now()) nonces.delete(key)
  return nonce
}

export function buildMessage(address: string, nonce: string) {
  return [
    `${gateDomain} wants you to prove you hold a Loyl pass.`,
    '',
    `Wallet: ${address}`,
    `Nonce: ${nonce}`,
    '',
    'Signing is free and sends no transaction.',
  ].join('\n')
}

function sign(payload: string) {
  return createHmac('sha256', sessionSecret).update(payload).digest('base64url')
}

export function issueToken(address: string, tier: number) {
  const expires = Math.floor(Date.now() / 1000) + sessionTtlSeconds
  const payload = `${address.toLowerCase()}.${tier}.${expires}`
  return `${payload}.${sign(payload)}`
}

export function readToken(token: string): { address: string; tier: number } | null {
  const parts = token.split('.')
  if (parts.length !== 4) return null
  const [address, tier, expires, signature] = parts
  const expected = sign(`${address}.${tier}.${expires}`)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  if (Number(expires) * 1000 < Date.now()) return null
  return { address, tier: Number(tier) }
}

export interface VerifyResult {
  ok: boolean
  reason?: string
  token?: string
  tier?: number
  tokenId?: string
  verifiedInMs?: number
}

/** Verifies the signature, then re-reads the pass and tier from the chain before trusting anything. */
export async function verifyHolder(address: string, nonce: string, signature: string): Promise<VerifyResult> {
  const startedAt = performance.now()
  if (!isAddress(address)) return { ok: false, reason: 'That is not a wallet address.' }

  const expiry = nonces.get(nonce)
  if (!expiry || expiry < Date.now()) {
    return { ok: false, reason: 'That sign-in request expired. Try again.' }
  }
  nonces.delete(nonce)

  const valid = await verifyMessage({
    address: address as Address,
    message: buildMessage(address, nonce),
    signature: signature as `0x${string}`,
  })
  if (!valid) return { ok: false, reason: 'The signature does not match that wallet.' }

  const tokenId = await readTokenOf(address as Address)
  if (tokenId === 0n) return { ok: false, reason: 'That wallet does not hold a pass yet.' }
  const tier = await readTier(tokenId)

  return {
    ok: true,
    token: issueToken(address, tier),
    tier,
    tokenId: tokenId.toString(),
    verifiedInMs: Math.round(performance.now() - startedAt),
  }
}

/** Perks the tier opens, with bodies attached. Speaker opens everything. */
export function perksFor(tier: number) {
  return PERKS.map((perk) => {
    const open = tier === 3 || tier >= perk.tier
    return { id: perk.id, tier: perk.tier, title: perk.title, open, body: open ? perk.body : null }
  })
}

export const perkCount = PERKS.length
