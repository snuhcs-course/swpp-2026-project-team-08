<!-- AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung -->
<!-- AI-generated with Claude Sonnet 5.5, 2026-10-28, reviewed by Jaemin Kim -->
<!-- Changed: remove tool-call wording after the tool node was removed -->

# Backend 테스트 기준

## 종류 구분

| 종류 | 확인할 것 | 예시 |
| --- | --- | --- |
| Unit | 한 함수·모듈의 입력과 결과 | DTO 검증, 생성 결과 검증, 토큰·비밀번호 처리 |
| Integration | 서로 다른 책임을 가진 실제 코드가 함께 만드는 결과 | HTTP 요청 → 인증 → 서비스 → DB 저장·조회, 추천 그래프의 생성 → 검증 → 재시도 |
| E2E | 실행 중인 시스템을 통한 전체 사용자 흐름 | 실제 앱에서 가입 → 식사 기록 → 기록 확인 |

**파일 개수, 비동기 여부, HTTP 호출 여부만으로 분류하지 않는다.** 실제 코드로 연결해 확인하는 책임으로 판단한다. 서비스 하나를 실행하면서 의존성을 모두 대체하면 Unit이고, 실제 서비스와 DB를 함께 확인하면 Integration이다.
Unit은 `tests/unit/`, Integration은 `tests/integration/`에 둔다. 공통 준비 함수는 `tests/helpers/`, 독립적인 요청 데이터는 `tests/fixtures/`에 둔다.
오프라인 마이그레이션 SQL 생성 검사는 Unit, 실제 테스트 DB에 적용해 결과를 확인하는 검사는 Integration이다.

## 공통 작성 규칙

1. 테스트 이름은 **조건과 기대 결과**를 설명한다. 예: `test_failed_write_preserves_previous_record`.
2. 한 테스트는 한 시나리오를 다룬다. 준비 → 실행 → 검증 순서로 쓰고, 관련 없는 기능은 나눈다.
3. 반환값, HTTP 응답, 저장 결과처럼 **관찰 가능한 동작**을 검사한다. 내부 호출 횟수는 중복 요청·재시도 제한처럼 요구사항에 해당할 때 검사한다.
4. 정상 동작뿐 아니라 필요한 오류·경계값을 고른다. 중복 데이터, 없는 ID, 권한 없는 접근, 저장 실패, 잘못된 생성 결과 등이 해당한다.
5. 각 테스트는 혼자 실행해도 통과해야 한다. DB·mock·의존성 override를 정리하고, 시간·난수·응답 순서가 결과에 영향을 주면 제어한다.
6. 반복 설정은 `conftest.py`의 fixture나 공통 helper로 모은다. 테스트마다 앱·DB·가짜 모델을 새 방식으로 구성하지 않는다.

## Unit Test

- 검사 대상을 하나 정하고 계산·변환·검증 결과를 확인한다. 대상 자체의 로직은 mock으로 바꾸지 않는다.
- **허용되는 입력 범위 안에서 다양한 값을 고른다.** 최솟값·최댓값·중간값, 선택지별 값과 의미 있는 조합을 포함한다. 범위 밖 입력의 거부·오류 처리도 검사한다.
- 같은 규칙에 여러 입력을 적용할 때는 `pytest.mark.parametrize`를 사용하고, 실패한 입력을 알아볼 수 있는 이름을 붙인다.
- DB·네트워크·LLM 등 대상 밖의 의존성은 대체한다. 예외는 타입과 필요한 속성을 검사한다. 서비스 에러의 HTTP 변환은 라우터 연결 테스트에서 확인한다.
- **예:** `find_problems()`에 입력·생성 결과를 전달해 오류 목록을 확인하는 검사는 Unit이다.

## Integration Test

- 무엇을 연결하는지 명시한다. 예: **라우터 → 인증 의존성 → 서비스 → ORM/DB**, **추천 그래프 → 검증 → 재시도**.
- 연결 대상은 실제 구현을 사용하고, mock은 그 연결 바깥의 외부 서비스로 제한한다. 서비스를 mock한 라우터 검사로 실제 DB 저장을 검증했다고 판단하지 않는다.
- API 검사는 상태 코드·응답 본문뿐 아니라 필요한 저장 결과를 확인한다. 오류 시 기존 데이터 유지, 부분 저장 방지, 다른 사용자의 데이터 접근 거부도 검사한다.
- 요청 DTO 오류와 서비스의 업무 규칙 오류를 구분한다. 계약에 정해진 `error_code`와 `details`, 응답에서 제외해야 할 민감한 필드를 검사한다.
- 기존 `client` fixture는 HTTPX `ASGITransport`로 앱을 직접 호출하며, `get_session`을 테스트별 인메모리 SQLite 세션으로 바꾼다. 별도 실행 서버·운영 DB·실제 계정이 필요하지 않다.
- **SQLite 통과는 Postgres 호환성을 보장하지 않는다.** DB 고유 제약·시간대·동시성·마이그레이션 동작은 해당 DB에서의 별도 검증 여부를 명시한다. 기존 DB에 마이그레이션을 적용하는 명령을 테스트 준비 절차로 사용하지 않는다.
- 실제 LLM API는 호출하지 않는다. `ScriptedChatModel`로 응답을 제어하고 실제 그래프를 실행한다. 정상 결과, 잘못된 결과의 재시도, 재시도 소진 후 실패를 검사한다. 이 검사는 실제 모델의 추천 품질 평가와 구분한다.

## 새 테스트 추가 순서

