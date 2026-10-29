<!-- AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung -->

<!-- AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo -->
<!-- Changed: 누락 없는 테스트 실행 범위 및 API 통합 검사 -->

# Frontend 테스트 기준

## 종류 구분

| 종류 | 확인할 것 | 예시 | 위치 |
| --- | --- | --- | --- |
| Unit | 한 함수·모듈·컴포넌트의 입력과 결과 | 잘못된 날짜 거부, API 요청 변환, 저장소 읽기·쓰기, 버튼의 콜백 전달 | `unit/` |
| Integration | 서로 다른 책임을 가진 실제 앱 코드가 함께 만드는 결과 | 저장 후 Query 캐시 갱신, 계정 전환 후 이전 데이터 제거, 초안 저장 후 다른 화면에서 복구 | `integration/` |
| E2E | 실행 중인 앱을 사용자가 조작하는 전체 흐름 | 앱에서 로그인 → 식사 기록 → 기록 확인 | 현재 자동 테스트 없음 |

**파일 개수, 비동기 여부, 서버 호출 여부만으로 분류하지 않는다.**
실제 코드로 연결해 확인하는 책임이 무엇인지로 판단한다. 보조 함수나 자식 컴포넌트를 함께 불러온다고 자동으로 Integration이 되지는 않는다.

## 공통 작성 규칙

1. 테스트 이름은 **조건과 기대 결과**를 설명한다. 예: `저장 실패 시 초안을 유지한다`.
2. 한 테스트는 한 시나리오를 다룬다. 준비 → 실행 → 결과 확인 순서로 쓰고, 관련 없는 기능은 나눈다.
3. 해당 기능에 필요한 정상·오류·경계값을 고른다. 빈 입력, 중복 요청, 저장 실패, 늦게 도착한 응답 등이 해당한다. 의미 없는 경우의 수를 억지로 추가하지 않는다.
4. 반환값, 표시 내용, 저장 결과, 캐시 등 **관찰 가능한 동작**을 확인한다. 내부 변수나 CSS 문자열에 불필요하게 의존하지 않는다. 요청 경로·본문처럼 외부와 약속한 형식은 직접 검사한다.
5. 각 테스트는 혼자 실행해도 통과해야 한다. 저장 데이터와 mock을 초기화하고, 변경한 전역 값은 복원한다. 시간·난수·응답 순서가 결과에 영향을 주면 테스트에서 제어한다.
6. 반복 설정은 `helpers/`, 공통 입력 데이터는 `fixtures/`를 사용한다. 테스트마다 TypeScript 로더나 모듈 mock 설치 코드를 새로 만들지 않는다.

## Unit Test

- 검사할 대상을 하나 정한다. 그 대상의 계산·변환·판단·표시 결과를 검사한다.
- **허용되는 입력 범위 안에서 다양한 값을 골라 검사한다.** 대표값 하나에 그치지 않고 최솟값·최댓값·그 사이의 값, 선택지별 값, 의미 있는 조합을 포함한다. 모든 조합을 나열하기보다 서로 다른 동작을 확인할 수 있는 값을 고른다. 범위를 벗어난 값의 거부·오류 처리 또한 검사한다.
- 네트워크·기기·실제 저장소는 mock 또는 메모리 저장소로 대체한다. 대상 자체의 로직은 대체하지 않는다.
- API 함수는 요청 형식과 응답 변환·오류 처리를 검사한다. 가짜 HTTP 응답을 사용한 검사는 실제 서버 연동을 검증한 것이 아니다.
- UI는 전달한 값에 따른 표시·활성 상태·콜백을 검사한다. 정적 HTML 검사는 실제 RN의 입력 동작이나 화면 이동을 보장하지 않는다.
- **예:** `authStorage`만 실행하고 AsyncStorage·SecureStore를 모두 가짜 구현으로 바꾸면 Unit이다.

## Integration Test

- 무엇을 연결하는지 명확히 한다. 예: **저장 mutation → 실제 Query 캐시 → 조회 결과**.
- 연결을 확인할 앱 모듈은 실제 구현을 사용한다. mock은 그 연결 바깥의 서버·기기 등으로 제한한다.
- React Hook·Provider·Query의 연결을 검사할 때는 실제 React 실행 환경과 QueryClient를 사용한다. 직접 만든 `useState`·`useEffect`·`useMutation` 모사 코드로 그 연결을 검증했다고 판단하지 않는다.
- 최종 결과뿐 아니라 중요한 실패·복구도 확인한다. 예: 저장 실패 시 기존 데이터 유지, 재시도 후 한 번만 반영.
- 캐시 갱신을 검사한다면 실제 성공 콜백과 캐시 변경까지 실행한다. `invalidateQueries`를 빈 함수로 바꾼 뒤 저장 성공만 확인해서는 부족하다.
- Unit·Integration 테스트는 실제 서버 없이 실행한다. HTTP 응답은 mock으로 제공하고, 서버의 저장·검증 동작은 backend 테스트에서 확인한다.

## 새 테스트 추가 순서

