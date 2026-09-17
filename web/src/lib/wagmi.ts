import { connectorsForWallets, type Wallet, type WalletList } from '@rainbow-me/rainbowkit'
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { createConfig, createConnector, fallback, http, type Transport } from 'wagmi'
import { mock } from 'wagmi/connectors'
import type { Address } from 'viem'
import { APP_NAME, chain, isLocalChain, pollingInterval, rpcUrl, walletConnectProjectId } from './config'

/**
 * Anvil's default development accounts. Anvil signs for them itself, so the app can be driven end to end
 * on a local chain without a browser extension. Only offered when VITE_CHAIN=local.
 */
const LOCAL_ACCOUNTS: { label: string; address: Address }[] = [
  { label: 'Local staff (Anvil #0)', address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
  { label: 'Local attendee (Anvil #1)', address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
  { label: 'Local attendee (Anvil #2)', address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' },
]

const LOCAL_ICON =
  'data:image/svg+xml;base64,' +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><rect width="28" height="28" fill="#151514"/><circle cx="14" cy="14" r="7" fill="none" stroke="#fbfbfa" stroke-width="2.5"/></svg>',
  )

function localWallet(label: string, address: Address): () => Wallet {
  return () => ({
    id: `anvil-${address.toLowerCase()}`,
    name: label,
    iconUrl: LOCAL_ICON,
    iconBackground: '#151514',
    installed: true,
    createConnector: (walletDetails) =>
      createConnector((config) => ({
        ...mock({ accounts: [address], features: { reconnect: true } })(config),
        ...walletDetails,
      })),
  })
}

const wallets: WalletList = []
if (isLocalChain) {
  wallets.push({
    groupName: 'Local test accounts',
    wallets: LOCAL_ACCOUNTS.map(({ label, address }) => localWallet(label, address)),
  })
}
wallets.push({
  groupName: 'Wallets',
  wallets: walletConnectProjectId
    ? [metaMaskWallet, rainbowWallet, coinbaseWallet, walletConnectWallet]
    : [injectedWallet],
})

const connectors = connectorsForWallets(wallets, {
  appName: APP_NAME,
  // Only used by WalletConnect-based wallets, which are hidden when no project id is configured.
  projectId: walletConnectProjectId || 'unused-without-walletconnect',
})

const transport: Transport = rpcUrl ? fallback([http(rpcUrl), http()]) : http()

export const wagmiConfig = createConfig({
  chains: [chain],
  connectors,
  transports: { [chain.id]: transport },
  pollingInterval,
})
