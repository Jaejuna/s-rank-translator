import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { usePromptStore } from '../store/promptStore'
import { useTranslationStore } from '../store/translationStore'

const navItems = [
  { to: '/', label: '번역', end: true },
  { to: '/evaluate', label: '평가' },
  { to: '/prompts', label: '프롬프트 관리' },
  { to: '/settings', label: '설정' },
]

export default function Layout() {
  const { user, signOut } = useAuthStore()
  const { fetchPrompts } = usePromptStore()
  const { fetchTranslations, clear } = useTranslationStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      fetchPrompts()
      fetchTranslations()
    }
  }, [user])

  async function handleSignOut() {
    clear()
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center h-14 gap-6">
          <span className="font-bold text-indigo-600 text-lg tracking-tight">
            S-Rank Translator
          </span>
          <nav className="flex gap-1 flex-1">
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
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-500 hover:text-red-500 border border-gray-200 px-2.5 py-1 rounded-md hover:border-red-200 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
