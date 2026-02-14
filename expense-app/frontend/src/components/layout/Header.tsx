import { Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from '../common/ThemeToggle'

export function Header() {
  const location = useLocation()
  const isSettings = location.pathname === '/settings'

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs">L</span>
          </div>
          <span className="text-base font-bold gradient-text">Ledgr</span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            to="/settings"
            aria-label="Settings"
            className={`p-2 rounded-lg transition-all duration-150 active:scale-95 ${
              isSettings
                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Settings size={18} />
          </Link>
        </div>
      </div>
    </header>
  )
}
