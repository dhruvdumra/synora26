import { createApi } from './api.ts'
import { badgeAddress, chain, databasePath, port } from './config.ts'
import { runSync } from './sync.ts'

const app = createApi()

const server = app.listen(port, '0.0.0.0', () => {
  console.info(
    JSON.stringify({
      msg: 'indexer listening',
      port,
      chainId: chain.id,
      contract: badgeAddress,
      database: databasePath,
    }),
  )
})

void runSync()

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    console.info(JSON.stringify({ msg: 'shutting down', signal }))
    server.close(() => process.exit(0))
  })
}
