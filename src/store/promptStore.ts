import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface PromptVersion {
  id: string
  name: string
  content: string
  createdAt: string
  isDefault: boolean
}

const DEFAULT_PROMPT_CONTENT = `You are a professional translator. Translate the given text accurately and naturally.

Source Language: {{sourceLang}}
Target Language: {{targetLang}}

Rules:
- Preserve the original meaning, tone, and style
- Use natural expressions in the target language
- Keep formatting and markup intact
- Translate only the text, output nothing else`

interface PromptState {
  prompts: PromptVersion[]
  loading: boolean
  fetchPrompts: () => Promise<void>
  addPrompt: (name: string, content: string) => Promise<void>
  updatePrompt: (id: string, updates: Partial<Pick<PromptVersion, 'name' | 'content'>>) => Promise<void>
  deletePrompt: (id: string) => Promise<void>
  setDefault: (id: string) => Promise<void>
  getDefault: () => PromptVersion | undefined
  ensureDefault: () => Promise<void>
}

function toPromptVersion(row: Record<string, unknown>): PromptVersion {
  return {
    id: row.id as string,
    name: row.name as string,
    content: row.content as string,
    createdAt: row.created_at as string,
    isDefault: row.is_default as boolean,
  }
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  loading: false,

  fetchPrompts: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('prompt_versions')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) set({ prompts: data.map(toPromptVersion) })
    set({ loading: false })

    // 프롬프트가 없으면 기본값 생성
    if (!data || data.length === 0) {
      await get().ensureDefault()
    }
  },

  ensureDefault: async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return
    const { data } = await supabase
      .from('prompt_versions')
      .insert({
        user_id: user.user.id,
        name: 'Default v1.0',
        content: DEFAULT_PROMPT_CONTENT,
        is_default: true,
      })
      .select()
      .single()
    if (data) set((state) => ({ prompts: [...state.prompts, toPromptVersion(data)] }))
  },

  addPrompt: async (name, content) => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return
    const { data } = await supabase
      .from('prompt_versions')
      .insert({ user_id: user.user.id, name, content, is_default: false })
      .select()
      .single()
    if (data) set((state) => ({ prompts: [...state.prompts, toPromptVersion(data)] }))
  },

  updatePrompt: async (id, updates) => {
    const payload: Record<string, string> = {}
    if (updates.name !== undefined) payload.name = updates.name
    if (updates.content !== undefined) payload.content = updates.content
    await supabase.from('prompt_versions').update(payload).eq('id', id)
    set((state) => ({
      prompts: state.prompts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }))
  },

  deletePrompt: async (id) => {
    await supabase.from('prompt_versions').delete().eq('id', id)
    set((state) => ({ prompts: state.prompts.filter((p) => p.id !== id) }))
  },

  setDefault: async (id) => {
    // 기존 기본값 해제
    const current = get().prompts.find((p) => p.isDefault)
    if (current) {
      await supabase.from('prompt_versions').update({ is_default: false }).eq('id', current.id)
    }
    await supabase.from('prompt_versions').update({ is_default: true }).eq('id', id)
    set((state) => ({
      prompts: state.prompts.map((p) => ({ ...p, isDefault: p.id === id })),
    }))
  },

  getDefault: () => {
    const { prompts } = get()
    return prompts.find((p) => p.isDefault) ?? prompts[0]
  },
}))
