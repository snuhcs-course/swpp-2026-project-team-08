<!-- AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim -->
<!-- Changed: 서버 초기 구성 -->
<!-- AI-generated with GPT-6, 2026-10-25, reviewed by Haechan Jung -->
<!-- Changed: AI 주석 규칙 정리 -->

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

LLM이 작성하거나 수정한 코드와 문서에는 파일 최상단에 아래 형식으로 이력을 남긴다.
사람이 작성한 코드에는 AI 표기를 달지 않는다. 파일 전체 작성과 일부 수정에 같은 규칙을 적용한다.

```text
AI-generated with <Model Name>, <Date>, reviewed by <User Name>
Changed: <짧은 작업 제목>
```

- 두 줄을 한 묶음으로 기록한다. `Changed:`에는 작업 내용을 짧고 간결하게 쓴다. 새 파일은 작성한 작업을 적는다.
- 새 기록을 추가하기 전에 파일 최상단 이력의 마지막(가장 아래) 묶음과 현재 작업을 비교한다.
  목적과 수정 대상이 큰 틀에서 같으면 같은 작업으로 본다. 생성 직후 오류 수정·검증 보완도 여기에 포함한다.
- 같은 작업이면 새 묶음을 추가하지 않는다. 날짜가 같으면 기존 묶음을 그대로 두고,
  날짜가 다르면 마지막 묶음의 날짜만 현재 날짜로 바꾼다. 모델명·리뷰어·`Changed:`는 그대로 둔다.
- 목적이나 수정 대상이 달라 별도 작업이면 기존 이력 아래에 새 묶음을 시간순으로 추가한다.
  위의 날짜 변경 외에는 기존 이력의 내용·날짜·리뷰어를 지우거나 덮어쓰지 않는다.
- 코드 본문이나 수정 부분 바로 위에는 AI 이력 주석을 추가하지 않는다.
- 본문에 흩어진 기존 AI 이력은 해당 파일을 수정할 때 내용을 그대로 보존해 최상단으로 모은다.
  예전 표기(`This Code is generated with AI`)도 보존한다. 작업 내용을 알 수 없는 예전 기록만 있으면
  새 형식의 이력을 추가한다.
  수정하지 않는 파일의 표기는 그대로 둔다.
- `<Model Name>`은 실제 모델 이름(예: `Claude Sonnet 5.5`), `<Date>`는 `YYYY-MM-DD`,
  `<User Name>`은 그 코드를 리뷰한 사람이다. 리뷰어 이름을 모르면 추측하지 말고 사용자에게 묻는다.
- 주석 문법은 파일 형식을 따른다. 예: Python · TOML · YAML · `.ini`는 `#`, TypeScript는 `//`,
  Markdown은 `<!-- -->`를 각 줄에 붙인다.
- 각 주석 줄은 주석 기호와 공백을 포함해 100자 이내로 쓴다. 파일의 제한이 더 짧으면 그 제한을 따른다.
  수정 내용은 짧게 쓰고, 길면 다음 주석 줄로 나눈다. 모델명·날짜·리뷰어도 길면 줄을 나누되 생략하지 않는다.
- shebang·인코딩 선언처럼 위치가 정해진 필수 줄이 있으면 그 뒤에 AI 이력을 둔다.
