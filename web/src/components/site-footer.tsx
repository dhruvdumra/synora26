import { ArrowUpRightIcon } from '@phosphor-icons/react'
import { badgeAddress, chain, EVENT_NAME, explorerLink, isConfigured, TEAM_NAME } from '@/lib/config'
import { shortAddress } from '@/lib/format'

export function SiteFooter() {
  const contractLink = isConfigured ? explorerLink.address(badgeAddress) : undefined

  return (
    <footer className="relative z-10 border-t border-border/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Built by {TEAM_NAME} for {EVENT_NAME}
        </p>
        {isConfigured && (
          <p className="flex items-center gap-2">
            <span>{chain.name}</span>
            {contractLink ? (
              <a
                href={contractLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[13px] text-foreground underline-offset-4 hover:underline"
              >
                {shortAddress(badgeAddress)}
                <ArrowUpRightIcon weight="bold" className="size-3.5" />
              </a>
            ) : (
              <span className="font-mono text-[13px]">{shortAddress(badgeAddress)}</span>
            )}
          </p>
        )}
      </div>
    </footer>
  )
}
