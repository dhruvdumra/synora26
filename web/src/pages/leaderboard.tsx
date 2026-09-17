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
        description={`${total} ${total === 1 ? 'badge' : 'badges'} minted. Rankings update as check-ins land.`}
      />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-16" />)}
        </div>
      ) : rows.length === 0 ? (
        <StatePanel icon={<TrophyIcon weight="bold" />} title="No badges yet">
          The first badge minted takes the top spot.
        </StatePanel>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <caption className="sr-only">Badges ranked by score</caption>
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th scope="col" className="w-14 py-3 pl-4 font-normal sm:pl-6">Rank</th>
                <th scope="col" className="py-3 font-normal">Badge</th>
                <th scope="col" className="hidden py-3 font-normal sm:table-cell">Tier</th>
                <th scope="col" className="hidden py-3 text-right font-normal md:table-cell">Sessions</th>
                <th scope="col" className="hidden py-3 text-right font-normal md:table-cell">Talks</th>
                <th scope="col" className="hidden py-3 text-right font-normal md:table-cell">Network</th>
                <th scope="col" className="py-3 pr-4 text-right font-normal sm:pr-6">Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const isMine = mine !== undefined && row.tokenId === mine
                return (
                  <tr key={row.tokenId.toString()} className={cn('border-b last:border-0', isMine && 'bg-muted/60')}>
                    <td className="py-3.5 pl-4 font-mono text-muted-foreground tabular sm:pl-6">{index + 1}</td>
                    <td className="py-3.5">
                      <Link to={`/badge/${row.tokenId}`} className="flex flex-col hover:underline hover:underline-offset-4">
                        <span className="font-mono">{badgeNumber(row.tokenId)}{isMine ? ' (you)' : ''}</span>
                        <span className="font-mono text-xs text-muted-foreground">{shortAddress(row.holder)}</span>
                      </Link>
                    </td>
                    <td className="hidden py-3.5 sm:table-cell"><TierTag tier={row.tier} /></td>
                    <td className="hidden py-3.5 text-right font-mono tabular md:table-cell">{row.sessions}</td>
                    <td className="hidden py-3.5 text-right font-mono tabular md:table-cell">{row.talks}</td>
                    <td className="hidden py-3.5 text-right font-mono tabular md:table-cell">{row.networking}</td>
                    <td className="py-3.5 pr-4 text-right font-display text-xl tabular sm:pr-6">{row.score}</td>
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
