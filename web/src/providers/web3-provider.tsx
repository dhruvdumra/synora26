import '@rainbow-me/rainbowkit/styles.css'
import { darkTheme, lightTheme, RainbowKitProvider, type Theme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useMemo, type ReactNode } from 'react'
import { useWatchContractEvent, WagmiProvider } from 'wagmi'
import { badgeAbi } from '@/lib/badge-abi'
import { APP_NAME, badgeAddress, chain, isConfigured } from '@/lib/config'
import { wagmiConfig } from '@/lib/wagmi'
import { useTheme } from './theme-provider'

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 2_000 } },
})

const fonts = { body: '"Geist Variable", "Helvetica Neue", sans-serif' }

function walletTheme(mode: 'light' | 'dark'): Theme {
  const base =
    mode === 'dark'
      ? darkTheme({ accentColor: '#ecebe8', accentColorForeground: '#121211', borderRadius: 'small' })
      : lightTheme({ accentColor: '#151514', accentColorForeground: '#fbfbfa', borderRadius: 'small' })
  return { ...base, fonts }
}

/**
 * Any event from the badge contract means some on-chain state changed, so cached contract reads are
 * refreshed. Every open page (badge, admin, leaderboard) updates without a reload.
 */
function ContractEventSync() {
  const client = useQueryClient()
  useWatchContractEvent({
    address: badgeAddress,
    abi: badgeAbi,
    chainId: chain.id,
    enabled: isConfigured,
    onLogs: () => {
      void client.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'readContract' || query.queryKey[0] === 'readContracts',
      })
    },
  })
  return null
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const { resolved } = useTheme()
  const theme = useMemo(() => walletTheme(resolved), [resolved])

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme} appInfo={{ appName: APP_NAME }} initialChain={chain}>
          <ContractEventSync />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
