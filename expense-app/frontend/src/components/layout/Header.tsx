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
      <defs>
        <linearGradient id="ledgr-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D9673A"/>
          <stop offset="100%" stopColor="#9B2D0F"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#ledgr-bg)" />
      {/* Ascending bars */}
      <rect x="11" y="42" width="10" height="10" rx="2.5" fill="white" fillOpacity="0.45"/>
      <rect x="25" y="30" width="10" height="22" rx="2.5" fill="white" fillOpacity="0.7"/>
      <rect x="39" y="18" width="10" height="34" rx="2.5" fill="white"/>
      {/* Baseline */}
      <rect x="9" y="53" width="46" height="3" rx="1.5" fill="white" fillOpacity="0.3"/>
      {/* Sparkline */}
      <polyline points="16,42 30,30 44,18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45"/>
      {/* Dots at bar tops */}
      <circle cx="16" cy="42" r="3" fill="white" opacity="0.6"/>
      <circle cx="30" cy="30" r="3" fill="white" opacity="0.8"/>
      <circle cx="44" cy="18" r="3.5" fill="white"/>
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
