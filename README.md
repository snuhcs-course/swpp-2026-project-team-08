# NurtureBites — Iteration 1 Prototype

자폐 아동 보호자의 식사 기록과 다음 시도 계획을 돕는 Android 프로토타입입니다.

## 실행 준비

- Android Studio와 Android SDK Platform 37
- Android 에뮬레이터 또는 USB 디버깅을 켠 기기 (Android API 24 이상)
- JDK 25: 프로젝트의 Gradle 데몬 설정이 이 버전을 사용합니다. 설치되어 있지 않으면 첫 빌드 때 인터넷을 통해 자동으로 내려받을 수 있습니다.

실제 데모에 사용한 기기: Samsung Galaxy Note20 5G (Android 13, One UI 5.1).

## 실행 방법

1. Android Studio에서 `client/` 폴더를 프로젝트로 열고 Gradle 동기화를 마칩니다.
2. 에뮬레이터 또는 연결한 기기를 선택합니다.
3. `app` 실행 구성을 선택해 **Run**을 누릅니다.

터미널에서는 프로젝트 루트에서 다음 명령으로 디버그 앱을 설치할 수 있습니다. 설치 후 기기에서 앱을 실행하세요.

```bash
cd client
./gradlew :app:installDebug
```

## 데모에서 확인할 수 있는 기능

- 보호자·아동 정보, 식이 제한, 선호 음식을 입력하는 온보딩과 프로필 수정
- 식사 정보와 사진을 추가하고, 음식·재료·특성·노출 목표를 확인하거나 직접 입력해 저장하는 식사 기록
- 식후 사진과 음식별 섭취 결과·어려움을 기록하는 식후 검토
- 식사 기록과 검토 결과를 바탕으로 다음 시도를 제안하고 저장하거나 건너뛰는 추천 화면
- 저장된 식사, 노출 진행도, 제안을 모아 보는 Home 화면

## 프로토타입의 검증 목표

보호자가 **온보딩 → 식사 기록 → 식후 검토 → 다음 시도 제안**을 한 흐름으로 진행하고, 저장한 정보가 Home에 반영되는지 확인하는 것이 목적입니다. 사진 분석·비교는 로컬 mock 동작이며, 추천도 제한된 로컬 규칙으로 생성됩니다. 따라서 이 데모는 실제 AI 모델이나 서버 성능을 검증하지 않습니다.

## 데모 영상

[Iteration 1 데모](https://drive.google.com/file/d/1zTc9fR5pMFKrxG15eQM_s-Sann6nUmat/view?usp=sharing)
