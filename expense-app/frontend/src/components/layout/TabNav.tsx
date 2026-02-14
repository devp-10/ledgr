import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'

const TABS = [
  { to: '/', label: 'Plan', end: true },
  { to: '/reflect', label: 'Reflect', end: false },
  { to: '/ledger', label: 'Ledger', end: false },
]

export function TabNav() {
  return (
    <div className="sticky top-14 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-screen-xl mx-auto px-6">
        <nav className="flex items-center gap-0 -mb-px">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                clsx(
                  'relative px-5 py-3.5 text-sm font-medium transition-all duration-200 select-none',
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-primary-500 to-accent-500" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
