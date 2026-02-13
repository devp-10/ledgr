import { NavLink, Outlet } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { useTheme } from '../hooks/useTheme'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard' },
  { to: '/upload', label: 'Upload' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
]

export function Layout() {
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-1">
            <span className="font-bold text-lg mr-5 text-blue-600 dark:text-blue-400 tracking-tight">
              Ledgr
            </span>
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
