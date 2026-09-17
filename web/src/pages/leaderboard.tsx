import { TrophyIcon } from '@phosphor-icons/react'
import { cn } from 'cn'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { useReadContracts } from 'wagmi'
import { Page, PageHeader, StatePanel } from '@/components/page'
import { TierTag } from '@/components/tier-tag'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyBadgeId, useTotalMinted } from '@/hooks/use-badge'
import { badgeAbi } from '@/lib/badge-abi'
import { badgeAddress, chain } from '@/lib/config'
import { badgeNumber, shortAddress } from '@/lib/format'

interface Row {
  tokenId: bigint
  holder: string
  score: number
  tier: number
  sessions: number
  talks: number
  networking: number
}

/** Reads every badge straight from the contract in one multicall. The indexer takes over at scale. */
function useLeaderboard() {
  const total = Number(useTotalMinted() ?? 0n)
  const query = useReadContracts({
    contracts: Array.from({ length: total }, (_, index) => ({
      address: badgeAddress,
      abi: badgeAbi,
      chainId: chain.id,
      functionName: 'getBadge' as const,
      args: [BigInt(index + 1)] as const,
    })),
    query: { enabled: total > 0 },
  })

  const rows = useMemo<Row[]>(() => {
    return (query.data ?? [])
      .flatMap((entry, index) => {
        if (entry.status !== 'success') return []
        const [traits, score, tier, holder] = entry.result
        return [{
          tokenId: BigInt(index + 1),
          holder,
          score: Number(score),
          tier,
          sessions: traits.sessionsAttended,
          talks: traits.talksGiven,
          networking: traits.networkingScore,
        }]
      })
      .sort((a, b) => b.score - a.score || Number(a.tokenId - b.tokenId))
  }, [query.data])

  return { rows, isLoading: query.isLoading && total > 0, total }
}

export function LeaderboardPage() {
  const { rows, isLoading, total } = useLeaderboard()
  const { tokenId: mine } = useMyBadgeId()

  return (
    <Page>
      <PageHeader
        title="Leaderboard"
        description={`${total} ${total === 1 ? 'pass' : 'passes'} issued. Rankings move the moment a check-in lands.`}
      />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-16" />)}
        </div>
      ) : rows.length === 0 ? (
        <StatePanel icon={<TrophyIcon weight="bold" />} title="No passes yet">
          The first pass issued takes the top spot.
        </StatePanel>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
          <table className="w-full text-sm">
            <caption className="sr-only">Passes ranked by score</caption>
            <thead>
              <tr className="border-b border-foreground/15 text-left text-[13px] text-muted-foreground">
                <th scope="col" className="w-14 py-3 pl-4 font-medium sm:pl-6">Rank</th>
                <th scope="col" className="py-3 font-medium">Pass</th>
                <th scope="col" className="hidden py-3 font-medium sm:table-cell">Tier</th>
                <th scope="col" className="hidden py-3 text-right font-medium md:table-cell">Sessions</th>
                <th scope="col" className="hidden py-3 text-right font-medium md:table-cell">Talks</th>
                <th scope="col" className="hidden py-3 text-right font-medium md:table-cell">Network</th>
                <th scope="col" className="py-3 pr-4 text-right font-medium sm:pr-6">Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const isMine = mine !== undefined && row.tokenId === mine
                return (
                  <tr key={row.tokenId.toString()} className={cn('border-b border-foreground/10 last:border-0', isMine && 'bg-signal/25')}>
                    <td className="py-4 pl-4 font-display text-3xl tabular sm:pl-6">{String(index + 1).padStart(2, '0')}</td>
                    <td className="py-4">
                      <Link to={`/badge/${row.tokenId}`} className="flex flex-col hover:underline">
                        <span className="font-mono">{badgeNumber(row.tokenId)}{isMine ? ' (you)' : ''}</span>
                        <span className="font-mono text-xs text-muted-foreground">{shortAddress(row.holder)}</span>
                      </Link>
                    </td>
                    <td className="hidden py-4 sm:table-cell"><TierTag tier={row.tier} /></td>
                    <td className="hidden py-4 text-right font-mono tabular md:table-cell">{row.sessions}</td>
                    <td className="hidden py-4 text-right font-mono tabular md:table-cell">{row.talks}</td>
                    <td className="hidden py-4 text-right font-mono tabular md:table-cell">{row.networking}</td>
                    <td className="py-4 pr-4 text-right font-display text-4xl tabular sm:pr-6">{String(row.score).padStart(2, '0')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  )
}
