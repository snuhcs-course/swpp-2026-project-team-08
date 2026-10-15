<!-- AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim -->

# AGENTS.md

이 저장소 전체에서 LLM(AI 코딩 도구)이 지켜야 할 규칙이다. 하위 프로젝트에 자기 `AGENTS.md`가 있으면
그 규칙도 함께 따른다.

## 하위 프로젝트

| 디렉터리 | 내용 | 규칙 |
|---|---|---|
| `client/` | Expo / React Native 모바일 앱 | [`client/AGENTS.md`](client/AGENTS.md) |
| `server/` | FastAPI + Postgres 백엔드 | [`server/AGENTS.md`](server/AGENTS.md) |

작업하는 디렉터리의 `AGENTS.md`와 그 안에서 안내하는 문서(`README.md`, `docs/`)를 먼저 읽는다.

## Git 작업

브랜치 · 커밋 · PR 규칙은 [`GIT_WORKFLOW.md`](GIT_WORKFLOW.md)를 따른다. `main`에 직접 push하지 않는다.

## AI 생성 코드 표기

LLM이 작성한 코드와 문서에는 아래 형식의 주석을 단다. 사람이 작성한 코드에는 달지 않는다.

```text
AI-generated with <Model Name>, <Date>, reviewed by <User Name>
```

- **파일 전체**를 LLM이 작성했으면 **파일 맨 위**에 단다.
- **코드 일부**만 작성했으면 **그 부분 바로 위**에 단다.
- `<Model Name>`은 실제 모델 이름(예: `Claude Sonnet 5.5`), `<Date>`는 `YYYY-MM-DD`,
  `<User Name>`은 그 코드를 리뷰한 사람이다. 리뷰어 이름을 모르면 추측하지 말고 사용자에게 묻는다.
- 주석 문법은 파일 형식을 따른다. 예: Python · TOML · YAML · `.ini`는 `#`, TypeScript는 `//`,
  Markdown은 `<!-- -->`.
- 기존 AI 표기가 있는 코드를 수정하면 날짜와 리뷰어를 갱신한다.
- 예전 표기(`This Code is generated with AI`)가 붙은 파일은 수정하지 않는 한 그대로 둔다. LLM이 그 파일을
  수정할 때는 위 형식으로 바꾼다.
