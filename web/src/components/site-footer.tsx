import { ArrowUpRightIcon } from '@phosphor-icons/react'
import { Wordmark } from '@/components/brand-mark'
import { badgeAddress, EVENT_NAME, explorerLink, isConfigured, isLocalChain, TEAM_NAME } from '@/lib/config'
import { shortAddress } from '@/lib/format'

export function SiteFooter() {
  const contractLink = isConfigured ? explorerLink.address(badgeAddress) : undefined

  return (
    <footer className="relative z-10 border-t border-foreground/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-col gap-1.5">
          <Wordmark />
          <p className="text-sm text-muted-foreground">
            Built by {TEAM_NAME} for {EVENT_NAME}
          </p>
        </div>
        {isConfigured && (
          <div className="flex flex-col gap-1 sm:items-end">
            <span className="text-sm text-muted-foreground">Pass contract on {isLocalChain ? 'a local test chain' : 'Sepolia'}</span>
            {contractLink ? (
              <a
                href={contractLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-sm hover:underline"
              >
                {shortAddress(badgeAddress)}
                <ArrowUpRightIcon weight="bold" className="size-3.5" />
              </a>
            ) : (
              <span className="font-mono text-sm">{shortAddress(badgeAddress)}</span>
            )}
          </div>
        )}
      </div>
    </footer>
  )
}
