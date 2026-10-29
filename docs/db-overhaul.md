<!-- AI-generated with Claude Sonnet 5.5, 2026-10-30, reviewed by Jaemin Kim -->
<!-- Changed: DB 스키마 전면 개편 계획서 -->

# DB 스키마 전면 개편 계획

> 이 문서는 여러 대화(세션)에 걸쳐 진행되는 개편 작업의 단일 기준이다.
> 새 세션은 이 문서를 먼저 읽고, 3절의 진행 상태에서 이어간다.

## 1. 원칙

### 1.1 역할 분담과 범위

- 스키마(ORM 모델 + Alembic 마이그레이션)를 먼저 확정하고 구현한다.
- 이 문서의 작업 범위는 **ORM 모델과 마이그레이션까지**다.
- 서비스, 라우터, 테스트 등 모델을 사용하는 코드의 수정은 각 담당자가 확정된 스키마에 맞춰 진행한다.
- 스키마 작업 중 앱 코드는 깨진 상태가 되므로, 장기 통합 브랜치 `refactor/db-migration-1030`에서 작업한다.
  스키마 PR과 팀원의 코드 수정 PR은 모두 이 브랜치로 머지하고, 전체가 끝나 테스트·린트가 통과하면
  이 브랜치를 `main`에 머지한다 ([GIT_WORKFLOW.md](../GIT_WORKFLOW.md)).

### 1.2 진행 방식

- 계획(2절)을 모두 확정한 뒤에 실행한다. 실행 중 설계 판단이 필요하면 멈추고 4절(결정 기록)에 먼저 기록한다.
- 마이그레이션은 **테이블 묶음 단위**로 나눈다. PK/FK로 연결된 테이블은 같은 마이그레이션에 넣는다.
- 묶음은 FK 의존 순서(부모 → 자식)로 진행한다.
- 모든 묶음을 끝낸 뒤 팀원에게 한꺼번에 넘긴다.

### 1.3 테이블 규칙

- 모든 테이블에 `created_at`, `updated_at`을 둔다 (`DateTime(timezone=True)`, `default=now_kst`, `updated_at`은 `onupdate=now_kst`).
- 모든 `ForeignKey`는 `onupdate="CASCADE", ondelete="CASCADE"`를 지정한다.
- 정수 PK는 기존 방식을 따른다: `BigInteger().with_variant(Integer, "sqlite")` + `Identity()`.
- ORM 코드의 주석과 docstring은 한국어로 쓴다.

### 1.4 마이그레이션 규칙

- 파일명은 `YYYYMMDD_HHMM_<이름>.py`, revision id는 `00NN_<이름>`이며, 최신 revision 뒤에 이어 붙인다
  (현재 최신: `0017_meal_ingredients`, 다음은 `0018`).
- 컬럼을 삭제하거나 구조를 바꾸는 경우, 기존 데이터를 새 구조로 이관한 뒤 삭제한다.
  이관할 수 없는 데이터는 폐기하며, 그 사실을 해당 묶음의 "이관 규칙"에 적는다.
- `downgrade()`를 반드시 작성한다. 폐기한 데이터는 복구되지 않는다는 점을 명시한다.
- SQLite 호환을 위해 컬럼 변경은 batch 모드를 사용한다.
- 묶음마다 다음 세 가지만 검증한다: `upgrade`, `downgrade`, 빈 DB에서 `upgrade head`.
- `alembic upgrade`/`downgrade`는 DB를 바꾸므로 실행 전에 매번 사용자에게 확인받는다
  ([server/AGENTS.md](../server/AGENTS.md)). 마이그레이션 파일 생성과 `upgrade head --sql` 출력은 확인 없이 할 수 있다.

### 1.5 인수인계 규칙

- 묶음마다 "깨지는 지점"을 기록한다: 삭제/이름 변경/타입 변경된 컬럼·테이블·관계, 새로 생긴 모델,
  그리고 이를 사용하던 파일과 함수. 팀원이 코드를 고칠 때의 체크리스트로 쓴다.
- `swpp-2026-project-team-08.wiki/Design-Documentation.md`의 스키마 표는 모든 묶음이 끝난 뒤 한 번에 갱신한다.
- 이 문서는 작업용 계획서이므로 개편이 끝나면 삭제한다 ([AGENTS.md](../AGENTS.md)).
  삭제 전에 계속 필요한 결정과 규칙은 `server/docs/architecture.md` 등 정식 문서로 옮긴다.

