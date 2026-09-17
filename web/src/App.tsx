import { GearSixIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import { useEffect } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router'
import { Page, StatePanel } from '@/components/page'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { isConfigured } from '@/lib/config'
import { AdminPage } from '@/pages/admin'
import { ConnectPage } from '@/pages/connect'
import { HomePage } from '@/pages/home'
import { LeaderboardPage } from '@/pages/leaderboard'
import { MyBadgePage } from '@/pages/my-badge'
import { PerksPage } from '@/pages/perks'
import { PublicBadgePage } from '@/pages/public-badge'
import { ThemeProvider } from '@/providers/theme-provider'
import { Web3Provider } from '@/providers/web3-provider'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function NotFound() {
  return (
    <Page>
      <StatePanel
        icon={<MagnifyingGlassIcon weight="bold" />}
        title="Page not found"
        action={<Button asChild variant="outline"><Link to="/">Back home</Link></Button>}
      />
    </Page>
  )
}

function MissingConfig() {
  return (
    <Page>
      <StatePanel icon={<GearSixIcon weight="bold" />} title="Contract address missing">
        Set VITE_BADGE_ADDRESS in web/.env.local to the deployed badge contract, then restart the dev server.
      </StatePanel>
    </Page>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <Web3Provider>
        <TooltipProvider>
          <BrowserRouter>
            <ScrollToTop />
            <div aria-hidden="true" className="ambient" />
            <div className="flex min-h-dvh flex-col">
              <SiteHeader />
              <div className="flex-1">
                {isConfigured ? (
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/badge" element={<MyBadgePage />} />
                    <Route path="/badge/:tokenId" element={<PublicBadgePage />} />
                    <Route path="/connect" element={<ConnectPage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/perks" element={<PerksPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                ) : (
                  <MissingConfig />
                )}
              </div>
              <SiteFooter />
            </div>
            <Toaster position="bottom-right" />
          </BrowserRouter>
        </TooltipProvider>
      </Web3Provider>
    </ThemeProvider>
  )
}
