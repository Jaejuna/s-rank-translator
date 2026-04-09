import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from './utils'

export interface TranslationRecord {
  id: string
  sourceText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  promptVersionId: string
  promptVersionName: string
  model: string
  createdAt: string
}

export interface EvaluationScores {
  terminology: number
  accuracy: number
  linguisticConventions: number
  style: number
  localeConventions: number
  audienceAppropriateness: number
  designAndMarkup: number
}

export interface EvaluationRecord {
  id: string
  translationId: string
  scores: EvaluationScores
  comment: string
  evaluatedBy: 'human' | 'llm'
  createdAt: string
}

interface TranslationState {
  translations: TranslationRecord[]
  evaluations: EvaluationRecord[]
  addTranslation: (record: Omit<TranslationRecord, 'id' | 'createdAt'>) => TranslationRecord
  addEvaluation: (record: Omit<EvaluationRecord, 'id' | 'createdAt'>) => void
  getEvaluationsForTranslation: (translationId: string) => EvaluationRecord[]
  deleteTranslation: (id: string) => void
}

export const useTranslationStore = create<TranslationState>()(
  persist(
    (set, get) => ({
      translations: [],
      evaluations: [],
      addTranslation: (record) => {
        const newRecord: TranslationRecord = {
          ...record,
          id: nanoid(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ translations: [newRecord, ...state.translations] }))
        return newRecord
      },
      addEvaluation: (record) =>
        set((state) => ({
          evaluations: [
            ...state.evaluations,
            { ...record, id: nanoid(), createdAt: new Date().toISOString() },
          ],
        })),
      getEvaluationsForTranslation: (translationId) =>
        get().evaluations.filter((e) => e.translationId === translationId),
      deleteTranslation: (id) =>
        set((state) => ({
          translations: state.translations.filter((t) => t.id !== id),
          evaluations: state.evaluations.filter((e) => e.translationId !== id),
        })),
    }),
    { name: 's-rank-translations' }
  )
)
