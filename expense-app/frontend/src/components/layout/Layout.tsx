import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { TabNav } from './TabNav'

const MAIN_TABS = ['/', '/reflect', '/ledger']

export function Layout() {
  const location = useLocation()
  const showTabNav = MAIN_TABS.some(p =>
    p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      {showTabNav && <TabNav />}
      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
