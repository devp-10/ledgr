import { Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from '../common/ThemeToggle'

export function Header() {
  const location = useLocation()
  const isSettings = location.pathname === '/settings'

  return (
    <header className="sticky top-0 z-40 glass border-b border-white/[0.06]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg btn-glow flex items-center justify-center">
            <span className="text-white font-bold text-xs tracking-tight">L</span>
          </div>
          <span className="text-base font-bold gradient-text tracking-tight">ledgr</span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            to="/settings"
            aria-label="Settings"
            className={`p-2 rounded-lg transition-all duration-150 active:scale-95 ${
              isSettings
                ? 'text-primary-400 bg-primary-500/10'
                : 'text-white/40 hover:text-white/70 hover:bg-white/05'
            }`}
          >
            <Settings size={18} />
          </Link>
        </div>
      </div>
    </header>
  )
}
