import { useState } from 'react'
import { useTranslationStore, type TranslationRecord, type EvaluationScores } from '../store/translationStore'
import { useSettingsStore } from '../store/settingsStore'
import { callLLM, EVALUATION_CRITERIA, buildEvaluationPrompt } from '../lib/llm'

const EMPTY_SCORES: EvaluationScores = {
  terminology: 3,
  accuracy: 3,
  linguisticConventions: 3,
  style: 3,
  localeConventions: 3,
  audienceAppropriateness: 3,
  designAndMarkup: 3,
}

function ScoreSlider({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-48 shrink-0">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <div className="flex items-center gap-2 flex-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-8 h-8 rounded-full text-sm font-semibold border-2 transition-colors ${
              value === n
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'border-gray-300 text-gray-400 hover:border-indigo-400'
            }`}
          >
            {n}
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-500">
          {['', '매우 나쁨', '나쁨', '보통', '좋음', '매우 좋음'][value]}
        </span>
      </div>
    </div>
  )
}

function avgScore(scores: EvaluationScores): number {
  const vals = Object.values(scores)
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}

export default function EvaluatePage() {
  const { translations, addEvaluation, fetchEvaluations, getEvaluationsForTranslation } = useTranslationStore()
  const { provider, apiKey, model } = useSettingsStore()

  const [selectedId, setSelectedId] = useState<string>('')
  const [scores, setScores] = useState<EvaluationScores>({ ...EMPTY_SCORES })
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const selected: TranslationRecord | undefined = translations.find((t) => t.id === selectedId)
  const existingEvals = selectedId ? getEvaluationsForTranslation(selectedId) : []

  async function handleSelect(id: string) {
    setSelectedId(id)
    setScores({ ...EMPTY_SCORES })
    setComment('')
    setError('')
    setSaved(false)
    if (id) await fetchEvaluations(id)
  }

  function handleScoreChange(key: keyof EvaluationScores, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    if (!selectedId) return
    addEvaluation({ translationId: selectedId, scores, comment, evaluatedBy: 'human' })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLLMEval() {
    if (!selected) return
    if (!apiKey) {
      setError('설정 페이지에서 API 키를 먼저 입력해주세요.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const prompt = buildEvaluationPrompt(
        selected.sourceText,
        selected.translatedText,
        selected.sourceLang,
        selected.targetLang
      )
      const raw = await callLLM({
        provider,
        apiKey,
        model,
        systemPrompt: 'You are a professional translation quality evaluator. Always respond with valid JSON only.',
        userMessage: prompt,
      })
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('LLM 응답을 파싱할 수 없습니다.')
      const parsed = JSON.parse(jsonMatch[0])
      setScores(parsed.scores)
      setComment(parsed.comment ?? '')
      addEvaluation({
        translationId: selectedId,
        scores: parsed.scores,
        comment: parsed.comment ?? '',
        evaluatedBy: 'llm',
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '평가 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">번역 평가</h1>

      {/* Select translation */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">평가할 번역 선택</label>
        {translations.length === 0 ? (
          <p className="text-sm text-gray-400">번역 이력이 없습니다. 먼저 번역을 수행해주세요.</p>
        ) : (
          <select
            value={selectedId}
            onChange={(e) => handleSelect(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">선택하세요...</option>
            {translations.map((t) => (
              <option key={t.id} value={t.id}>
                [{new Date(t.createdAt).toLocaleDateString('ko-KR')}] {t.sourceLang}→{t.targetLang} | {t.sourceText.slice(0, 40)}...
              </option>
            ))}
          </select>
        )}
      </div>

      {selected && (
        <>
          {/* Source / Translation side by side */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 mb-2">원문 ({selected.sourceLang})</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.sourceText}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 mb-2">번역문 ({selected.targetLang})</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.translatedText}</p>
            </div>
          </div>

          {/* Evaluation form */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h2 className="text-base font-semibold text-gray-800 mb-5">평가 기준</h2>
            <div className="space-y-4">
              {EVALUATION_CRITERIA.map(({ key, label, description }) => (
                <ScoreSlider
                  key={key}
                  label={label}
                  description={description}
                  value={scores[key as keyof EvaluationScores]}
                  onChange={(v) => handleScoreChange(key as keyof EvaluationScores, v)}
                />
              ))}
            </div>

            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종합 코멘트
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="전반적인 번역 품질에 대한 의견을 입력하세요..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
              />
            </div>

            {error && (
              <p className="mt-2 text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSave}
                disabled={saved}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {saved ? '저장됨 ✓' : '직접 평가 저장'}
              </button>
              <button
                onClick={handleLLMEval}
                disabled={loading}
                className="border border-indigo-300 text-indigo-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 disabled:opacity-40 transition-colors"
              >
                {loading ? 'LLM 평가 중...' : 'LLM으로 자동 평가'}
              </button>
            </div>
          </div>

          {/* Existing evaluations */}
          {existingEvals.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                이전 평가 기록 ({existingEvals.length}건)
              </h2>
              <div className="space-y-4">
                {existingEvals.map((ev) => (
                  <div key={ev.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          ev.evaluatedBy === 'llm'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {ev.evaluatedBy === 'llm' ? 'LLM 평가' : '직접 평가'}
                        </span>
                        <span className="text-sm font-bold text-indigo-600">
                          평균 {avgScore(ev.scores)}점
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(ev.createdAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {EVALUATION_CRITERIA.map(({ key, label }) => (
                        <div key={key} className="text-center">
                          <p className="text-xs text-gray-500">{label}</p>
                          <p className="text-base font-bold text-gray-800">
                            {ev.scores[key as keyof EvaluationScores]}
                          </p>
                        </div>
                      ))}
                    </div>
                    {ev.comment && (
                      <p className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-100">
                        {ev.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
