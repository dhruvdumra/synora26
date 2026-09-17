import { isAddress, type Address, type Chain } from 'viem'
import { foundry, sepolia } from 'viem/chains'

const env = import.meta.env

export const APP_NAME: string = env.VITE_APP_NAME || 'NCrypt Pass'
export const TEAM_NAME = 'NCrypt'
export const EVENT_NAME = 'Synora26'

export const networkName: 'local' | 'sepolia' = env.VITE_CHAIN === 'sepolia' ? 'sepolia' : 'local'
export const isLocalChain = networkName === 'local'

export const chain: Chain = isLocalChain ? foundry : sepolia

export const rpcUrl: string | undefined = isLocalChain
  ? 'http://127.0.0.1:8545'
  : env.VITE_SEPOLIA_RPC_URL || undefined

export const walletConnectProjectId: string = env.VITE_WALLETCONNECT_PROJECT_ID || ''

const rawAddress: string = env.VITE_BADGE_ADDRESS || ''
export const isConfigured = isAddress(rawAddress)
export const badgeAddress = rawAddress as Address

export const startBlock = BigInt(env.VITE_BADGE_START_BLOCK || 0)

export const apiUrl: string = (env.VITE_API_URL || '/api').replace(/\/$/, '')

/** Block explorer base URL, undefined on the local chain. */
export const explorerUrl: string | undefined = chain.blockExplorers?.default.url

export const explorerLink = {
  address: (address: string) => (explorerUrl ? `${explorerUrl}/address/${address}` : undefined),
  tx: (hash: string) => (explorerUrl ? `${explorerUrl}/tx/${hash}` : undefined),
  token: (tokenId: bigint | number) =>
    explorerUrl ? `${explorerUrl}/nft/${badgeAddress}/${tokenId.toString()}` : undefined,
}

/** Polling cadence for reads and event watching. Sepolia blocks land roughly every 12 seconds. */
export const pollingInterval = isLocalChain ? 1_000 : 4_000
