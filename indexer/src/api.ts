import compression from 'compression'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { allowedOrigins, badgeAddress, chain } from './config.ts'
import { statements } from './db.ts'
import { buildMessage, issueNonce, perksFor, readToken, verifyHolder } from './gate.ts'
import { state } from './sync.ts'
import { updates, type SyncUpdate } from './stream.ts'

interface PassRow {
  token_id: number
  holder: string
  sessions: number
  talks: number
  networking: number
  connections: number
  is_speaker: number
  score: number
  tier: number
  minted_at: number
}

function toPass(row: PassRow) {
  return {
    tokenId: row.token_id,
    holder: row.holder,
    sessions: row.sessions,
    talks: row.talks,
    networking: row.networking,
    connections: row.connections,
    isSpeaker: row.is_speaker === 1,
    score: row.score,
    tier: row.tier,
    mintedAt: row.minted_at,
  }
}

export function createApi() {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(helmet())
  app.use(compression())
  app.use(express.json({ limit: '8kb' }))
  app.use(cors({ origin: allowedOrigins.includes('*') ? true : allowedOrigins }))
  app.use(rateLimit({ windowMs: 60_000, limit: 240, standardHeaders: 'draft-7', legacyHeaders: false }))

  app.get('/api/health', (_request, response) => {
    const lag = state.head > state.cursor ? Number(state.head - state.cursor) : 0
    response.json({
      ok: state.error === null,
      chainId: chain.id,
      contract: badgeAddress,
      cursor: state.cursor.toString(),
      head: state.head.toString(),
      blocksBehind: lag,
      backfilling: state.backfilling,
      lastSyncedAt: state.lastSyncedAt,
      error: state.error,
    })
  })

  app.get('/api/leaderboard', (request, response) => {
    const limit = Math.min(Number(request.query.limit ?? 100) || 100, 500)
    const rows = statements.leaderboard.all(limit) as unknown as PassRow[]
    response.json({ passes: rows.map(toPass), cursor: state.cursor.toString() })
  })

  app.get('/api/pass/:tokenId', (request, response) => {
    const tokenId = Number(request.params.tokenId)
    if (!Number.isInteger(tokenId) || tokenId < 1) {
      response.status(400).json({ error: 'Pass numbers are positive integers.' })
      return
    }
    const row = statements.pass.get(tokenId) as unknown as PassRow | undefined
    if (!row) {
      response.status(404).json({ error: 'No pass with that number has been indexed yet.' })
      return
    }
    response.json(toPass(row))
  })

  app.get('/api/sessions', (_request, response) => {
    const rows = statements.sessions.all() as unknown as {
      id: number
      name: string
      active: number
      attendance: number
      created_at: number
    }[]
    response.json({
      sessions: rows.map((row) => ({
        id: row.id,
        name: row.name,
        active: row.active === 1,
        attendance: row.attendance,
        createdAt: row.created_at,
      })),
    })
  })

  app.get('/api/activity', (request, response) => {
    const limit = Math.min(Number(request.query.limit ?? 30) || 30, 100)
    const rows = statements.activity.all(limit) as unknown as {
      block: number
      tx_hash: string
      kind: string
      token_id: number | null
      session_id: number | null
      detail: string | null
    }[]
    response.json({
      activity: rows.map((row) => ({
        block: row.block,
        txHash: row.tx_hash,
        kind: row.kind,
        tokenId: row.token_id,
        sessionId: row.session_id,
        detail: row.detail,
      })),
    })
  })

  app.get('/api/stats', (_request, response) => {
    response.json(statements.stats.get())
  })

  // Perk gate: nonce, then signature, then an on-chain tier check before any perk body is released.
  app.get('/api/gate/nonce', (request, response) => {
    const address = String(request.query.address ?? '')
    const nonce = issueNonce()
    response.json({ nonce, message: buildMessage(address, nonce) })
  })

  app.post('/api/gate/verify', async (request, response) => {
    const { address, nonce, signature } = request.body ?? {}
    if (typeof address !== 'string' || typeof nonce !== 'string' || typeof signature !== 'string') {
      response.status(400).json({ error: 'Send address, nonce and signature.' })
      return
    }
    try {
      const result = await verifyHolder(address, nonce, signature)
      if (!result.ok) {
        response.status(401).json({ error: result.reason })
        return
      }
      response.json({
        token: result.token,
        tier: result.tier,
        tokenId: result.tokenId,
        verifiedInMs: result.verifiedInMs,
        perks: perksFor(result.tier ?? 0),
      })
    } catch (error) {
      console.error('[gate] verify failed', error)
      response.status(502).json({ error: 'Could not reach the chain to check your pass.' })
    }
  })

  app.get('/api/perks', (request, response) => {
    const header = request.get('authorization') ?? ''
    const session = header.startsWith('Bearer ') ? readToken(header.slice(7)) : null
    if (!session) {
      response.status(401).json({ error: 'Sign in with your wallet to open perks.' })
      return
    }
    response.json({ tier: session.tier, perks: perksFor(session.tier) })
  })

  // Live updates for open pages, so the leaderboard moves without polling.
  app.get('/api/stream', (request, response) => {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    response.write(`: connected at block ${state.cursor}\n\n`)

    const send = (update: SyncUpdate) => response.write(`data: ${JSON.stringify(update)}\n\n`)
    const heartbeat = setInterval(() => response.write(': ping\n\n'), 25_000)
    updates.on('update', send)

    request.on('close', () => {
      clearInterval(heartbeat)
      updates.off('update', send)
    })
  })

  app.use((_request, response) => {
    response.status(404).json({ error: 'No such endpoint.' })
  })

  return app
}
