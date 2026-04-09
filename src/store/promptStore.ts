import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from './utils'

export interface PromptVersion {
  id: string
  name: string
  content: string
  createdAt: string
  isDefault: boolean
}

const DEFAULT_PROMPT: PromptVersion = {
  id: 'default',
  name: 'Default v1.0',
  content: `You are a professional translator. Translate the given text accurately and naturally.

Source Language: {{sourceLang}}
Target Language: {{targetLang}}

Rules:
- Preserve the original meaning, tone, and style
- Use natural expressions in the target language
- Keep formatting and markup intact
- Translate only the text, output nothing else`,
  createdAt: new Date().toISOString(),
  isDefault: true,
}

interface PromptState {
  prompts: PromptVersion[]
  addPrompt: (name: string, content: string) => void
  updatePrompt: (id: string, updates: Partial<Pick<PromptVersion, 'name' | 'content'>>) => void
  deletePrompt: (id: string) => void
  setDefault: (id: string) => void
  getDefault: () => PromptVersion | undefined
}

export const usePromptStore = create<PromptState>()(
  persist(
    (set, get) => ({
      prompts: [DEFAULT_PROMPT],
      addPrompt: (name, content) =>
        set((state) => ({
          prompts: [
            ...state.prompts,
            {
              id: nanoid(),
              name,
              content,
              createdAt: new Date().toISOString(),
              isDefault: false,
            },
          ],
        })),
      updatePrompt: (id, updates) =>
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      deletePrompt: (id) =>
        set((state) => ({
          prompts: state.prompts.filter((p) => p.id !== id),
        })),
      setDefault: (id) =>
        set((state) => ({
          prompts: state.prompts.map((p) => ({ ...p, isDefault: p.id === id })),
        })),
      getDefault: () => get().prompts.find((p) => p.isDefault) ?? get().prompts[0],
    }),
    { name: 's-rank-prompts' }
  )
)
