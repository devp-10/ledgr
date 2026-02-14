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
    <div className="app-bg">
      <Header />
      {showTabNav && <TabNav />}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 pb-16">
        <Outlet />
      </main>
    </div>
  )
}
