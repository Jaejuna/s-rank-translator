import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export async function callLLM({
  provider,
  apiKey,
  model,
  systemPrompt,
  userMessage,
}: {
  provider: 'openai' | 'anthropic'
  apiKey: string
  model: string
  systemPrompt: string
  userMessage: string
}): Promise<string> {
  if (provider === 'openai') {
    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })
    return response.choices[0]?.message?.content ?? ''
  } else {
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })
    const block = response.content[0]
    return block.type === 'text' ? block.text : ''
  }
}

export function buildTranslationPrompt(
  promptTemplate: string,
  sourceLang: string,
  targetLang: string
): string {
  return promptTemplate
    .replace('{{sourceLang}}', sourceLang)
    .replace('{{targetLang}}', targetLang)
}

export const EVALUATION_CRITERIA = [
  { key: 'terminology', label: 'Terminology', description: '전문 용어 정확성' },
  { key: 'accuracy', label: 'Accuracy', description: '원문 의미 정확도' },
  { key: 'linguisticConventions', label: 'Linguistic conventions', description: '언어 관습 준수' },
  { key: 'style', label: 'Style', description: '문체 및 어조' },
  { key: 'localeConventions', label: 'Locale conventions', description: '지역 문화 관습' },
  { key: 'audienceAppropriateness', label: 'Audience appropriateness', description: '독자 적합성' },
  { key: 'designAndMarkup', label: 'Design and markup', description: '형식 및 마크업 보존' },
] as const

export function buildEvaluationPrompt(sourceText: string, translatedText: string, sourceLang: string, targetLang: string): string {
  return `You are a professional translation quality evaluator.

Evaluate the following translation on a scale of 1-5 for each criterion.

Source Language: ${sourceLang}
Target Language: ${targetLang}

--- SOURCE TEXT ---
${sourceText}

--- TRANSLATED TEXT ---
${translatedText}

Evaluation Criteria (score 1-5, where 1=very poor, 5=excellent):
- terminology: Accuracy and consistency of technical/specialized terms
- accuracy: Faithfulness to the original meaning without omissions or additions
- linguisticConventions: Grammar, syntax, and punctuation of the target language
- style: Tone, register, and stylistic appropriateness
- localeConventions: Cultural adaptation, date/number formats, idioms
- audienceAppropriateness: Suitability for the intended audience
- designAndMarkup: Preservation of formatting, tags, placeholders

Respond ONLY with valid JSON in this exact format:
{
  "scores": {
    "terminology": <1-5>,
    "accuracy": <1-5>,
    "linguisticConventions": <1-5>,
    "style": <1-5>,
    "localeConventions": <1-5>,
    "audienceAppropriateness": <1-5>,
    "designAndMarkup": <1-5>
  },
  "comment": "<brief overall assessment in Korean>"
}`
}
