import { isAddress, type Address } from 'viem'
import { foundry, sepolia } from 'viem/chains'

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) throw new Error(`Missing ${name}. Copy .env.example and fill it in.`)
  return value
}

const network = process.env.CHAIN === 'sepolia' ? 'sepolia' : 'local'

export const chain = network === 'sepolia' ? sepolia : foundry
export const rpcUrl = required('RPC_URL', network === 'local' ? 'http://127.0.0.1:8545' : undefined)

const address = required('BADGE_ADDRESS')
if (!isAddress(address)) throw new Error(`BADGE_ADDRESS is not an address: ${address}`)
export const badgeAddress = address as Address

export const startBlock = BigInt(process.env.BADGE_START_BLOCK ?? '0')
export const port = Number(process.env.PORT ?? 3001)
export const databasePath = process.env.DATABASE_PATH ?? './data/loyl.db'

/** How far back to re-scan on every poll, so a reorg near the head cannot strand an event. */
export const reorgDepth = BigInt(process.env.REORG_DEPTH ?? (network === 'local' ? '1' : '6'))
export const pollIntervalMs = Number(process.env.POLL_INTERVAL_MS ?? (network === 'local' ? 1000 : 4000))
/** Public RPCs cap eth_getLogs ranges; 500 blocks is safe on Alchemy's free tier. */
export const logChunkSize = BigInt(process.env.LOG_CHUNK_SIZE ?? '500')

export const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

/** Signs short-lived perk tokens. A random secret per boot is fine: tokens simply expire on restart. */
export const sessionSecret = process.env.SESSION_SECRET ?? crypto.randomUUID()
export const sessionTtlSeconds = Number(process.env.SESSION_TTL_SECONDS ?? 900)
export const gateDomain = process.env.GATE_DOMAIN ?? 'loyl.local'
