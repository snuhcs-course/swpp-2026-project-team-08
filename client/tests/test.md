<!-- AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo -->
<!-- Changed: 누락 없는 테스트 실행 범위 및 API 통합 검사 -->

# Frontend 테스트 기준

목차: [테스트 분류](#1-테스트-분류) · [작성·수정·검증 순서](#2-작성수정검증-순서) · [공통 작성 규칙](#3-공통-작성-규칙) · [코드 분류와 역할별 가이드](#4-코드-분류와-역할별-가이드) · [공통 도구·Fixture](#5-공통-도구fixture)

## 1. 테스트 분류

### 폴더 구조

위치는 `client/tests/` 기준이다.

| 위치 | 내용 |
|---|---|
| `unit/` | 규칙·날짜·입력 검증, API 변환, 저장소, UI 컴포넌트의 Unit 테스트 |
| `integration/` | 실제 React·Provider·Query·API·저장소를 연결한 통합 테스트 |
| `examples/unit/`·`examples/integration/` | 테스트 작성 시 따르는 레이어별·시나리오별 예시 |
| `e2e/` | 기기·시뮬레이터에서 실행하는 사용자 흐름과 기기 검사 시나리오 |
| `test.md`·`c8.md` | 테스트 작성 기준과 커버리지 측정 기준 |
| `helpers/` | TS 로더, React 실행 환경, 외부 모듈 대체 등 공통 실행 도구 |
| `fixtures/` | 테스트 입력과 서버 응답을 만드는 공통 데이터 factory |

`npm test`는 모든 테스트를 실행한다.
`Unit`, `Integration`, `E2E` 테스트는 책임으로 구분한다.

## 2. 작성·수정·검증 순서

**테스트 종류를 명시하지 않은 요청에는 Unit과 Integration을 모두 작성·수정한다.**
실제 연결 지점이 없는 순수 함수 등 Integration 대상이 없으면 생략한다.

| 단계 | 수행 내용 | 참고 |
|---|---|---|
| 1. 테스트 대상과 종류 결정 | 레이어와 테스트 종류를 정한다. | [테스트 분류](#1-테스트-분류), [코드 분류 기준](#코드-분류-기준) |
| 2. 테스트 케이스 선정 | 바뀐 동작과 정상·오류·경계값을 정한다. | [공통 작성 규칙](#3-공통-작성-규칙), [역할별 가이드](#역할별-테스트-가이드) |
| 3. 테스트 작성 | 필요한 도구·fixture를 선택하고 테스트 케이스를 작성한다. | [역할별 예시](#역할별-테스트-가이드), [공통 도구·Fixture](#5-공통-도구fixture) |
| 4. 확인 | 해당 파일을 먼저 실행하고 전체 테스트·린트·타입 검사를 실행한다. | [검증](#검증) |

### 검증

변경한 테스트를 개별 실행한 뒤 전체 테스트·린트·타입 검사를 수행한다. 실행 명령은 [README](../README.md#검증), 커버리지 해석은 [c8](c8.md)을 따른다.
실패·건너뜀·미실행 항목은 이유와 함께 기록하고, 기기 입력·권한·화면 배치는 실제 기기나 시뮬레이터에서 확인한다.

예시는 `client/`에서 다음 명령으로 실행한다.

```sh
node --test tests/examples/unit/*.test.cjs tests/examples/integration/*.test.cjs
```

## 3. 공통 작성 규칙

[역할별 예시](#역할별-테스트-가이드)의 준비·실행·검증, mock, fixture·helper 사용 방식을 따른다.

- 같은 기능의 관련 테스트는 한 파일에 둔다. 입력·기대값만 다르면 케이스 배열과 `for`문으로 묶고, 행동 순서가 다르면 별도 `test`로 작성한다.
- 예시의 입력값을 그대로 복사하지 않고 대상 코드의 정상·오류·경계값을 고른다. 기대값은 검사 대상 함수로 계산하지 않는다.
- 반복되는 준비만 helper로 추출하고, 행동과 핵심 검증은 테스트 본문에 남긴다.

## 4. 코드 분류와 역할별 가이드

### 코드 분류 기준

파일 경로와 실제 책임을 함께 확인한다. 커버리지는 파일 단위로 분류하고, 테스트는 검사할 동작 단위로 설계한다.
여러 책임이 섞인 파일은 동작별로 검사를 나눈다.

| 분류 | 판단 기준 | 예시·주의점 |
|---|---|---|
| UI and routes | 화면 표시, 입력·클릭 처리, 라우트 연결 | `app/`, `components/`, 기능별 `screens/`·`components/`; 단순 표시 상태는 UI, 업무 판단은 Rules, 작업 흐름은 Hook으로 나눈다. |
| Hooks and Providers | React 생명주기, 공유 상태, 복원·비동기 상태 전환 | 기능별 `hooks/`, `providers/`, `*Provider.ts(x)`, `*Context.ts(x)`. |
| Data — API·network·DTO | 요청 구성, 응답 변환, 인증·오류 처리 | `data/api/`, `data/network/`, `data/dto/`. |
| Data — storage·device | 저장·복원·직렬화, 기기 기능 접근 | `data/storage/`, `data/device/`. |
| Data — Query | 조회·mutation·캐시 갱신 | `data/queries/`; Hook 형태여도 Data로 분류한다. |
| Rules | React·API·Storage에 의존하지 않는 업무 검증·변환·판단 | `rules/`, 기능별 `rules.ts` 및 역할별 순수 규칙 파일. |
| Utilities | 특정 기능에 속하지 않는 공통 계산 | `util/date.ts`; 표시용 리소스와 구분한다. |
| 타입·리소스 | 타입 선언, 문자열·색상·폰트 | 커버리지 제외 여부와 별개로 실행 함수는 해당 책임에 맞춰 테스트한다. |

### 역할별 테스트 가이드

Unit은 다음 예시에서 대상 레이어의 작성 방식을 따른다.

| 레이어 | 참고 예시 | 확인할 작성 방식 |
|---|---|---|
| UI and routes | [ui.test.cjs](examples/unit/ui.test.cjs) | RN 요소 대체, props·접근성·콜백 검사 |
| Hooks and Providers | [hook.test.cjs](examples/unit/hook.test.cjs) | 초안 fixture, 실제 React 상태 변경, 날짜 경계값 |
| Data — API·network·DTO | [auth-api.test.cjs](examples/unit/auth-api.test.cjs) | 인증 fixture, 요청 함수 mock, 정상·잘못된 응답·실패 사례 표 |
| Data — storage·device | [storage.test.cjs](examples/unit/storage.test.cjs) | 세션 fixture, 기기 저장소 대체, 저장 결과·정리 |
| Data — Query | [query.test.cjs](examples/unit/query.test.cjs) | API mock, 실제 Query 오류 상태·조회 비활성 조건 |
| Rules | [rules.test.cjs](examples/unit/rules.test.cjs) | 빈 문자열·공백·중복 입력과 기대값을 사례 표로 구성 |
| Utilities | [utilities.test.cjs](examples/unit/utilities.test.cjs) | 범위의 양 끝·바로 바깥 값·잘못된 형식과 타입 |

Integration은 연결할 책임과 시나리오에 맞는 예시를 따른다. 실제 앱 모듈을 연결하고 HTTP·기기 경계를 대체한다.

| 시나리오 | 참고 예시 | 확인할 작성 방식 |
|---|---|---|
| 조회와 응답 변환 | [meal-query.test.cjs](examples/integration/meal-query.test.cjs) | 서버 응답 fixture → HTTP mock → 실제 API·Query 결과 |
| 저장·실패·재시도·재조회 복구 | [meal-saving.test.cjs](examples/integration/meal-saving.test.cjs) | 공통 준비 helper와 4개 독립 테스트, 실제 목록·초안·저장 결과 검증 |
| 계정 전환과 늦은 응답 | [account-switch.test.cjs](examples/integration/account-switch.test.cjs) | 인증·프로필 fixture, 실제 Provider, `deferred`로 응답 순서 제어 |

예시는 작성 구조의 기준이다. 실제 기능별 요구사항은 테스트 작성 시에 검증한다.

## 5. 공통 도구·Fixture

### 공통 도구

위치는 `client/` 기준이다. 사용 방법은 [역할별 예시](#역할별-테스트-가이드)를 따른다.

| 위치 | 이름 | 역할 |
|---|---|---|
| `tests/helpers/register.cjs` | TS 로더 | TS·TSX를 JavaScript로 변환하고 소스맵을 제공한다. |
| `tests/helpers/mock-modules.cjs` | 모듈 mock | 외부 모듈을 대체하고 원래 로더를 복원한다. |
| `tests/helpers/memory-storage.cjs` | 메모리 저장소 | 저장·조회·삭제와 저장소 오류를 메모리에서 재현한다. |
| `tests/helpers/native-boundaries.cjs` | Native 경계 설정 | 저장소·SecureStore·기기 설정과 native 대체 객체를 연결한다. |
| `tests/helpers/react-harness.cjs` | Hook 실행 환경 | 실제 Hook·Provider·Query를 실행하고 상태 변경·비동기 완료를 제어한다. |
| `tests/helpers/http.cjs` | HTTP mock | 요청별 응답·오류를 지정하고 호출을 기록한다. |
| `tests/helpers/native-ui.cjs` | Native UI 대체 | RN 뷰·Platform·SafeArea·아이콘을 테스트용 객체로 제공한다. |
| `tests/helpers/ui-harness.cjs` | UI 실행 환경 | 컴포넌트를 렌더링하고 요소 조회·입력·누름을 수행한다. |
| `tests/helpers/native-controls.cjs` | Native 동작 제어 | 애니메이션·focus·sheet 전환을 제어하고 화면 이동 호출을 기록한다. |
| `tests/helpers/device-controls.cjs` | 기기 기능 제어 | 사진·문서 선택과 파일 접근의 권한·성공·취소·실패를 재현한다. |
| `tests/helpers/assets.cjs` | 이미지 로더 | SVG·PNG import를 테스트용 값으로 바꾸고 복원한다. |
| `tests/helpers/provider-wrappers.cjs` | Provider 조합 | 검사에 필요한 실제 Provider들을 선택해 구성한다. |
### Fixture

위치는 `client/` 기준이다. 각 factory는 고정 날짜·ID를 기본값으로 사용하고 호출마다 독립된 객체·배열을 반환한다.

| 위치 | 이름 | 역할 |
|---|---|---|
| `tests/fixtures/account-profile.cjs` | 프로필 응답 | 서버의 프로필·동의 응답을 만든다. |
| `tests/fixtures/meal-checkin.cjs` | 식사 초안 | 저장 전 식사·음식·재료 입력을 만든다. |
| `tests/fixtures/after-meal-review.cjs` | 식후 기록 | 저장된 식사와 식후 검사 입력을 만든다. |
| `tests/fixtures/server-meal.cjs` | 식사 API 응답 | HTTP 대체용 식사·리뷰 응답을 만든다. |
| `tests/fixtures/auth.cjs` | 인증 데이터 | 로그인 입력과 앱 세션을 만든다. |
| `tests/fixtures/onboarding.cjs` | 온보딩 데이터 | 유효한 온보딩 초안과 앱 프로필을 만든다. |
| `tests/fixtures/suggestions.cjs` | 추천 데이터 | 서버 추천 응답과 앱 추천 객체를 만든다. |
| `tests/fixtures/photos.cjs` | 사진 데이터 | 앱 사진과 picker 반환 데이터를 만든다. |

