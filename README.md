# S-Rank Translator

LLM 기반 번역 품질 관리 시스템. 번역 → 이력 저장 → 품질 평가까지 하나의 워크플로우로 처리합니다.

## 시스템 구성

### 번역 페이지
원문을 입력하면 선택한 LLM 모델이 번역을 수행합니다. 번역 시 사용할 프롬프트 버전을 선택할 수 있으며, 모든 번역 결과는 자동으로 이력에 저장됩니다.

### 번역 평가 페이지
저장된 번역 이력을 선택해 품질을 평가합니다. 직접 점수를 입력하거나 LLM이 자동으로 평가하도록 할 수 있습니다.

평가 기준 (각 1~5점):

| 기준 | 설명 |
|------|------|
| Terminology | 전문 용어 정확성 |
| Accuracy | 원문 의미 정확도 |
| Linguistic conventions | 목표 언어의 문법·구문 준수 |
| Style | 문체 및 어조 |
| Locale conventions | 날짜·숫자 형식 등 지역 문화 관습 |
| Audience appropriateness | 독자 적합성 |
| Design and markup | 서식·태그·플레이스홀더 보존 |

### 프롬프트 관리 페이지
번역에 사용할 시스템 프롬프트를 버전별로 관리합니다. `{{sourceLang}}`, `{{targetLang}}` 변수를 사용해 언어를 동적으로 주입할 수 있습니다.

### 설정
LLM 제공자(OpenAI / Anthropic), API 키, 모델을 설정합니다. API 키는 서버로 전송되지 않고 브라우저 로컬에만 저장됩니다.

## 데이터 구조

```
auth.users
│
├── prompt_versions
│   ├── id, user_id
│   ├── name, content
│   ├── is_default
│   └── created_at
│
├── translations
│   ├── id, user_id
│   ├── source_text, translated_text
│   ├── source_lang, target_lang
│   ├── prompt_version_id, prompt_version_name
│   ├── model
│   └── created_at
│
└── evaluations
    ├── id, user_id
    ├── translation_id  →  translations.id (cascade delete)
    ├── scores (JSON)
    │   ├── terminology, accuracy
    │   ├── linguistic_conventions, style
    │   ├── locale_conventions, audience_appropriateness
    │   └── design_and_markup
    ├── comment
    ├── evaluated_by  (human | llm)
    └── created_at
```

모든 테이블에 Row Level Security가 적용되어 있어 사용자는 자신의 데이터에만 접근할 수 있습니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Vite + React + TypeScript + Tailwind CSS |
| 상태 관리 | Zustand |
| 인증 / DB | Supabase |
| LLM | OpenAI API, Anthropic API |
| 배포 | Vercel |

## 로컬 실행

```bash
npm install
# .env.local에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 입력
npm run dev
```
