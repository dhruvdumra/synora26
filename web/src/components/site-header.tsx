import { ListIcon, XIcon } from '@phosphor-icons/react'
import { cn } from 'cn'
import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import { Wordmark } from '@/components/brand-mark'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/wallet-button'
import { useRoles } from '@/hooks/use-roles'

const links = [
  { to: '/badge', label: 'My pass' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/perks', label: 'Perks' },
]

function NavItems({ onNavigate, vertical }: { onNavigate?: () => void; vertical?: boolean }) {
  const { isStaff } = useRoles()
  const items = isStaff ? [...links, { to: '/admin', label: 'Door' }] : links
  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'relative text-[15px] font-medium transition-colors hover:text-foreground',
              vertical ? 'py-3.5 text-lg' : 'px-3 py-2',
              isActive ? 'text-foreground' : 'text-muted-foreground',
              isActive && !vertical && 'after:absolute after:inset-x-3 after:-bottom-[13px] after:h-[3px] after:bg-signal',
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
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-8">
        <Link to="/" aria-label="Loyl home" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="hidden items-center md:flex">
          <NavItems />
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
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
        <nav aria-label="Main" className="border-t border-foreground/10 px-4 pb-5 md:hidden">
          <div className="flex flex-col divide-y divide-foreground/10">
            <NavItems vertical onNavigate={() => setOpen(false)} />
          </div>
          <div className="pt-4 sm:hidden">
            <WalletButton />
          </div>
        </nav>
      )}
    </header>
  )
}
