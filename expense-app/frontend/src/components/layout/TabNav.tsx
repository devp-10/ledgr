import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'

const TABS = [
  { to: '/', label: 'Plan', end: true },
  { to: '/reflect', label: 'Reflect', end: false },
  { to: '/ledger', label: 'Ledger', end: false },
]

export function TabNav() {
  return (
    <div className="sticky top-14 z-30 glass border-b border-white/[0.06]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-2">
        <nav className="flex items-center gap-1">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                clsx(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 select-none',
                  isActive
                    ? 'tab-pill-active'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/05 border border-transparent'
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
