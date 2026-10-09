<!-- This Code is generated with AI -->

# Git Workflow — Frontend (React Native) / Backend (FastAPI)

## Branch / PR rule

- 기본 브랜치는 `main` 하나만 사용한다. 모든 작업 브랜치는 최신 `main`에서 만들고, `main`에 직접 push하지 않는다.
- 작업 브랜치는 `<type>/<short-name>`으로 만든다. 예: `feat/meal-checkin`, `fix/photo-upload`, `docs/git-workflow`, `chore/update-deps`.
- 브랜치의 `type`은 `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `hotfix` 중 하나를 쓴다. 한 브랜치/PR은 검토 가능한 하나의 변경을 다룬다. Frontend와 Backend를 함께 바꿔야 한 기능은 하나의 PR에 담을 수 있다.
- 작업 중에는 Draft PR을 사용할 수 있다. 리뷰 요청 전 PR 템플릿을 채운다.

## Commit convention

```text
<type>: <변경 내용>

feat: add meal check-in screen
fix: reject invalid photo upload
docs: define git workflow
```

- `type`: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `build`, `perf`, `revert`.
- 제목은 변경 내용을 짧고 구체적으로 쓴다. PR 제목에도 같은 형식을 적용한다.
- 작업 중에는 여러 커밋을 자유롭게 만들되, 최종적으로 PR 제목을 Squash merge 커밋 제목으로 사용한다.

## PR template

PR을 작성할 때 [PR 템플릿](.github/pull_request_template.md)을 사용한다.

## Review / merge rule

- 모든 PR은 작성자 외 1명의 승인을 받으면 머지할 수 있다. 미해결 리뷰 대화를 정리하고, 필수 CI가 통과해야 한다.
- 리뷰 이후 새 커밋으로 동작이 바뀌면 다시 승인을 받는다. 작성자는 자신의 PR을 승인하지 않는다.
- 머지는 **Squash merge**만 사용한다. PR 제목을 최종 커밋 메시지로 확인하고, 머지 후 작업 브랜치를 삭제한다.
