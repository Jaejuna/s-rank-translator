import { useState } from 'react'
import { useSettingsStore, DEFAULT_MODELS, type LLMProvider } from '../store/settingsStore'

const OPENAI_MODELS = ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o', 'gpt-4o-mini']
const ANTHROPIC_MODELS = [
  'claude-opus-4-5',
  'claude-sonnet-4-5',
  'claude-haiku-4-5',
  'claude-3-7-sonnet-20250219',
]

export default function SettingsPage() {
  const { provider, apiKey, model, setProvider, setApiKey, setModel } = useSettingsStore()
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const models = provider === 'openai' ? OPENAI_MODELS : ANTHROPIC_MODELS

  function handleProviderChange(p: LLMProvider) {
    setProvider(p)
    setModel(DEFAULT_MODELS[p])
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">설정</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">LLM 제공자</label>
          <div className="flex gap-3">
            {(['openai', 'anthropic'] as LLMProvider[]).map((p) => (
              <button
                key={p}
                onClick={() => handleProviderChange(p)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  provider === p
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                }`}
              >
                {p === 'openai' ? 'OpenAI' : 'Anthropic'}
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">API 키</label>
          <div className="flex gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              {showKey ? '숨기기' : '보기'}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">API 키는 이 브라우저에만 저장됩니다.</p>
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">모델</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {saved ? '저장됨 ✓' : '저장'}
        </button>
      </div>
    </div>
  )
}
