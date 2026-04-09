import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LLMProvider = 'openai' | 'anthropic'

interface SettingsState {
  provider: LLMProvider
  apiKey: string
  model: string
  setProvider: (provider: LLMProvider) => void
  setApiKey: (key: string) => void
  setModel: (model: string) => void
}

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-3-5-sonnet-20241022',
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      provider: 'openai',
      apiKey: '',
      model: DEFAULT_MODELS.openai,
      setProvider: (provider) =>
        set({ provider, model: DEFAULT_MODELS[provider] }),
      setApiKey: (apiKey) => set({ apiKey }),
      setModel: (model) => set({ model }),
    }),
    { name: 's-rank-settings' }
  )
)

export { DEFAULT_MODELS }
