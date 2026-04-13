import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { usePromptStore } from '../store/promptStore'
import { useTranslationStore, type TranslationRecord } from '../store/translationStore'
import { useAuthStore } from '../store/authStore'
import { callLLM, buildTranslationPrompt } from '../lib/llm'

const LANGUAGES = [
  { code: 'Korean', label: '한국어' },
  { code: 'English', label: '영어' },
  { code: 'Japanese', label: '일본어' },
  { code: 'Chinese (Simplified)', label: '중국어 (간체)' },
  { code: 'Chinese (Traditional)', label: '중국어 (번체)' },
  { code: 'French', label: '프랑스어' },
  { code: 'German', label: '독일어' },
  { code: 'Spanish', label: '스페인어' },
]

function shortId(userId: string) {
  return userId.slice(0, 8)
}

export default function TranslatePage() {
  const { provider, apiKey, model } = useSettingsStore()
  const { prompts, getDefault } = usePromptStore()
  const { translations, fetchTranslations, addTranslation, deleteTranslation } = useTranslationStore()
  const { user } = useAuthStore()

  useEffect(() => { fetchTranslations() }, [])

  const [sourceText, setSourceText] = useState('')
  const [sourceLang, setSourceLang] = useState('English')
  const [targetLang, setTargetLang] = useState('Korean')
  const [selectedPromptId, setSelectedPromptId] = useState<string>(() => getDefault()?.id ?? 'default')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<TranslationRecord | null>(null)

  async function handleTranslate() {
    if (!sourceText.trim()) return
    if (!apiKey) {
      setError('설정 페이지에서 API 키를 먼저 입력해주세요.')
      return
    }

    const prompt = prompts.find((p) => p.id === selectedPromptId) ?? getDefault()
    if (!prompt) return

    setLoading(true)
    setError('')
    setResult('')

    try {
      const systemPrompt = buildTranslationPrompt(prompt.content, sourceLang, targetLang)
      const translated = await callLLM({
        provider,
        apiKey,
        model,
        systemPrompt,
        userMessage: sourceText,
      })
      setResult(translated)
      await addTranslation({
        sourceText,
        translatedText: translated,
        sourceLang,
        targetLang,
        promptVersionId: prompt.id,
        promptVersionName: prompt.name,
        model,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '번역 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">번역</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">원문 언어</label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">번역 언어</label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">프롬프트 버전</label>
            <select
              value={selectedPromptId}
              onChange={(e) => setSelectedPromptId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {prompts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.isDefault ? ' (기본값)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">원문</label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="번역할 텍스트를 입력하세요..."
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleTranslate}
            disabled={loading || !sourceText.trim()}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {loading ? '번역 중...' : '번역하기'}
          </button>
        </div>

        {/* Result */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-xs font-medium text-gray-500 mb-1">번역 결과</label>
          <div className="w-full min-h-64 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 whitespace-pre-wrap leading-relaxed">
            {loading ? (
              <span className="text-gray-400 animate-pulse">번역 중...</span>
            ) : result ? (
              result
            ) : (
              <span className="text-gray-300">번역 결과가 여기에 표시됩니다.</span>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">
            최근 번역 이력
          </h2>
          <span className="text-xs text-gray-400">{translations.length}건 중 최근 10건</span>
        </div>
        {translations.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">번역 이력이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-2 font-medium text-gray-500 w-1/4">원문</th>
                  <th className="pb-2 font-medium text-gray-500 w-1/4">번역문</th>
                  <th className="pb-2 font-medium text-gray-500">언어</th>
                  <th className="pb-2 font-medium text-gray-500">프롬프트</th>
                  <th className="pb-2 font-medium text-gray-500">모델</th>
                  <th className="pb-2 font-medium text-gray-500">작성자</th>
                  <th className="pb-2 font-medium text-gray-500">날짜</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {translations.slice(0, 10).map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedRecord(selectedRecord?.id === t.id ? null : t)}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="py-2 pr-3 text-gray-700 truncate max-w-xs">{t.sourceText}</td>
                    <td className="py-2 pr-3 text-gray-700 truncate max-w-xs">{t.translatedText}</td>
                    <td className="py-2 pr-3 text-gray-500 whitespace-nowrap text-xs">{t.sourceLang} → {t.targetLang}</td>
                    <td className="py-2 pr-3 text-gray-500 text-xs">{t.promptVersionName}</td>
                    <td className="py-2 pr-3 text-gray-500 text-xs">{t.model}</td>
                    <td className="py-2 pr-3 text-xs">
                      {t.userId === user?.id ? (
                        <span className="text-indigo-600 font-medium">나</span>
                      ) : (
                        <span className="text-gray-400 font-mono">{shortId(t.userId)}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2">
                      {t.userId === user?.id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTranslation(t.id) }}
                          className="text-red-400 hover:text-red-600 text-xs"
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Expanded detail */}
        {selectedRecord && (
          <div className="mt-4 border border-indigo-100 rounded-xl bg-indigo-50 p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-indigo-800">상세 내용</h3>
              <button onClick={() => setSelectedRecord(null)} className="text-indigo-400 text-xs hover:text-indigo-600">닫기</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">원문</p>
                <p className="whitespace-pre-wrap text-gray-700 bg-white rounded-lg p-3 text-xs leading-relaxed">{selectedRecord.sourceText}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">번역문</p>
                <p className="whitespace-pre-wrap text-gray-700 bg-white rounded-lg p-3 text-xs leading-relaxed">{selectedRecord.translatedText}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
