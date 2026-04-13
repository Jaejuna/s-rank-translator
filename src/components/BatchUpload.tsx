import { useRef, useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { usePromptStore } from '../store/promptStore'
import { useTranslationStore } from '../store/translationStore'
import { callLLM, buildTranslationPrompt } from '../lib/llm'

const LANGUAGES = [
  { code: 'English', label: '영어' },
  { code: 'Korean', label: '한국어' },
  { code: 'Japanese', label: '일본어' },
  { code: 'Chinese (Simplified)', label: '중국어 (간체)' },
  { code: 'Chinese (Traditional)', label: '중국어 (번체)' },
  { code: 'French', label: '프랑스어' },
  { code: 'German', label: '독일어' },
  { code: 'Spanish', label: '스페인어' },
]

interface CsvRow {
  source_text: string
  translated_text?: string
}

// 따옴표 내 쉼표를 처리하는 CSV 행 파싱
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseCsv(text: string): CsvRow[] | null {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) return null

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
  const sourceIdx = headers.indexOf('source_text')
  const translatedIdx = headers.indexOf('translated_text')

  if (sourceIdx === -1) return null

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line)
    const row: CsvRow = { source_text: cols[sourceIdx] ?? '' }
    if (translatedIdx !== -1 && cols[translatedIdx]) {
      row.translated_text = cols[translatedIdx]
    }
    return row
  }).filter((r) => r.source_text.trim() !== '')
}

type Status = 'idle' | 'running' | 'done' | 'error'

export default function BatchUpload() {
  const { provider, apiKey, model } = useSettingsStore()
  const { prompts, getDefault } = usePromptStore()
  const { addTranslation } = useTranslationStore()

  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<CsvRow[]>([])
  const [mode, setMode] = useState<'translate' | 'import' | null>(null)
  const [sourceLang, setSourceLang] = useState('English')
  const [targetLang, setTargetLang] = useState('Korean')
  const [selectedPromptId, setSelectedPromptId] = useState<string>(() => getDefault()?.id ?? '')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setStatus('idle')
    setErrorMessage('')
    setProgress({ current: 0, total: 0 })

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCsv(text)
      if (!parsed || parsed.length === 0) {
        setErrorMessage('올바른 CSV 형식이 아닙니다. source_text 컬럼이 필요합니다.')
        setRows([])
        setMode(null)
        return
      }
      const hasTranslated = parsed.some((r) => r.translated_text)
      setRows(parsed)
      setMode(hasTranslated ? 'import' : 'translate')
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleStart() {
    if (!rows.length || !mode) return
    if (mode === 'translate' && !apiKey) {
      setErrorMessage('설정에서 API 키를 먼저 입력해주세요.')
      return
    }

    setStatus('running')
    setErrorMessage('')
    setProgress({ current: 0, total: rows.length })

    const prompt = prompts.find((p) => p.id === selectedPromptId) ?? getDefault()

    let failed = 0
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        let translatedText = row.translated_text ?? ''

        if (mode === 'translate') {
          const systemPrompt = buildTranslationPrompt(
            prompt?.content ?? '',
            sourceLang,
            targetLang
          )
          translatedText = await callLLM({
            provider,
            apiKey,
            model,
            systemPrompt,
            userMessage: row.source_text,
          })
        }

        await addTranslation({
          sourceText: row.source_text,
          translatedText,
          sourceLang,
          targetLang,
          promptVersionId: prompt?.id ?? '',
          promptVersionName: mode === 'import' ? '(임포트)' : (prompt?.name ?? ''),
          model: mode === 'import' ? '(임포트)' : model,
        })
      } catch {
        failed++
      }
      setProgress({ current: i + 1, total: rows.length })
    }

    if (failed > 0) {
      setErrorMessage(`${rows.length - failed}건 저장, ${failed}건 실패`)
      setStatus('error')
    } else {
      setStatus('done')
    }
  }

  function reset() {
    setFileName('')
    setRows([])
    setMode(null)
    setStatus('idle')
    setErrorMessage('')
    setProgress({ current: 0, total: 0 })
    if (fileRef.current) fileRef.current.value = ''
  }

  const progressPct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-800">배치 업로드</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          CSV 파일로 번역을 일괄 처리하거나 기존 번역 쌍을 임포트합니다.
        </p>
      </div>

      {/* CSV 형식 안내 */}
      <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-600">CSV 형식</p>
        <p><span className="font-mono bg-gray-100 px-1 rounded">source_text</span> 컬럼만 → LLM 번역 후 저장</p>
        <p><span className="font-mono bg-gray-100 px-1 rounded">source_text</span> + <span className="font-mono bg-gray-100 px-1 rounded">translated_text</span> → 번역 없이 바로 임포트</p>
      </div>

      {/* 파일 선택 */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="csv-upload"
        />
        <div className="flex items-center gap-3">
          <label
            htmlFor="csv-upload"
            className="cursor-pointer border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            파일 선택
          </label>
          {fileName ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">{fileName}</span>
              {rows.length > 0 && (
                <span className="text-xs text-gray-400">({rows.length}행 감지됨)</span>
              )}
              {mode && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  mode === 'translate'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {mode === 'translate' ? '번역 모드' : '임포트 모드'}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400">CSV 파일을 선택하세요</span>
          )}
        </div>
      </div>

      {/* 번역 모드 옵션 */}
      {mode === 'translate' && (
        <div className="space-y-3">
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
        </div>
      )}

      {/* 임포트 모드 언어 선택 */}
      {mode === 'import' && (
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
      )}

      {/* 에러 */}
      {errorMessage && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{errorMessage}</p>
      )}

      {/* 진행률 */}
      {status === 'running' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>처리 중...</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* 완료 */}
      {status === 'done' && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
          {progress.total}건 저장 완료
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-2">
        {mode && status !== 'running' && status !== 'done' && (
          <button
            onClick={handleStart}
            disabled={!rows.length}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {mode === 'translate' ? '일괄 번역 시작' : '임포트'}
          </button>
        )}
        {(status === 'done' || status === 'error') && (
          <button
            onClick={reset}
            className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            초기화
          </button>
        )}
      </div>
    </div>
  )
}
