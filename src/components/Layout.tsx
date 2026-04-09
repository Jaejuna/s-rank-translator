import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: '번역', end: true },
  { to: '/evaluate', label: '평가' },
  { to: '/prompts', label: '프롬프트 관리' },
  { to: '/settings', label: '설정' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center h-14 gap-6">
          <span className="font-bold text-indigo-600 text-lg tracking-tight">
            S-Rank Translator
          </span>
          <nav className="flex gap-1">
            {navItems.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
