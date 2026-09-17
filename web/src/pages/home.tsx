import { ArrowRightIcon, CubeIcon, HandshakeIcon, LockKeyIcon, UsersThreeIcon } from '@phosphor-icons/react'
import { Link } from 'react-router'
import { BadgeArt } from '@/components/badge-art'
import { Reveal } from '@/components/reveal'
import { TierTag } from '@/components/tier-tag'
import { Button } from '@/components/ui/button'
import { useBadge, useMyBadgeId, useTotalMinted } from '@/hooks/use-badge'
import { TIERS } from '@/lib/tiers'

function useFeaturedBadge() {
  const { tokenId } = useMyBadgeId()
  const total = useTotalMinted() ?? 0n
  const featured = tokenId ?? (total >= 2n ? 2n : total > 0n ? 1n : undefined)
  return useBadge(featured)
}

export function HomePage() {
  const { badge } = useFeaturedBadge()

  return (
    <main className="relative z-10">
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-20 md:pb-28 lg:gap-20">
        <Reveal className="flex flex-col gap-7">
          <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            An event badge that levels up as you show up.
          </h1>
          <p className="max-w-[46ch] text-lg text-muted-foreground">
            Check in to sessions, give talks and meet people. Your badge updates live on-chain and unlocks perks.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/badge">
                Get your badge
                <ArrowRightIcon weight="bold" data-icon="inline-end" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/leaderboard">See the leaderboard</Link>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto w-full max-w-[420px]">
          <BadgeArt image={badge?.image ?? null} tier={badge?.tier ?? 0} alt="A live badge rendered by the contract" />
        </Reveal>
      </section>

      <section aria-labelledby="tiers-heading" className="border-y bg-card/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
          <Reveal className="mb-12 flex max-w-2xl flex-col gap-3">
            <h2 id="tiers-heading" className="font-display text-4xl leading-[1.1]">
              Four tiers, one simple score
            </h2>
            <p className="text-muted-foreground">
              A session is worth 1 point, a talk 3, and every new connection or staff award adds more.
            </p>
          </Reveal>

          <ol className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((tier, index) => (
              <li key={tier.id} className="bg-background">
                <Reveal delay={index * 0.08} className="flex h-full flex-col gap-4 p-6">
                  <div className="flex items-center justify-between">
                    <TierTag tier={tier.id} />
                    <span className="font-mono text-xs text-muted-foreground">
                      {tier.threshold === null ? 'Staff granted' : `${tier.threshold}+ points`}
                    </span>
                  </div>
                  <span aria-hidden="true" className="h-1 w-12 rounded-full" style={{ backgroundColor: tier.swatch }} />
                  <p className="text-sm text-muted-foreground">{tier.summary}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="built-heading" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <Reveal className="mb-12 max-w-2xl">
          <h2 id="built-heading" className="font-display text-4xl leading-[1.1]">
            Built for a busy event floor
          </h2>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-5">
          <Reveal className="md:col-span-3">
            <article className="flex h-full flex-col justify-between gap-10 rounded-xl border bg-card p-7 sm:p-9">
              <div className="flex flex-col gap-3">
                <UsersThreeIcon weight="bold" className="size-5" />
                <h3 className="text-xl font-medium">Check in a whole room in one transaction</h3>
                <p className="max-w-[48ch] text-muted-foreground">
                  Staff scan badges at the door, then submit the queue as a single batch. Duplicates are skipped instead of failing the batch.
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-6 border-t pt-6">
                <div>
                  <dt className="text-xs text-muted-foreground">50 check-ins, one by one</dt>
                  <dd className="font-mono text-2xl tabular">2,639,893 gas</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Same 50, one batch</dt>
                  <dd className="font-mono text-2xl tabular">716,761 gas</dd>
                </div>
              </dl>
            </article>
          </Reveal>

          <Reveal delay={0.08} className="md:col-span-2">
            <article className="flex h-full flex-col gap-3 rounded-xl border bg-gold-soft p-7 sm:p-9">
              <CubeIcon weight="bold" className="size-5 text-gold-ink" />
              <h3 className="text-xl font-medium">Art drawn by the contract</h3>
              <p className="text-muted-foreground">
                The badge image and metadata are generated on-chain from its traits. No image host, no IPFS pin.
              </p>
            </article>
          </Reveal>

          <Reveal delay={0.04} className="md:col-span-2">
            <article className="flex h-full flex-col gap-3 rounded-xl border bg-speaker-soft p-7 sm:p-9">
              <HandshakeIcon weight="bold" className="size-5 text-speaker-ink" />
              <h3 className="text-xl font-medium">Signed introductions</h3>
              <p className="text-muted-foreground">
                Scan another attendee's code. Their wallet signature proves the meeting happened, and you both earn a point.
              </p>
            </article>
          </Reveal>

          <Reveal delay={0.12} className="md:col-span-3">
            <article className="flex h-full flex-col gap-3 rounded-xl border bg-card p-7 sm:p-9">
              <LockKeyIcon weight="bold" className="size-5" />
              <h3 className="text-xl font-medium">Earned, not bought</h3>
              <p className="max-w-[52ch] text-muted-foreground">
                Badges are soulbound. They cannot be sold or transferred, so a Gold perk only reaches someone who attended the sessions.
              </p>
            </article>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