## 2. 묶음별 계획

묶음 번호는 진행 순서(FK 의존 순서)다. 아래 묶음 외의 테이블은 변경 내용이 확정되면 추가한다.

### 2.1 User: 이메일 변경 시도 분리

**대상 테이블:** `users`(컬럼 삭제), `user_email_change_attempts`(신규)

**마이그레이션:** 파일 `20261030_1000_user_email_change_attempts.py`,
revision `0018_user_email_change_attempts`, down_revision `0017_meal_ingredients`

#### 목표 스키마

`users`: `pending_email`, `email_change_code_hash`, `email_change_expires_at` 삭제. 나머지 컬럼은 그대로다.

`user_email_change_attempts` (모델 `UserEmailChangeAttempt`, 파일 `app/models/user_email_change_attempt.py`)

| 컬럼 | 타입 | 제약 |
|---|---|---|
| `user_id` | BigInteger (sqlite는 Integer) | PK, FK → `users.id` (`onupdate="CASCADE", ondelete="CASCADE"`) |
| `new_email` | String(255) | NOT NULL |
| `code_hash` | String(255) | NOT NULL |
| `expires_at` | DateTime(timezone=True) | NOT NULL |
| `created_at` | DateTime(timezone=True) | NOT NULL, `default=now_kst` |
| `updated_at` | DateTime(timezone=True) | NOT NULL, `default=now_kst`, `onupdate=now_kst` |

- 사용자당 진행 중인 시도는 하나다. `user_id`가 PK이므로 새 요청은 기존 행을 덮어쓰고(upsert), 확인에 성공하면 행을 삭제한다.
- `user_id`는 자동 증가하지 않으므로 `Identity()`를 쓰지 않는다.
- `new_email`은 유니크가 아니다. 여러 사용자가 같은 주소로 변경을 요청할 수 있고, 중복은 확인 시점에 `users.email`로 검사한다.
- 새 모델은 `app/models/__init__.py`에 등록한다.

#### 컬럼 매핑

| 기존 (`users`) | 신규 (`user_email_change_attempts`) |
|---|---|
| `pending_email` | `new_email` |
| `email_change_code_hash` | `code_hash` |
| `email_change_expires_at` | `expires_at` |
| `id` | `user_id` |

#### 이관 규칙

- upgrade: 세 컬럼이 모두 NOT NULL이고 `expires_at`이 마이그레이션 실행 시각보다 뒤인 행만 새 테이블로 옮긴다.
  `code_hash`는 해시 그대로 복사한다. `created_at`, `updated_at`은 실행 시각으로 채운다. 그 외(만료됐거나 일부만 채워진 행)는 폐기한다.
  이관 뒤 `users`의 세 컬럼을 삭제한다.
- downgrade: 세 컬럼을 nullable로 다시 만들고, 만료되지 않은 시도를 되돌려 복사한 뒤 새 테이블을 삭제한다. 만료된 시도는 복구되지 않는다.

#### 깨지는 지점

- `User.pending_email`, `User.email_change_code_hash`, `User.email_change_expires_at` 삭제
  - `app/features/auth/service.py`의 `request_email_change`, `confirm_email_change`: `UserEmailChangeAttempt`의 upsert, 조회, 삭제로 바꾼다. 요청/확인의 동작과 에러는 그대로다.
- `app/features/auth/queries.py`의 `delete_user_owned_rows`: 계정 삭제 시 테이블을 직접 열거해 지우므로 `UserEmailChangeAttempt` 삭제를 추가한다.
- `tests/unit/test_remove_exposure_migration.py`: head를 `0017_meal_ingredients`로 고정하는 단언을 새 head로 바꾼다. 이후 묶음마다 같은 단언을 갱신한다.
- 영향 없음: `auth/router.py`의 DTO와 엔드포인트(응답 모양 불변), `tests/integration/test_auth.py`의 이메일 변경 테스트(동작 불변이라 그대로 통과해야 한다).
- 과거 마이그레이션(`20261018_2100_user_email_change.py`, `20261021_1000_bigint_user_ids.py`)은 수정하지 않는다.

## 3. 진행 상태

(작성 예정)

## 4. 결정 기록

(작성 예정)
