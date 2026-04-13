import { useState } from 'react'
import { usePromptStore, type PromptVersion } from '../store/promptStore'
import { useAuthStore } from '../store/authStore'

function shortId(userId: string) {
  return userId.slice(0, 8)
}

export default function PromptsPage() {
  const { prompts, addPrompt, updatePrompt, deletePrompt, setDefault } = usePromptStore()
  const { user } = useAuthStore()
  const [newName, setNewName] = useState('')
  const [newContent, setNewContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editContent, setEditContent] = useState('')

  function handleAdd() {
    if (!newName.trim() || !newContent.trim()) return
    addPrompt(newName.trim(), newContent.trim())
    setNewName('')
    setNewContent('')
  }

  function startEdit(p: PromptVersion) {
    setEditingId(p.id)
    setEditName(p.name)
    setEditContent(p.content)
  }

  function handleSaveEdit() {
    if (!editingId) return
    updatePrompt(editingId, { name: editName, content: editContent })
    setEditingId(null)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">공유 프롬프트 관리</h1>

      {/* Add new */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">새 프롬프트 버전 추가</h2>
        <div className="space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="버전 이름 (예: v2.0, game-localization)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="프롬프트 내용을 입력하세요. {{sourceLang}}, {{targetLang}} 변수를 사용할 수 있습니다."
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim() || !newContent.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            추가
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {prompts.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5">
            {editingId === p.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={8}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    {p.isDefault && (
                      <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        기본값
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      by{' '}
                      {p.userId === user?.id ? (
                        <span className="text-indigo-600 font-medium">나</span>
                      ) : (
                        <span className="font-mono">{shortId(p.userId)}</span>
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap font-mono mb-4 max-h-40 overflow-y-auto">
                  {p.content}
                </pre>
                <div className="flex gap-2">
                  {!p.isDefault && (
                    <button
                      onClick={() => setDefault(p.id)}
                      className="border border-indigo-300 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-50"
                    >
                      기본값으로 설정
                    </button>
                  )}
                  {p.userId === user?.id && (
                    <button
                      onClick={() => startEdit(p)}
                      className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50"
                    >
                      편집
                    </button>
                  )}
                  {p.userId === user?.id && prompts.length > 1 && (
                    <button
                      onClick={() => deletePrompt(p.id)}
                      className="border border-red-200 text-red-500 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
