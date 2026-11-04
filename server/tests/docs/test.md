
<!-- AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung -->
<!-- Changed: 테스트 구조 정리 및 전용 서버 실행 도구 안내 제거 -->

# Backend 테스트 기준

목차: [테스트 분류](#1-테스트-분류) · [작성·수정·검증 순서](#2-작성수정검증-순서) · [공통 작성 규칙](#3-공통-작성-규칙) · [코드 분류와 역할별 가이드](#4-코드-분류와-역할별-가이드) · [공통 도구·Fixture](#5-공통-도구fixture)

## 1. 테스트 분류

### 폴더 구조

위치는 `server/tests/` 기준이다. 테스트 파일은 종류별 폴더에 `test_<기능>.py`로 둔다.

| 위치 | 내용 |
|---|---|
| `unit/` | DTO·순수 규칙·설정·보안 함수와 개별 서비스의 테스트 |
| `integration/` | HTTP·인증·서비스·DB 연결, 추천 그래프, 마이그레이션 적용 테스트 |
| `conftest.py` | 테스트별 DB·HTTP 클라이언트와 외부 호출 차단 설정 |
| `examples/unit/`·`examples/integration/` | 레이어별·시나리오별 테스트 작성 예시 |
| `e2e/` | 실행 중인 앱·서버를 통한 전체 사용자 흐름 검사 |
| `helpers/` | 로그인 준비와 가짜 LLM |
| `fixtures/` | 프로필·식사·리뷰 요청과 추천 응답 데이터 |
| `docs/test.md`·`docs/coverage.md` | 테스트 작성 기준과 커버리지 측정 기준 |

### 종류 구분

| 종류 | 확인할 것 | 예시 |
|---|---|---|
| Unit | 한 함수·모듈의 입력과 결과 | DTO 검증, 순수 업무 판단, 토큰 검증, 의존성을 대체한 서비스 검사 |
| Integration | 서로 다른 책임을 가진 실제 코드가 함께 만드는 결과 | HTTP → 인증 → 서비스 → DB, 그래프 → 생성 → 검증 → 재시도 |
| E2E | 실행 중인 시스템의 전체 사용자 흐름 | 앱에서 가입 → 식사 기록 → 기록 확인 |

비동기·HTTP 사용 여부가 아니라 실제로 연결하는 책임으로 구분한다. 서비스와 실제 DB를 연결하면 Integration이다.
마이그레이션 SQL 생성은 Unit, 격리된 DB에 적용해 데이터·제약을 확인하는 검사는 Integration이다.

## 2. 작성·수정·검증 순서

테스트 종류를 명시하지 않은 요청에는 Unit과 Integration을 모두 작성·수정한다.
실제 연결 지점이 없는 순수 함수 등 Integration 대상이 없으면 생략한다.

| 단계 | 수행 내용 | 참고 |
|---|---|---|
| 1. 테스트 대상과 종류 결정 | 변경한 코드의 역할과 연결할 실제 모듈을 정한다. | [테스트 분류](#1-테스트-분류), [코드 분류 기준](#코드-분류-기준) |
| 2. 테스트 케이스 선정 | 정상·오류·경계값, 권한, 실패 후 보존·복구 결과를 정한다. | [공통 작성 규칙](#3-공통-작성-규칙), [역할별 가이드](#역할별-테스트-가이드) |
| 3. 테스트 작성 | 관련 기능 파일에 사례를 추가하고 공통 도구·fixture로 준비한다. | [공통 도구·Fixture](#5-공통-도구fixture) |
| 4. 확인 | 해당 파일을 개별 실행하고 전체 테스트·린트·포맷을 검사한다. | [검증](#검증) |

### 검증

실행 명령은 [README](../../README.md#검증)를 따른다. 개별 실행은 `server/`에서 `uv run pytest tests/<종류>/test_<기능>.py`로 수행한다.
실패·건너뜀·미실행 항목은 이유와 함께 기록한다. 권한 검사와 실패 후 데이터 보존을 확인하고, 테스트 개수·전체 커버리지 평균만으로 완료를 판단하지 않는다.

기본 API Integration은 테스트별 인메모리 SQLite와 HTTPX `ASGITransport`로 실행한다.
PostgreSQL 고유 제약·시간대·동시성·마이그레이션은 격리된 PostgreSQL에서 별도로 검증하고 사용한 DB를 명시한다.
DB 작업의 확인 절차는 [서버 작업 규칙](../../AGENTS.md#db에-영향을-주는-작업은-반드시-사용자-확인)을 따른다.

기본 테스트와 커버리지 실행은 예시를 제외한다. 예시만 실행할 때는 `server/`에서 `uv run pytest tests/examples`를 사용한다.

### 커버리지 측정

명령·측정 범위·계층 분류·보고서는 [coverage.py 커버리지](coverage.md)를 따른다.
커버리지 제외 여부와 별개로 실행 로직의 테스트 필요성을 판단한다.

## 3. 공통 작성 규칙

- 같은 기능의 관련 테스트는 한 파일에 둔다. 입력·기대값만 다르면 `pytest.mark.parametrize`로 묶고, 행동 순서가 다르면 별도 테스트로 작성한다.
- 테스트 이름과 parameter의 `id`는 한글로 조건·기대 결과를 설명한다. 예: `test_저장_실패_시_기존_기록을_유지한다`.
- 준비 → 실행 → 검증 순서로 쓰고 기대값을 직접 적는다. 반복 준비만 helper로 추출하고 행동과 핵심 검증은 본문에 남긴다.
- Unit은 대상 밖의 의존성을 `monkeypatch`·`Mock`·`AsyncMock`으로 대체한다. Integration은 연결할 앱 코드를 실제로 실행하며 외부 서비스만 대체한다. 저장 실패 검사는 실패 지점만 주입하고 실제 rollback 결과를 확인한다.
- DB·의존성 override·mock은 테스트마다 격리하고 종료 시 복원한다. 비동기 작업은 완료를 기다리며, 시간·난수·응답 순서는 테스트에서 제어한다.
- LLM 테스트는 [ScriptedChatModel](../helpers/fake_chat_model.py)로 응답을 제어하고 실제 그래프를 실행한다. 실제 LLM 호출과 추천 품질 평가는 테스트하지 않는다.

입력값은 해당 코드의 계약에 맞춰 다음처럼 고른다.

| 입력 | 선택할 사례 |
|---|---|
| 숫자·ID | 최솟값·최댓값·중간값, 바로 바깥 값, 음수·0, 소수·boolean·문자열의 허용 여부 |
| 문자열 | 빈 문자열·공백만·앞뒤 공백·한글, 길이의 양 끝과 초과, 대소문자·정규화·중복 |
| 목록·선택지 | 빈 목록·단일·복수·중복, 허용된 선택지·없는 값·상충 조합 |
| 필드·시간 | 누락·`None`·잘못된 타입, 날짜 경계·시간대·토큰 만료 전후 |
| 소유권·참조 | 본인·다른 사용자·없는 ID, 인증 없음·잘못된 토큰, 삭제된 참조 |

## 4. 코드 분류와 역할별 가이드

### 코드 분류 기준

파일 경로와 실제 책임을 함께 확인한다. 예를 들어 `router.py` 안의 DTO 검사는 Schemas 역할이며, Others로 집계되는 파일도 실제 동작에 맞춰 검사한다.

| 분류 | 판단 기준 | 대표 위치 |
|---|---|---|
| HTTP API | 경로·인증 의존성·상태 코드·HTTP 오류 변환 | `main.py`, `api/`, 기능별 `router.py`·`dependencies.py` |
| Schemas and serialization | 요청·응답 검증, 데이터 구조와 응답 변환 | 기능별 DTO·`input_dto.py`·`serialization.py`, 라우터 안의 DTO |
| Services and rules | 업무 처리 순서·권한·순수 검증·판단 | 기능별 `service.py`·`validation.py` |
| Recommendation workflow | 추천 그래프·노드·도구·재시도·생성 결과 연결 | `generator.py`, `workflow/` |
| Database and persistence | 테이블·제약·조회·저장·트랜잭션 | `models/`, `core/database.py`, 조회 함수, `migrations/` |
| Core and security | 설정·시각·공통 오류·비밀번호·토큰·인증 코드 | `core/`, 인증 기능의 `security.py`·`codes.py` |
| Others | 위 책임으로 바로 구분하기 어려운 혼합 코드 | 파일 안의 계산·조회·변환을 각각 해당 역할로 검사 |

### 역할별 테스트 가이드

예시는 테스트 작성 형식을 보여줄 뿐이며, 해당 기능에 예시의 테스트 케이스만 있으면 된다는 뜻은 아니다.
대상 기능의 요구사항에 따라 필요한 테스트 케이스를 추가한다.

| 역할 | 확인할 동작 | 참고 테스트 |
|---|---|---|
| HTTP API | 상태 코드·본문·`error_code`·`details`, 인증 거부, 민감 필드 제외·OpenAPI 계약 | [인증 의존성](../examples/unit/test_http_api_example.py) |
| Schemas and serialization | 허용·경계·잘못된 타입, 정규화, 필드 누락·중복·응답 변환 | [DTO 입력값](../examples/unit/test_schemas_example.py) |
| Services and rules | 업무 오류·소유권·중복 처리, 실패 시 기존 데이터 보존 | [순수 검증](../examples/unit/test_rules_example.py) |
| Recommendation workflow | 사용 가능한 재료 목록 전달, 검증 실패 후 피드백·재시도, 횟수 소진 시 오류·저장 방지 | [재시도 분기](../examples/unit/test_workflow_example.py) |
| Database and persistence | 새 세션의 저장 결과, 부분 저장 방지, 연결·삭제 제약, 마이그레이션의 데이터 보존 | [트랜잭션 제어](../examples/unit/test_database_example.py) |
| Core and security | 설정 오류·시간대, 토큰 종류·만료·위조, 비밀번호 확인 | [비밀번호·토큰 만료](../examples/unit/test_security_example.py) |
| Others | 재료 정규화·제한 판단과 DB 조회·생성을 구분 | [재료 정규화](../unit/test_suggestion_ingredients.py) |

| Integration 예시 | 확인할 작성 방식 |
|---|---|
| [프로필 저장·권한·복구](../examples/integration/test_profile_example.py) | 실제 API·DB, 잘못된 입력·중복 저장·소유권, 실패 주입·재조회·복구 |
| [추천 생성·재시도·소진](../examples/integration/test_generation_example.py) | 실제 그래프, 가짜 LLM, 마지막 재시도 성공·소진·제한 재료 제외 |

Integration은 성공·실패·재시도·소유권을 나눠 작성한다. 요청 실패 후에는 응답만 확인하지 않고 다시 조회해 기존 데이터와 관련 레코드가 보존되는지 검사해야 한다.

## 5. 공통 도구·Fixture

실행 환경은 `conftest.py`, 로그인·가짜 LLM은 `helpers/`에서 제공한다. 데이터 생성 함수의 실제 위치는 Fixture 표를 따른다.
Unit·Integration별 도구 폴더는 따로 만들지 않는다. 아래 위치는 `server/` 기준이다.

### 공통 도구

| 위치 | 이름 | 역할 |
|---|---|---|
| `tests/conftest.py` | `api_client` | FastAPI 앱에 HTTP 요청을 보내고 응답을 받는 테스트용 클라이언트 |
| `tests/conftest.py` | `session_factory` | 호출할 때마다 테스트 DB에 연결된 새 세션을 만듦 |
| `tests/conftest.py` | `forbid_live_llm` | 모든 테스트에 자동 적용하여 앱의 LLM 생성 함수를 호출하면 오류를 발생시킴 |
| `tests/helpers/auth.py` | `auth_headers` | 가입·로그인 API를 호출하고 액세스 토큰이 담긴 인증 헤더를 반환 |
| `tests/helpers/fake_chat_model.py` | `ScriptedChatModel` | 지정한 구조화 응답을 순서대로 반환하고, 추천 초안 생성에 전달된 메시지를 기록하는 가짜 모델 |
| `tests/helpers/suggestions.py` | `install_model` | `batches`를 순서대로 반환하는 가짜 모델을 만들고 앱의 LLM 생성 함수를 교체한 뒤 모델을 반환 |

식사·리뷰 생성은 공통 요청 데이터를 사용해 테스트 본문에서 직접 호출한다.
시간 고정·저장 실패 주입은 필요한 테스트에 작성하고, 같은 준비가 여러 파일에서 반복되면 helper로 추출한다.
마이그레이션 준비는 해당 테스트 안에서 정리한다. 검사할 행동과 기대 결과는 테스트 본문에 둔다.

### Fixture

데이터 생성 함수는 요청을 전송하거나 DB에 저장하지 않고 정상 입력·응답 데이터만 만든다.
호출마다 독립된 객체·목록을 반환하며, 테스트가 직접 호출한다.

| 위치 | 이름 | 역할 |
|---|---|---|
| `tests/fixtures/onboarding.py` | `request_body` | 프로필·식이 제한·안전 음식·동의 요청 본문을 반환한다. |
| `tests/helpers/suggestions.py` | `suggestion_draft(food_id, serving_tip=...)` | 음식 ID와 제공 문구를 넣은 단일 `SuggestionDraft`를 반환한다. |
| `tests/helpers/suggestions.py` | `batch(*food_ids)` | 음식 ID마다 `suggestion_draft`를 호출하고 결과 목록을 담은 `SuggestionsDraft`를 반환한다. |
| `tests/fixtures/meals.py` | `meal_payload`, `food_payload` | 식사 요청 본문과 그 안에 넣을 음식 데이터를 반환한다. |
| `tests/fixtures/reviews.py` | `review_payload` | 음식 ID·식후 결과·어려워한 이유를 담은 리뷰 요청 본문을 반환한다. |
