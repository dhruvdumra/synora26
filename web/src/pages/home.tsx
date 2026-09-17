import { ArrowRightIcon } from '@phosphor-icons/react'
import { Link } from 'react-router'
import { BadgeArt } from '@/components/badge-art'
import { Reveal } from '@/components/reveal'
import { Button } from '@/components/ui/button'
import { useDemoPass } from '@/hooks/use-demo-pass'
import { formatNumber } from '@/lib/format'
import { TIERS } from '@/lib/tiers'

/** Gas figures measured by the contract test suite (test_CheckInBatch_UsesLessGasThanIndividualCheckIns). */
const GAS_ONE_BY_ONE = 2_639_893
const GAS_BATCH = 716_761

export function HomePage() {
  const demo = useDemoPass(true)

  return (
    <main className="relative z-10">
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-8 md:min-h-[min(calc(100dvh-4rem),820px)] md:grid-cols-[1.15fr_1fr] md:gap-10">
          <Reveal className="order-2 flex flex-col justify-center gap-5 pb-8 md:order-1 md:gap-8 md:py-20">
            <h1 className="font-display text-[clamp(3.75rem,8vw,7rem)] uppercase">
              <span className="block whitespace-nowrap">Show up.</span>
              <span className="block whitespace-nowrap">Level up.</span>
            </h1>
            <p className="max-w-[38ch] text-lg leading-snug text-muted-foreground sm:text-xl">
              Loyl is an event pass that lives on-chain. Check in, give a talk, meet people, and watch it re-issue at a higher tier.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" variant="signal" asChild>
                <Link to="/badge">
                  Get your pass
                  <ArrowRightIcon weight="bold" data-icon="inline-end" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/leaderboard">Leaderboard</Link>
              </Button>
            </div>
          </Reveal>

          <div className="relative order-1 flex flex-col items-center justify-center gap-3 pt-6 pb-4 md:order-2 md:gap-4 md:pt-24 md:pb-0">
            <BadgeArt
              image={demo.image}
              pulse={demo.tier}
              alt={`Demo Loyl pass at ${demo.tierName}, drawn by the contract`}
              strap="header"
              swing
              className="max-w-[164px] sm:max-w-[280px] lg:max-w-[360px]"
            />
            <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-signal" />
              Demo pass, drawn live by the contract
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="levels-heading" className="border-t border-foreground/10 bg-card">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8 md:py-28">
          <Reveal className="mb-12 flex flex-col gap-4 md:mb-16">
            <h2 id="levels-heading" className="font-display text-[clamp(3rem,7vw,5.5rem)] uppercase">
              Four access levels
            </h2>
            <p className="max-w-[52ch] text-lg text-muted-foreground">
              A session is worth 1 point, a talk 3, and every new person you connect with adds 1. The band on your pass changes the moment you cross a line.
            </p>
          </Reveal>

          <ol className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-6">
            {TIERS.map((tier, index) => (
              <li key={tier.id}>
                <Reveal delay={index * 0.07} className="flex flex-col gap-4">
                  <div className="overflow-hidden rounded-xl bg-pass text-pass-ink ring-1 ring-foreground/10">
                    <div className="relative flex items-center justify-between px-4 pt-7 pb-6 font-mono text-[11px] text-pass-ink/60">
                      <span aria-hidden="true" className="absolute top-2.5 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-pass-ink/25" />
                      <span>ACCESS LEVEL</span>
                      <span>LV {tier.id}</span>
                    </div>
                    <div className="px-4 py-4 text-band-ink" style={{ backgroundColor: tier.swatch }}>
                      <span className="font-display block text-[clamp(2rem,4vw,3rem)] uppercase">{tier.name}</span>
                    </div>
                    <div className="px-4 pt-5 pb-4">
                      <span className="block font-mono text-4xl tabular">
                        {tier.threshold === null ? 'TALK' : String(tier.threshold).padStart(2, '0')}
                      </span>
                      <span className="text-sm text-pass-ink/60">{tier.threshold === null ? 'recorded by staff' : 'points to enter'}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{tier.summary}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="door-heading" className="bg-pass text-pass-ink">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-8 md:grid-cols-[1fr_1.2fr] md:items-end md:py-28">
          <Reveal className="flex flex-col gap-4">
            <h2 id="door-heading" className="font-display text-[clamp(3rem,7vw,5.5rem)] uppercase">
              A whole room, one transaction
            </h2>
            <p className="max-w-[44ch] text-lg text-pass-ink/70">
              Staff scan passes at the door and submit the queue as a single batch. Anyone already checked in is skipped, never failed.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <figure className="flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-pass-ink/70">50 check-ins, one at a time</span>
                  <span className="shrink-0 font-mono text-base whitespace-nowrap tabular sm:text-lg">{formatNumber(GAS_ONE_BY_ONE)} gas</span>
                </div>
                <div className="h-4 w-full rounded-sm bg-pass-ink/25" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-4">
                  <span>The same 50, one batch</span>
                  <span className="shrink-0 font-mono text-base whitespace-nowrap tabular sm:text-lg">{formatNumber(GAS_BATCH)} gas</span>
                </div>
                <div className="h-4 rounded-sm bg-signal" style={{ width: `${(GAS_BATCH / GAS_ONE_BY_ONE) * 100}%` }} />
              </div>
              <figcaption className="text-sm text-pass-ink/60">
                Measured in the contract test suite. The batch uses 73% less gas.
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="earned-heading" className="mx-auto max-w-7xl px-4 py-20 sm:px-8 md:py-28">
        <Reveal className="mb-12 md:mb-16">
          <h2 id="earned-heading" className="font-display text-[clamp(3rem,7vw,5.5rem)] uppercase">
            Earned, not bought
          </h2>
        </Reveal>
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {[
            {
              title: 'Locked to you',
              body: 'Passes are soulbound. They cannot be sold or transferred, so a Gold perk only reaches someone who showed up.',
              standard: 'ERC-5192',
            },
            {
              title: 'Drawn by the contract',
              body: 'The pass image and its metadata are generated on-chain from live state. No image host, no IPFS pin to go stale.',
              standard: 'ERC-4906',
            },
            {
              title: 'Signed introductions',
              body: 'Meeting someone means scanning their code. Their wallet signature proves it, and each pair only counts once.',
              standard: 'EIP-712',
            },
          ].map((item, index) => (
            <Reveal key={item.title} delay={index * 0.07} className="flex flex-col gap-3 border-t-2 border-foreground pt-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-3xl uppercase">{item.title}</h3>
                <span className="shrink-0 font-mono text-xs whitespace-nowrap text-muted-foreground">{item.standard}</span>
              </div>
              <p className="text-muted-foreground">{item.body}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-16 flex flex-wrap items-center gap-4 border-t border-foreground/15 pt-10">
          <Button size="lg" variant="signal" asChild>
            <Link to="/badge">
              Get your pass
              <ArrowRightIcon weight="bold" data-icon="inline-end" />
            </Link>
          </Button>
          <p className="text-muted-foreground">Free to mint on Sepolia. No gas? Staff can mint it for you.</p>
        </Reveal>
      </section>
    </main>
  )
}
