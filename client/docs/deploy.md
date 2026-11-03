<!-- AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung -->
<!-- Changed: 플랫폼별 실서버 연결 빌드 명령 -->

# 클라이언트 배포 빌드

목차: [공통 준비](#공통-준비) · [Android](#android) · [iOS](#ios) · [웹](#웹)

- API 주소는 빌드 시 `EXPO_PUBLIC_API_URL`로 지정한다.
- 아래 명령은 실서버에 연결하는 release 앱 또는 웹 파일을 만든다.
- 스토어 제출·웹 호스팅 업로드는 별도로 수행한다.

## 공통 준비

저장소 루트에서 시작한다. 명령은 bash/zsh 기준이며, 플랫폼별 명령도 같은 터미널에서 실행한다.
실서버 주소의 기준은 [서버 배포 문서](../../server/docs/deploy.md)다.

```bash
cd client
npm ci
export EXPO_PUBLIC_API_URL=https://d22rvdcyrf0azy.cloudfront.net
export NODE_ENV=production
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

주소는 JS 번들에 포함되므로 변경하면 다시 빌드해야 한다. 아래 `prebuild --clean`은
해당 플랫폼의 생성 폴더를 지우므로 직접 수정한 네이티브 파일이 있다면 먼저 백업한다.

## Android

JDK와 Android SDK가 필요하다. `ANDROID_HOME`은 설치한 SDK 위치로 지정한다.

```bash
# macOS 기본 SDK 위치; 다른 환경은 실제 설치 경로로 변경
export ANDROID_HOME="$HOME/Library/Android/sdk"
npx expo prebuild --platform android --clean --no-install
(cd android && ./gradlew :app:assembleRelease --rerun-tasks)
```

결과: `client/android/app/build/outputs/apk/release/app-release.apk`.
기본 설정은 테스트용 debug 키로 서명한다. Play Store 제출에는 배포 서명 설정 후
`assembleRelease` 대신 `bundleRelease`로 AAB를 생성한다.

## iOS

macOS·Xcode·CocoaPods 및 실기기 서명 설정이 필요하다.

```bash
npx expo prebuild --platform ios --clean
npx expo run:ios --configuration Release --device --no-build-cache
```

선택한 기기에 release 앱을 빌드·설치한다. TestFlight/App Store 배포는
생성된 Xcode workspace에서 배포 서명을 설정하고 Archive → Distribute App으로 진행한다.

## 웹

```bash
npx expo export --platform web --clear --output-dir dist/web
```

결과: `client/dist/web/`. 호스팅에 업로드하고, 서버 CORS 설정에 웹 서비스 출처를 허용한다.

명령 참고: [Expo CLI](https://docs.expo.dev/more/expo-cli/).
