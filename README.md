# S-Rank Translator

LLM 기반 번역 및 번역 품질 평가 웹앱.

번역, 평가, 프롬프트 버전 관리를 하나의 도구에서 처리할 수 있습니다. 사용자 계정으로 로그인하면 번역 이력과 평가 데이터가 클라우드에 저장되어 어느 기기에서든 동일하게 접근할 수 있습니다.

## 기능

- **번역** — OpenAI / Anthropic 모델로 번역. 프롬프트 버전 선택 가능
- **번역 평가** — 7개 기준으로 번역 품질 평가 (직접 평가 또는 LLM 자동 평가)
  - Terminology / Accuracy / Linguistic conventions / Style / Locale conventions / Audience appropriateness / Design and markup
- **프롬프트 관리** — 번역 프롬프트를 버전별로 생성, 편집, 삭제
- **계정 동기화** — 이메일+비밀번호 로그인, 데이터 기기 간 공유
- **API 키** — 사용자가 직접 입력 (브라우저 로컬에만 저장)

## 기술 스택

- **Frontend** — Vite + React + TypeScript + Tailwind CSS
- **상태 관리** — Zustand
- **라우팅** — React Router v6
- **백엔드/DB** — Supabase (Auth + PostgreSQL)
- **LLM** — OpenAI SDK, Anthropic SDK (브라우저 직접 호출)
- **배포** — Vercel

## 로컬 실행

**1. 의존성 설치**

```bash
npm install
```

**2. 환경변수 설정**

`.env.local` 파일을 만들고 Supabase 프로젝트 정보를 입력합니다.

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Supabase URL과 anon key는 Supabase 대시보드 → Project Settings → API에서 확인할 수 있습니다.

**3. Supabase 테이블 생성**

Supabase 대시보드 → SQL Editor에서 아래 SQL을 실행합니다.

```sql
create table prompt_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  content text not null,
  is_default boolean default false,
  created_at timestamptz default now()
);
alter table prompt_versions enable row level security;
create policy "users own their prompts"
  on prompt_versions for all using (auth.uid() = user_id);

create table translations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  source_text text not null,
  translated_text text not null,
  source_lang text not null,
  target_lang text not null,
  prompt_version_id text,
  prompt_version_name text,
  model text,
  created_at timestamptz default now()
);
alter table translations enable row level security;
create policy "users own their translations"
  on translations for all using (auth.uid() = user_id);

create table evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  translation_id uuid references translations on delete cascade,
  scores jsonb not null,
  comment text default '',
  evaluated_by text check (evaluated_by in ('human', 'llm')),
  created_at timestamptz default now()
);
alter table evaluations enable row level security;
create policy "users own their evaluations"
  on evaluations for all using (auth.uid() = user_id);
```

**4. 개발 서버 실행**

```bash
npm run dev
```

## Vercel 배포

1. GitHub 저장소를 Vercel에 import
2. Vercel 대시보드 → Environment Variables에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 추가
3. Deploy

## 사용 방법

1. 회원가입 또는 로그인
2. **설정** 페이지에서 LLM 제공자(OpenAI/Anthropic)와 API 키 입력
3. **프롬프트 관리**에서 번역 프롬프트 버전 추가 (선택)
4. **번역** 페이지에서 언어와 프롬프트 버전을 선택하고 번역
5. **평가** 페이지에서 번역 이력을 선택하여 품질 평가
