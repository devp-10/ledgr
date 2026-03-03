import { Link, NavLink, useLocation } from 'react-router-dom'
import { ThemeToggle } from '../common/ThemeToggle'
import { AccountsPopover } from './AccountsPopover'
import { clsx } from 'clsx'

const TABS = [
  { to: '/', label: 'Plan', end: true },
  { to: '/reflect', label: 'Reflect', end: false },
  { to: '/ledger', label: 'Ledger', end: false },
]

function LedgrLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#C15F3C" />
      {/* Sharp slanted zigzag L — 6 diagonal teeth alternating left/right at 45° */}
      <path
        d="M 17,8 L 25,12 L 17,16 L 9,20 L 17,24 L 25,28 L 17,32 L 9,36 L 17,40 L 25,44 L 17,48 L 9,52 L 17,56 L 52,56"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export function Header() {
  const location = useLocation()
  const isMainTab = TABS.some(t => t.end ? location.pathname === t.to : location.pathname.startsWith(t.to))

  return (
    <header className="sticky top-0 z-40 bg-surface dark:bg-[#171717] border-b border-border-light dark:border-border-dark">
      <div className="max-w-screen-xl mx-auto px-6 h-14 grid grid-cols-3 items-center">

        {/* Logo — left */}
        <Link to="/" className="flex items-center gap-2 justify-self-start">
          <LedgrLogo />
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">ledgr</span>
        </Link>

        {/* Tabs — true center */}
        <nav className="flex items-center gap-1 justify-self-center">
          {isMainTab && TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                clsx(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'text-accent-600 dark:text-accent-400 bg-accent-500/10'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1 justify-self-end">
          <AccountsPopover />
          <ThemeToggle />
        </div>

      </div>
    </header>
  )
}