1. **조건 → 기대 결과**를 한 문장으로 적고 Unit 또는 Integration을 고른다.
2. 선택한 종류의 폴더에서 같은 기능의 `test_*.py`에 추가하거나 새 파일을 만든다. 한 파일에 두 종류를 섞지 않는다.
3. 파일 상단에 검사 대상 또는 연결한 모듈과 mock 범위를 짧게 적는다. 복잡한 테스트는 준비·실행·검증을 주석으로 구분한다.
4. 아래 fixture/helper를 재사용한다. `monkeypatch`로 바꾼 값은 자동 복원되게 하고, 직접 추가한 override·리소스는 fixture의 종료 처리로 복원한다.
5. 요구사항에 맞는 기대값을 명시한다. 기대값을 검사 대상 함수로 다시 계산하지 않는다. 회귀 테스트는 가능하면 수정 전 실패하는 사례로 작성한다.
6. 해당 파일을 먼저 실행한 뒤 전체 테스트와 lint를 실행한다. AI 표기는 저장소 `AGENTS.md`를 따른다.

### 공통 설정과 참고 코드

| 필요한 작업 | 사용할 도구·참고 파일 |
| --- | --- |
| API·서비스·DB 연결 | [`conftest.py`](integration/conftest.py)의 `client` fixture: 테스트별 SQLite 생성, `get_session` override, 세션 commit/rollback |
| 가입·로그인 | [`helpers/auth.py`](helpers/auth.py)의 `auth_headers` |
| 온보딩 요청 데이터 | [`fixtures/onboarding.py`](fixtures/onboarding.py)의 `request_body`: 호출마다 새 객체 |
| 추천 API의 가짜 LLM 설정 | [`helpers/suggestions.py`](helpers/suggestions.py)의 `install_model`: 생성 함수·그래프는 실제 구현 유지 |
| 외부 의존성 대체 | pytest의 `monkeypatch`, `unittest.mock`의 `Mock` / `AsyncMock` |
| LLM 응답 순서 제어 | [`fake_chat_model.py`](helpers/fake_chat_model.py)의 `ScriptedChatModel` |
| Unit 작성 예 | [`test_suggestion_validation.py`](unit/test_suggestion_validation.py): 입력과 생성 결과의 검증 |
| API Integration 작성 예 | [`test_auth.py`](integration/test_auth.py): 가입·로그인·인증과 DB 연결 |
| 그래프 Integration 작성 예 | [`test_suggestion_workflow.py`](integration/test_suggestion_workflow.py): 실제 그래프와 가짜 LLM 연결 |

## 실행과 검토

아래 명령은 모두 `server/`에서 실행한다. Python·의존성은 `pyproject.toml`과 `uv.lock`을 기준으로 준비한다.

```sh
uv sync
uv run pytest tests/unit/test_suggestion_validation.py
uv run pytest tests/unit
uv run pytest tests/integration
uv run pytest
uv run ruff check .
```

- 실패·건너뜀은 이유와 함께 보고한다. 실패한 테스트를 삭제하거나 검증을 약화해서 통과시키지 않는다.
- 커버리지는 테스트가 불러오지 않은 코드도 포함하고, 라우터·서비스·검증·데이터 접근 등 책임별로 확인한다. 대상·제외 범위와 목표를 먼저 정하며 임의의 수치 목표를 두지 않는다.
- 테스트 개수·전체 평균만으로 완료를 판단하지 않는다. 중요한 권한 검사·실패 복구가 빠졌는지 함께 검토한다.


### 커버리지 측정

`server/`에서 `uv run python scripts/coverage_report.py`를 실행한다. 이 명령은 Unit,
Integration, 전체 테스트를 각각 새 coverage 데이터로 실행하고 HTML·JSON 보고서를 생성한다.
통합 결과는 두 종류를 함께 실행한 결과이며, 두 퍼센트의 평균이 아니다.

- 대상: `app/**/*.py` 전체. 불러오지 않은 모듈과 `__init__.py` 없는 폴더도 포함한다.
- 제외: 대상 밖인 tests, scripts, migrations, 의존성, 생성 보고서. 앱 내부 실행 코드는 별도로 제외하지 않는다.
- Lines는 실행 가능한 문장 줄, Branches는 가능한 분기 경로를 기준으로 계산한다.
- Layer 분류는 아래 순서로 적용한다. 한 파일은 한 Layer에만 들어간다.

| Layer | 파일 기준 |
| --- | --- |
| Services and database | `service.py`, `queries.py`, `database.py`, `app/models/**` |
| Recommendation workflow | `generator.py`, `workflow/**` |
| API and authentication | `main.py`, `router.py`, `dependencies.py`, `security.py`, `app/api/**` |
| Validation and utilities | 나머지 파일: DTO, 순수 검증, 설정, 응답 변환, 상수 등 |

파일 단위 분류이므로 `auth/router.py` 안의 DTO도 API Layer로 집계된다. 파일별 상세 결과를 함께 확인한다.
스크립트는 모든 소스 파일의 포함 여부와 Layer별 합계가 전체 합계와 같은지 검증한다.
수치 목표는 아직 정하지 않았으며, 첫 결과는 기준선으로 기록한다.

보고서 위치:
- `coverage/{unit,integration,combined}/html/index.html`: 파일·줄·분기 상세
- `coverage/{unit,integration,combined}/coverage.json`: 원본 수치
- `coverage/layers.html`: 세 실행의 Layer별 결과와 상세 보고서 링크 (캡처용)
- `coverage/layers.json`: Layer별 집계와 각 파일의 소속
