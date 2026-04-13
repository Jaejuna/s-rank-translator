import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface TranslationRecord {
  id: string
  userId: string
  userEmail: string
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
  userId: string
  userEmail: string
  translationId: string
  scores: EvaluationScores
  comment: string
  evaluatedBy: 'human' | 'llm'
  createdAt: string
}

interface TranslationState {
  translations: TranslationRecord[]
  evaluations: EvaluationRecord[]
  loading: boolean
  fetchTranslations: () => Promise<void>
  fetchEvaluations: (translationId: string) => Promise<EvaluationRecord[]>
  addTranslation: (record: Omit<TranslationRecord, 'id' | 'createdAt' | 'userId' | 'userEmail'>) => Promise<TranslationRecord | null>
  addEvaluation: (record: Omit<EvaluationRecord, 'id' | 'createdAt' | 'userId' | 'userEmail'>) => Promise<void>
  getEvaluationsForTranslation: (translationId: string) => EvaluationRecord[]
  deleteTranslation: (id: string) => Promise<void>
  clear: () => void
}

function toTranslation(row: Record<string, unknown>): TranslationRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    userEmail: (row.user_email as string) ?? '',
    sourceText: row.source_text as string,
    translatedText: row.translated_text as string,
    sourceLang: row.source_lang as string,
    targetLang: row.target_lang as string,
    promptVersionId: row.prompt_version_id as string,
    promptVersionName: row.prompt_version_name as string,
    model: row.model as string,
    createdAt: row.created_at as string,
  }
}

function toEvaluation(row: Record<string, unknown>): EvaluationRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    userEmail: (row.user_email as string) ?? '',
    translationId: row.translation_id as string,
    scores: row.scores as EvaluationScores,
    comment: row.comment as string,
    evaluatedBy: row.evaluated_by as 'human' | 'llm',
    createdAt: row.created_at as string,
  }
}

export const useTranslationStore = create<TranslationState>((set, get) => ({
  translations: [],
  evaluations: [],
  loading: false,

  fetchTranslations: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('translations')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) set({ translations: data.map(toTranslation) })
    set({ loading: false })
  },

  fetchEvaluations: async (translationId) => {
    const { data } = await supabase
      .from('evaluations')
      .select('*')
      .eq('translation_id', translationId)
      .order('created_at', { ascending: false })
    const evals = data ? data.map(toEvaluation) : []
    set((state) => {
      const others = state.evaluations.filter((e) => e.translationId !== translationId)
      return { evaluations: [...others, ...evals] }
    })
    return evals
  },

  addTranslation: async (record) => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return null
    const { data } = await supabase
      .from('translations')
      .insert({
        user_id: user.user.id,
        user_email: user.user.email ?? '',
        source_text: record.sourceText,
        translated_text: record.translatedText,
        source_lang: record.sourceLang,
        target_lang: record.targetLang,
        prompt_version_id: record.promptVersionId,
        prompt_version_name: record.promptVersionName,
        model: record.model,
      })
      .select()
      .single()
    if (!data) return null
    const newRecord = toTranslation(data)
    set((state) => ({ translations: [newRecord, ...state.translations] }))
    return newRecord
  },

  addEvaluation: async (record) => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return
    const { data } = await supabase
      .from('evaluations')
      .insert({
        user_id: user.user.id,
        user_email: user.user.email ?? '',
        translation_id: record.translationId,
        scores: record.scores,
        comment: record.comment,
        evaluated_by: record.evaluatedBy,
      })
      .select()
      .single()
    if (data) {
      const newEval = toEvaluation(data)
      set((state) => ({ evaluations: [newEval, ...state.evaluations] }))
    }
  },

  getEvaluationsForTranslation: (translationId) =>
    get().evaluations.filter((e) => e.translationId === translationId),

  deleteTranslation: async (id) => {
    await supabase.from('translations').delete().eq('id', id)
    set((state) => ({
      translations: state.translations.filter((t) => t.id !== id),
      evaluations: state.evaluations.filter((e) => e.translationId !== id),
    }))
  },

  clear: () => set({ translations: [], evaluations: [] }),
}))
