import { TrophyIcon } from '@phosphor-icons/react'
import { cn } from 'cn'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { useReadContracts } from 'wagmi'
import { Page, PageHeader, StatePanel } from '@/components/page'
import { TierTag } from '@/components/tier-tag'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyBadgeId, useTotalMinted } from '@/hooks/use-badge'
import { useEventStats, useIndexedLeaderboard } from '@/hooks/use-indexer'
import { badgeAbi } from '@/lib/badge-abi'
import { badgeAddress, chain } from '@/lib/config'
import { badgeNumber, formatNumber, shortAddress } from '@/lib/format'

interface Row {
  tokenId: bigint
  holder: string
  score: number
  tier: number
  sessions: number
  talks: number
  networking: number
}

/** Fallback path: read every pass straight from the contract when the indexer is unreachable. */
function useChainLeaderboard(enabled: boolean) {
  const total = Number(useTotalMinted() ?? 0n)
  const query = useReadContracts({
    contracts: Array.from({ length: total }, (_, index) => ({
      address: badgeAddress,
      abi: badgeAbi,
      chainId: chain.id,
      functionName: 'getBadge' as const,
      args: [BigInt(index + 1)] as const,
    })),
    query: { enabled: enabled && total > 0 },
  })

  return useMemo<Row[]>(() => {
    return (query.data ?? [])
      .flatMap((entry, index) => {
        if (entry.status !== 'success') return []
        const [traits, score, tier, holder] = entry.result
        return [
          {
            tokenId: BigInt(index + 1),
            holder,
            score: Number(score),
            tier,
            sessions: traits.sessionsAttended,
            talks: traits.talksGiven,
            networking: traits.networkingScore,
          },
        ]
      })
      .sort((a, b) => b.score - a.score || Number(a.tokenId - b.tokenId))
  }, [query.data])
}

export function LeaderboardPage() {
  const { passes, isLoading, isUnavailable } = useIndexedLeaderboard()
  const chainRows = useChainLeaderboard(isUnavailable)
  const stats = useEventStats()
  const { tokenId: mine } = useMyBadgeId()

  const rows: Row[] = passes
    ? passes.map((pass) => ({
        tokenId: BigInt(pass.tokenId),
        holder: pass.holder,
        score: pass.score,
        tier: pass.tier,
        sessions: pass.sessions,
        talks: pass.talks,
        networking: pass.networking,
      }))
    : chainRows

  const count = (value: number, singular: string, plural: string) =>
    `${formatNumber(value)} ${value === 1 ? singular : plural}`
  const summary = stats.data
    ? `${count(stats.data.passes, 'pass', 'passes')}, ${count(stats.data.check_ins, 'check-in', 'check-ins')} and ${count(stats.data.talks, 'talk', 'talks')} so far.`
    : 'Rankings move the moment a check-in lands.'

  return (
    <Page>
      <PageHeader title="Leaderboard" description={summary} />

      {isLoading && rows.length === 0 ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <StatePanel icon={<TrophyIcon weight="bold" />} title="No passes yet">
          The first pass issued takes the top spot.
        </StatePanel>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
            <table className="w-full text-sm">
              <caption className="sr-only">Passes ranked by score</caption>
              <thead>
                <tr className="border-b border-foreground/15 text-left text-[13px] text-muted-foreground">
                  <th scope="col" className="w-14 py-3 pl-4 font-medium sm:pl-6">
                    Rank
                  </th>
                  <th scope="col" className="py-3 font-medium">
                    Pass
                  </th>
                  <th scope="col" className="hidden py-3 font-medium sm:table-cell">
                    Tier
                  </th>
                  <th scope="col" className="hidden py-3 text-right font-medium md:table-cell">
                    Sessions
                  </th>
                  <th scope="col" className="hidden py-3 text-right font-medium md:table-cell">
                    Talks
                  </th>
                  <th scope="col" className="hidden py-3 text-right font-medium md:table-cell">
                    Network
                  </th>
                  <th scope="col" className="py-3 pr-4 text-right font-medium sm:pr-6">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const isMine = mine !== undefined && row.tokenId === mine
                  return (
                    <tr
                      key={row.tokenId.toString()}
                      className={cn('border-b border-foreground/10 last:border-0', isMine && 'bg-signal/25')}
                    >
                      <td className="py-4 pl-4 font-display text-3xl tabular sm:pl-6">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="py-4">
                        <Link to={`/badge/${row.tokenId}`} className="flex flex-col hover:underline">
                          <span className="font-mono">
                            {badgeNumber(row.tokenId)}
                            {isMine ? ' (you)' : ''}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">{shortAddress(row.holder)}</span>
                        </Link>
                      </td>
                      <td className="hidden py-4 sm:table-cell">
                        <TierTag tier={row.tier} />
                      </td>
                      <td className="hidden py-4 text-right font-mono tabular md:table-cell">{row.sessions}</td>
                      <td className="hidden py-4 text-right font-mono tabular md:table-cell">{row.talks}</td>
                      <td className="hidden py-4 text-right font-mono tabular md:table-cell">{row.networking}</td>
                      <td className="py-4 pr-4 text-right font-display text-4xl tabular sm:pr-6">
                        {String(row.score).padStart(2, '0')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            {isUnavailable ? (
              'Read straight from the contract. The indexer is offline, so this page is slower than usual.'
            ) : (
              <>
                <span aria-hidden="true" className="size-1.5 rounded-full bg-signal" />
                Served from the indexer cache and updated live as events land.
              </>
            )}
          </p>
        </>
      )}
    </Page>
  )
}
