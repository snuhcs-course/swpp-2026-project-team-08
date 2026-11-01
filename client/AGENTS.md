<!-- This Code is generated with AI -->
<!-- AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim -->
<!-- Changed: ingredient 관련 문서 작성 -->
<!-- AI-generated with GPT-6, 2026-10-26, reviewed by Haechan Jung -->
<!-- Changed: 클라이언트 작업 규칙 및 문서 정리 -->

# 클라이언트 작업 규칙

Expo / React Native 모바일 앱이다. 모바일 사용성, 성능, iOS·Android 호환성을 우선한다.

## 작업 전에

이 디렉터리에서 작업할 때도 루트 [`AGENTS.md`](../AGENTS.md)의 공통 규칙을 함께 따른다.

- [`README.md`](README.md)와 [`docs/architecture.md`](docs/architecture.md)를 먼저 읽고 기존 구조와 작업 규칙을 따른다.
- 자녀 프로필의 `allergies`·`restrictions`나 `src/util/strings.ts`의 선택 항목을 수정하면
  [`재료·식이 제한 ID 규칙`](../docs/food-ingredient-restriction-ids.md)도 읽는다.
  서버의 `RestrictionId`와 같은 ID를 쓰므로 양쪽을 같은 변경에서 수정한다.

## AI 생성 코드 표기

루트 [`AGENTS.md`](../AGENTS.md)의 **AI 생성 코드 표기** 규칙을 따른다.
이 디렉터리에서 주석 문법은 TypeScript·JavaScript는 `//`, Markdown은 `<!-- -->`를 쓴다.

## Expo·React Native API 확인

Expo는 버전마다 API가 바뀔 수 있으므로 기억에만 의존하지 않는다.
Expo·EAS·React Native API를 사용하는 코드를 작성하기 전에 다음 순서로 확인한다.

1. `package.json`에서 `expo`의 주 버전을 확인한다.
2. 해당 버전의 공식 문서 `https://docs.expo.dev/versions/v<주 버전>.0.0/`를 읽는다.
3. 그 밖의 내용은 [Expo 문서 목록](https://docs.expo.dev/llms.txt)에서 관련 공식 문서를 찾아 확인한다.

## 검증

설치·실행·검사 명령은 [`README.md`](README.md)를 따른다.
작업 완료 전 린트와 타입 검사를 실행하고, 실패하거나 실행하지 못하면 그대로 보고한다.

## 화면 이동과 라우팅

- 화면 이동은 **Expo Router**를 사용한다.
- `src/app/`은 화면 경로와 `_layout.tsx` 배치를 정의한다.
  일반 컴포넌트·훅·도구 함수는 이 디렉터리 밖에 둔다.
- `Link`, `router`, `useLocalSearchParams`는 `expo-router`에서 가져온다.
- [Expo Router 문서](https://docs.expo.dev/router/introduction.md)를 참고한다.

## 네이티브 설정과 의존성

- `ios/`·`android/`가 없으면 Expo가 생성하는 구조다. 직접 만들거나 수정하지 않고
  `app.json`과 설정 플러그인으로 네이티브 동작을 설정한다.
- 네이티브 모듈 추가 시 필요한 개발 빌드 절차는 [`README.md`](README.md)를 따른다.
- 외부 라이브러리보다 Expo 권장 모듈을 우선 검토하고, 의존성을 추가하기 전에 사용 가능한 스킬을 확인한다.
  [Expo 모듈 문서](https://docs.expo.dev/versions/latest/index.md)를 참고한다.

## 작업 순서와 완료 검증

- 관련 Feature·명세·API·Query·Storage와 기존 문자열·색상 토큰을 먼저 확인한다.
- 서버 데이터·로컬 초안·UI 상태의 소유 위치, 저장 기준, 초기화·복원·캐시 갱신 시점을 정한다.
- 파일 배치와 UI·Hook·규칙 함수의 책임은 [아키텍처](docs/architecture.md)를 따른다.
  일반 함수로 분리할 업무 규칙, 공통 UI의 위치, 불필요한 계층·의존성 추가 여부를 확인한다.
- 정상 동작·입력 오류·요청 실패·중복 제출을 검증하고, 저장 후 관련 화면의 갱신을 확인한다.
- 편집 시 항목 ID와 사용자 입력이 보존되는지, 계정·자녀 변경 시 이전 데이터가 남지 않는지 확인한다.
- 화면 변경 시 최초 로딩·빈 상태·재조회·실패를 구분하고, 기존 콘텐츠와 초안이 유지되는지 확인한다.
- 단계 이동·초안 복원·늦은 응답·빠른 연속 탭에서 잘못된 화면이나 깜빡임이 없는지 실제 실행 환경에서 확인한다.
- 위 검증과 함께 이 문서의 린트·타입 검사 및 변경에 필요한 테스트를 실행한다.

## Recommendation 관련 변경 시 유의사항
If the work touches allergy or dietary-restriction ids (`allergies` / `restrictions` in the child profile or the option groups in `src/util/strings.ts`), also read [`docs/food-ingredient-restriction-ids.md`](../docs/food-ingredient-restriction-ids.md). The server defines the same ids (`RestrictionId`), so a change here must be made there in the same change.
