import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function AuthPage() {
  const { signIn, signUp } = useAuthStore()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signupDone, setSignupDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'login') {
      const err = await signIn(email, password)
      if (err) setError(err)
      else navigate('/')
    } else {
      const err = await signUp(email, password)
      if (err) setError(err)
      else setSignupDone(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">S-Rank Translator</h1>
        <p className="text-sm text-gray-500 mb-6">
          {mode === 'login' ? '로그인하여 시작하세요.' : '계정을 만들어 시작하세요.'}
        </p>

        {signupDone ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
            가입 완료! 이메일을 확인하여 인증 링크를 클릭해주세요.
            <button
              onClick={() => { setMode('login'); setSignupDone(false) }}
              className="block mt-2 text-green-800 font-medium underline"
            >
              로그인 페이지로 →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="6자 이상"
                minLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
            </button>

            <p className="text-center text-sm text-gray-500">
              {mode === 'login' ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
                className="text-indigo-600 font-medium hover:underline"
              >
                {mode === 'login' ? '회원가입' : '로그인'}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
