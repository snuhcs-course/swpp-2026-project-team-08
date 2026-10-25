<!-- This Code is generated with AI -->
<!-- AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim -->
<!-- Changed: ingredient 관련 문서 작성 -->
<!-- AI-generated with GPT-6, 2026-10-25, reviewed by Haechan Jung -->
<!-- Changed: 클라이언트 작업 규칙 정리 -->

# 클라이언트 작업 규칙

Expo / React Native 모바일 앱이다. 모바일 사용성, 성능, iOS·Android 호환성을 우선한다.

## 작업 전에

- [`docs/architecture.md`](docs/architecture.md)를 먼저 읽고 기존 구조와 작업 규칙을 따른다.
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

## 명령어와 검증

`bun.lock`이 있으면 아래 명령의 `npx` 대신 `bunx`를 사용한다.

```bash
npx expo install <package>  # Expo SDK와 맞는 버전으로 설치
npx expo start              # 개발 서버 실행
npx expo lint               # 린트 검사
npx tsc --noEmit            # 타입 검사
npx expo-doctor             # 의존성·설정 진단
npx expo install --fix      # 호환되지 않는 패키지 버전 수정
```

- 의존성은 일반 패키지 설치 명령 대신 `expo install`로 추가한다.
- 작업을 마치기 전에 린트와 타입 검사를 실행한다. 실패하거나 실행하지 못했으면 그대로 보고한다.

## 화면 이동과 라우팅

- 화면 이동은 **Expo Router**를 사용한다.
- `src/app/`은 화면 경로와 `_layout.tsx` 배치를 정의한다.
  일반 컴포넌트·훅·도구 함수는 이 디렉터리 밖에 둔다.
- `Link`, `router`, `useLocalSearchParams`는 `expo-router`에서 가져온다.
- [Expo Router 문서](https://docs.expo.dev/router/introduction.md)를 참고한다.

## EAS 빌드·배포

- 클라우드 빌드는 `eas build`, 앱 제출은 `eas submit`, 무선 업데이트는 `eas update`를 사용한다.
  이 흐름에는 로컬 Xcode나 Android Studio가 필요하지 않다.
- Bun 프로젝트는 `bunx eas-cli <명령>`, 그 외에는 `npx eas-cli@latest <명령>`으로 실행한다.
  문서의 `eas` 명령도 같은 방식으로 바꿔 실행한다.
- [EAS 문서](https://docs.expo.dev/eas/index.md)를 참고한다.

## 네이티브 설정과 의존성

- `ios/`·`android/`가 없으면 Expo가 생성하는 구조다. 직접 만들거나 수정하지 않고
  `app.json`과 설정 플러그인으로 네이티브 동작을 설정한다.
- Expo Go에는 기본 제공 네이티브 모듈만 있다. 네이티브 코드가 있는 라이브러리를 추가하면
  `npx expo run:ios`·`npx expo run:android` 또는 `eas build --profile development`로 개발 빌드를 만든다.
  실행 시 위의 Bun·EAS 명령 규칙도 적용한다.
- 외부 라이브러리보다 Expo 권장 모듈을 우선 검토하고, 의존성을 추가하기 전에 사용 가능한 스킬을 확인한다.
  [Expo 모듈 문서](https://docs.expo.dev/versions/latest/index.md)를 참고한다.
