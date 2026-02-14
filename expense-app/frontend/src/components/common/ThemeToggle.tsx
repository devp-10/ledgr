import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

export function ThemeToggle() {
  const { dark, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150 active:scale-95"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
