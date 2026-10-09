# NurtureBites — Iteration 1 Prototype

자폐 아동 보호자의 식사 기록과 다음 시도 계획을 돕는 Android 프로토타입입니다.

## 실행 준비

- Android Studio와 Android SDK Platform 37
- Android 에뮬레이터 또는 USB 디버깅을 켠 기기 (Android API 24 이상)
- JDK 25: 프로젝트의 Gradle 데몬 설정이 이 버전을 사용합니다. 설치되어 있지 않으면 첫 빌드 때 인터넷을 통해 자동으로 내려받을 수 있습니다.

## 실행 방법

1. Android Studio에서 `client/` 폴더를 프로젝트로 열고 Gradle 동기화를 마칩니다.
2. 에뮬레이터 또는 연결한 기기를 선택합니다.
3. `app` 실행 구성을 선택해 **Run**을 누릅니다.

터미널에서는 프로젝트 루트에서 다음 명령으로 디버그 앱을 설치할 수 있습니다. 설치 후 기기에서 앱을 실행하세요.

```bash
cd client
./gradlew :app:installDebug
```

## 데모 링크

[Iteration 1 데모](https://drive.google.com/file/d/1zTc9fR5pMFKrxG15eQM_s-Sann6nUmat/view?usp=sharing)
