import { ArrowUpRightIcon, CheckIcon, SpinnerIcon, XIcon } from '@phosphor-icons/react'
import type { ActionRecord } from '@/hooks/use-contract-action'
import { explorerLink } from '@/lib/config'
import { formatNumber } from '@/lib/format'

function StatusIcon({ status }: { status: ActionRecord['status'] }) {
  if (status === 'confirmed') return <CheckIcon weight="bold" className="size-3.5 text-success" aria-label="Confirmed" />
  if (status === 'failed') return <XIcon weight="bold" className="size-3.5 text-destructive" aria-label="Failed" />
  return <SpinnerIcon weight="bold" className="size-3.5 animate-spin text-muted-foreground" aria-label="Pending" />
}

/** Transactions sent from this console during the current visit, newest first. */
export function ActivityLog({ records }: { records: ActionRecord[] }) {
  return (
    <section aria-labelledby="log-heading" className="flex flex-col gap-4">
      <h2 id="log-heading" className="font-display text-3xl uppercase">
        This session's transactions
      </h2>
      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground">Transactions you send will appear here with their block and gas used.</p>
      ) : (
        <ol className="flex flex-col divide-y divide-foreground/10 rounded-xl bg-card ring-1 ring-foreground/10">
          {records.map((record) => {
            const link = record.hash ? explorerLink.tx(record.hash) : undefined
            return (
              <li key={record.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                <span className="mt-1">
                  <StatusIcon status={record.status} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate">{record.label}</span>
                  {record.status === 'failed' && <span className="text-xs text-destructive">{record.error}</span>}
                  {record.status === 'confirmed' && (
                    <span className="font-mono text-xs text-muted-foreground tabular">
                      block {record.blockNumber?.toString()}, {formatNumber(record.gasUsed ?? 0n)} gas,{' '}
                      {((record.confirmedMs ?? 0) / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="View transaction on explorer"
                  >
                    <ArrowUpRightIcon weight="bold" className="size-4" />
                  </a>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
