import { ListIcon, XIcon } from '@phosphor-icons/react'
import { cn } from 'cn'
import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import { BrandMark } from '@/components/brand-mark'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/wallet-button'
import { useRoles } from '@/hooks/use-roles'
import { APP_NAME } from '@/lib/config'

const links = [
  { to: '/badge', label: 'My badge' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/perks', label: 'Perks' },
]

function NavItems({ onNavigate, vertical }: { onNavigate?: () => void; vertical?: boolean }) {
  const { isStaff } = useRoles()
  const items = isStaff ? [...links, { to: '/admin', label: 'Staff' }] : links
  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'rounded-md text-sm transition-colors hover:text-foreground',
              vertical ? 'px-2 py-3 text-base' : 'px-3 py-2',
              isActive ? 'text-foreground' : 'text-muted-foreground',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </>
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 font-medium tracking-tight" onClick={() => setOpen(false)}>
          <BrandMark />
          <span>{APP_NAME}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <NavItems />
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden sm:block">
            <WalletButton />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <XIcon weight="bold" /> : <ListIcon weight="bold" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav aria-label="Main" className="border-t border-border/70 px-4 pb-4 md:hidden">
          <div className="flex flex-col divide-y divide-border/70">
            <NavItems vertical onNavigate={() => setOpen(false)} />
          </div>
          <div className="pt-3 sm:hidden">
            <WalletButton />
          </div>
        </nav>
      )}
    </header>
  )
}
