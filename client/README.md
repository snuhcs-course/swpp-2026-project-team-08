<!-- AI-generated with GPT-6, 2026-10-26, reviewed by Haechan Jung -->
<!-- Changed: 문서 역할 정리 -->

# 클라이언트

목차: [설치와 실행](#설치와-실행) · [검증](#검증) · [의존성과 빌드](#의존성과-빌드) · [문서](#문서)

- Expo / React Native 모바일 앱이다.
- API 주소는 `EXPO_PUBLIC_API_URL`로 지정한다.
- 작업 검증은 린트·타입 검사·관련 테스트로 수행한다.

## 설치와 실행

Node.js와 Bun이 필요하다. 패키지 버전은 `package.json`과 `bun.lock`을 기준으로 한다.
저장소 루트에서 실행한다.

```bash
cd client
bun install --frozen-lockfile
bunx expo start
```

서버 설치·실행은 [서버 README](../server/README.md)를 따른다.
API 주소를 지정하는 실행 예시는 다음과 같다.

```bash
EXPO_PUBLIC_API_URL=http://192.168.0.10:8000 bunx expo start
```

주소는 실제 서버 주소로 바꾼다. 기기에서 접근할 수 있는 주소여야 한다.
환경변수가 없으면 Metro 호스트의 8000번 포트를 사용하고, 호스트를 찾지 못하면 localhost를 사용한다.

## 검증

`client/`에서 실행한다.

```bash
bunx expo lint
bunx tsc --noEmit
bun run test
bunx expo-doctor
```

기기 권한·화면 배치는 실제 기기나 시뮬레이터에서도 확인한다.

## 의존성과 빌드

의존성은 Expo SDK와 맞는 버전을 선택하는 `bunx expo install <package>`로 설치한다.
호환되지 않는 버전은 `bunx expo install --fix`로 정리한다.
Expo Go에 없는 네이티브 모듈을 추가하면 개발 빌드가 필요하다.

```bash
bunx expo run:ios
bunx expo run:android
bunx eas-cli build --profile development
```

로컬 네이티브 빌드에는 해당 플랫폼 개발 도구가 필요하다.
클라우드 빌드·제출·무선 업데이트는 각각 `bunx eas-cli build`, `submit`, `update`를 사용한다.
EAS 계정·프로젝트·빌드 프로필은 해당 실행 환경에 맞게 준비한다.

## 문서

- [작업 규칙](AGENTS.md)
- [프로젝트 아키텍처](docs/architecture.md)
