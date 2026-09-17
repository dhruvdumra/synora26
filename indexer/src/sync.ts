import { parseEventLogs } from 'viem'
import { badgeAbi } from './badge-abi.ts'
import { badgeAddress, logChunkSize, pollIntervalMs, reorgDepth, startBlock } from './config.ts'
import { client, readPasses, readSessions } from './chain.ts'
import { db, getCursor, setCursor, statements } from './db.ts'
import { updates } from './stream.ts'

type Log = ReturnType<typeof parseEventLogs<typeof badgeAbi>>[number]

export const state = {
  cursor: getCursor(),
  head: 0n,
  lastSyncedAt: 0,
  backfilling: true,
  error: null as string | null,
}

function describe(log: Log): { kind: string; tokenId?: bigint; sessionId?: bigint; detail?: string } {
  switch (log.eventName) {
    case 'BadgeMinted':
      return { kind: 'minted', tokenId: log.args.tokenId, detail: log.args.owner }
    case 'CheckedIn':
      return {
        kind: 'checked-in',
        tokenId: log.args.tokenId,
        sessionId: log.args.sessionId,
        detail: `${log.args.sessionsAttended} sessions`,
      }
    case 'BatchCheckIn':
      return {
        kind: 'batch-check-in',
        sessionId: log.args.sessionId,
        detail: `${log.args.processed} in, ${log.args.skipped} skipped`,
      }
    case 'SpeakerMarked':
      return { kind: 'talk', tokenId: log.args.tokenId, detail: `${log.args.talksGiven} talks` }
    case 'NetworkingLogged':
      return { kind: 'networking', tokenId: log.args.tokenId, detail: `+${log.args.pointsAdded}` }
    case 'Connected':
      return { kind: 'connected', tokenId: log.args.tokenId, detail: `with #${log.args.peerTokenId}` }
    case 'TierChanged':
      return { kind: 'tier-changed', tokenId: log.args.tokenId, detail: String(log.args.newTier) }
    case 'SessionCreated':
      return { kind: 'session-created', sessionId: log.args.sessionId, detail: log.args.name }
    case 'SessionStatusChanged':
      return { kind: 'session-status', sessionId: log.args.sessionId, detail: String(log.args.active) }
    default:
      // Transfer, Locked, MetadataUpdate and role events carry nothing the activity feed needs.
      return { kind: 'ignored' }
  }
}

/** Applies one batch of logs: records activity, then re-reads the affected passes and sessions. */
async function apply(logs: Log[]) {
  const tokenIds = new Set<string>()
  const sessionIds = new Set<string>()
  const kinds = new Set<string>()
  let highestBlock = 0n

  type ActivityRow = [number, number, string, string, number | null, number | null, string | null]
  const rows: ActivityRow[] = []
  for (const log of logs) {
    const { kind, tokenId, sessionId, detail } = describe(log)
    if (log.blockNumber > highestBlock) highestBlock = log.blockNumber
    if (kind === 'ignored') continue
    kinds.add(kind)
    if (tokenId !== undefined) tokenIds.add(tokenId.toString())
    if (sessionId !== undefined) sessionIds.add(sessionId.toString())
    if (log.eventName === 'Connected') tokenIds.add(log.args.peerTokenId.toString())
    rows.push([
      Number(log.blockNumber),
      log.logIndex,
      log.transactionHash,
      kind,
      tokenId === undefined ? null : Number(tokenId),
      sessionId === undefined ? null : Number(sessionId),
      detail ?? null,
    ])
  }

  const passes = await readPasses([...tokenIds].map(BigInt))
  const sessions = await readSessions([...sessionIds].map(BigInt))

  db.exec('BEGIN')
  try {
    for (const row of rows) statements.insertActivity.run(...row)
    for (const pass of passes) {
      statements.upsertPass.run(
        Number(pass.tokenId),
        pass.holder,
        pass.sessions,
        pass.talks,
        pass.networking,
        pass.connections,
        pass.isSpeaker ? 1 : 0,
        pass.score,
        pass.tier,
        pass.mintedAt,
        Number(highestBlock),
      )
    }
    for (const session of sessions) {
      statements.upsertSession.run(
        Number(session.id),
        session.name,
        session.active ? 1 : 0,
        session.attendance,
        Number(session.createdAt),
      )
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  if (passes.length > 0 || sessions.length > 0) {
    updates.emit('update', {
      block: highestBlock.toString(),
      passes: passes.map((pass) => Number(pass.tokenId)),
      kinds: [...kinds],
    })
  }
}

/** Providers cap how many blocks one eth_getLogs may span; Alchemy's free tier allows 10. */
const MIN_CHUNK = 10n
let chunk = logChunkSize

async function scan(from: bigint, to: bigint) {
  for (let start = from; start <= to; ) {
    const end = start + chunk - 1n > to ? to : start + chunk - 1n
    let logs
    try {
      logs = await client.getLogs({ address: badgeAddress, fromBlock: start, toBlock: end })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (/block range|range is too large|limited to/i.test(message) && chunk > MIN_CHUNK) {
        chunk = chunk / 4n > MIN_CHUNK ? chunk / 4n : MIN_CHUNK
        console.warn(JSON.stringify({ msg: 'log range rejected, retrying smaller', chunk: chunk.toString() }))
        continue
      }
      throw error
    }

    const parsed = parseEventLogs({ abi: badgeAbi, logs })
    if (parsed.length > 0) await apply(parsed)
    state.cursor = end
    setCursor(end)
    start = end + 1n
  }
}

/** Backfills from the deployment block, then polls the head forever. Resumable across restarts. */
export async function runSync() {
  for (;;) {
    try {
      state.head = await client.getBlockNumber()
      const from = state.cursor + 1n > startBlock ? state.cursor + 1n : startBlock
      if (from <= state.head) {
        // Re-scan a few blocks behind the head so a short reorg cannot leave a gap.
        const safeFrom = state.backfilling || from < reorgDepth ? from : from - reorgDepth
        await scan(safeFrom, state.head)
      }
      state.backfilling = false
      state.lastSyncedAt = Date.now()
      state.error = null
    } catch (error) {
      state.error = error instanceof Error ? error.message : String(error)
      console.error('[sync] failed, retrying', state.error)
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  }
}