1. **조건 → 기대 결과**를 한 문장으로 적고, 위 기준으로 Unit 또는 Integration을 고른다.
2. 해당 폴더에 `<기능>.test.cjs`를 만들거나 같은 기능의 기존 파일에 추가한다. `node:test`와 `node:assert/strict`를 사용한다.
3. TypeScript 앱 모듈을 불러오기 전에 `require('../helpers/register.cjs')`를 실행한다. 기기·저장소 mock도 앱 모듈을 불러오기 전에 설치한다.
4. 준비 → 실행 → 검증 순서로 작성한다. 복잡한 테스트에는 이 세 구간을 짧은 주석으로 구분하고, 파일 상단에 **검사 대상 또는 연결한 모듈 / mock으로 바꾼 대상**을 적는다.
5. 정상 동작과 중요한 실패·경계값을 검사한다. 기대값을 검사 대상 함수로 다시 계산하지 말고, 실제 요구사항에 맞는 값으로 명시한다.
6. 아래 명령으로 해당 파일을 먼저 실행한 뒤 전체 테스트·lint·타입 검사를 실행한다. AI 표기는 저장소 `AGENTS.md`를 따른다.

### 공통 helper와 참고 코드

| 필요한 작업 | 사용할 도구·참고 파일 |
| --- | --- |
| TypeScript/TSX 불러오기 | [`helpers/register.cjs`](helpers/register.cjs) |
| 기기 기능·저장소 대체 | [`helpers/native-boundaries.cjs`](helpers/native-boundaries.cjs)의 `nativeBoundaries()`; 반환된 `values`로 저장 데이터 초기화 |
| 저장소만 검사·쓰기 실패 재현 | [`helpers/memory-storage.cjs`](helpers/memory-storage.cjs)의 `createMemoryStorage()`, `failNextWrite()` |
| 추가 외부 모듈 대체 | [`helpers/mock-modules.cjs`](helpers/mock-modules.cjs)의 `mockModules()`; 검사 대상 앱 로직은 유지 |
| Hook·Provider·Query 연결 | [`helpers/react-harness.cjs`](helpers/react-harness.cjs)의 `renderHook(t, hook, options)` |
| Unit 작성 예 | [`unit/auth-api.test.cjs`](unit/auth-api.test.cjs): API 한 모듈의 요청·응답·오류 검사 |
| Integration 작성 예 | [`integration/account-session.test.cjs`](integration/account-session.test.cjs): 실제 Provider·저장소·Query 연결, HTTP 응답만 mock |

- Hook 상태 변경은 `act()` 안에서 실행하고, 비동기 결과는 `waitFor()`로 기다린다. 응답 순서가 중요한 경우 `deferred()`로 직접 제어한다.
- `renderHook()`은 React와 QueryClient를 실제로 실행하고 테스트 종료 시 정리한다. 이것이 실제 RN 화면 조작을 검사하는 것은 아니다.
- HTTP 대체는 `t.mock.method(global, 'fetch', ...)`를 사용한다. 예상하지 않은 요청은 오류로 처리한다. Unit에서 API 상위 모듈 하나만 검사한다면 하위 요청 함수를 대체할 수 있다.
- 매 테스트마다 메모리 저장 데이터와 앱 세션을 초기화한다. `t.mock`은 자동 복원되며, 직접 바꾼 전역 값·환경변수는 `t.after()`에서 복원한다.

## 실행과 검토

아래 명령은 모두 `client/`에서 실행한다. 종류별 npm 명령은 추가하지 않는다.

```sh
node --test tests/unit/auth-api.test.cjs # 작성한 파일 경로로 변경
npm test # tests/ 루트, unit/, integration/ 전체 실행
npm run lint
./node_modules/.bin/tsc --noEmit
```

- 변경한 동작과 중요한 실패 사례가 검사되는지 먼저 확인한다. 버그 수정에는 가능하면 수정 전 실패하는 재현 테스트를 남긴다.
- 커버리지는 미실행 코드도 포함해 영역별로 측정하고, 중요한 분기가 빠졌는지 함께 확인한다. 테스트 개수나 전체 평균만으로 완료를 판단하지 않는다.
- 수치 목표는 측정 범위와 제외 항목을 정한 뒤 별도로 합의한다. 이 문서는 임의의 커버리지 목표를 정하지 않는다.

Client CI는 `npm test`와 별도로 `server/`의 `uv run python -m tests.run_client_integration`을 실행한다.
API 통합 검사는 임시 PostgreSQL 컨테이너와 HTTP 서버에 `API_URL`을 연결해 전체 테스트를 실행한다.
로컬에서 같은 검사를 실행하려면 Docker가 필요하다.

기존 로컬 추천 생성기는 제거되었으므로 `personalized-recommendation.test.cjs`는 서버 생성 실패·재시도와
기존 추천 기록의 안전성·제공 형태·식후 결과 호환성을 검사한다. 저장의 멱등성과 캐시 복구는
`integration/suggestion-saving.test.cjs`가 검사한다.
