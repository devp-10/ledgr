import { Outlet } from 'react-router-dom'
import { Header } from './Header'

export function Layout() {
  return (
    <div className="min-h-screen bg-cream dark:bg-[#212121]">
      <Header />
      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}
