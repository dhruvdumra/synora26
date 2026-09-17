import { ConnectButton } from '@rainbow-me/rainbowkit'
import { WalletIcon, WarningIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { shortAddress } from '@/lib/format'

export function WalletButton({ size = 'default', label = 'Connect wallet' }: { size?: 'default' | 'lg'; label?: string }) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
        if (!mounted) {
          return <Button size={size} variant="outline" disabled aria-hidden className="opacity-0" />
        }
        if (!account || !chain) {
          return (
            <Button size={size} onClick={openConnectModal}>
              <WalletIcon weight="bold" data-icon="inline-start" />
              {label}
            </Button>
          )
        }
        if (chain.unsupported) {
          return (
            <Button size={size} variant="destructive" onClick={openChainModal}>
              <WarningIcon weight="bold" data-icon="inline-start" />
              Switch network
            </Button>
          )
        }
        return (
          <Button size={size} variant="outline" onClick={openAccountModal} className="font-mono text-[13px]">
            {shortAddress(account.address)}
          </Button>
        )
      }}
    </ConnectButton.Custom>
  )
}
