import { Link, NavLink, useLocation } from 'react-router-dom'
import { ThemeToggle } from '../common/ThemeToggle'
import { clsx } from 'clsx'

const TABS = [
  { to: '/', label: 'Plan', end: true },
  { to: '/reflect', label: 'Reflect', end: false },
  { to: '/ledger', label: 'Ledger', end: false },
]

export function Header() {
  const location = useLocation()
  const isMainTab = TABS.some(t => t.end ? location.pathname === t.to : location.pathname.startsWith(t.to))

  return (
    <header className="sticky top-0 z-40 bg-surface dark:bg-[#171717] border-b border-border-light dark:border-border-dark">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-accent-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">ledgr</span>
        </Link>

        {/* Tabs (only show on main pages) */}
        {isMainTab && (
          <nav className="flex items-center gap-1 flex-1">
            {TABS.map((tab) => (
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
        )}

        {/* Right actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
