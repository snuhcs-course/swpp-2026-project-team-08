<!-- AI-generated with GPT-6, 2026-11-26, reviewed by Seoyeon Heo -->
<!-- Changed: 앱 자산과 의존성 출처 및 라이선스 정리 -->

# 앱 저작권 및 라이선스 자료

이 문서는 저장소에서 확인한 앱 자산과 클라이언트에 직접 실행 의존성을 기록한다. 버전은 [package.json](../client/package.json)과 lock 파일을 따른다. 간접 의존성, 개발 도구, 서버 의존성은 이 목록에 포함하지 않는다.
## 이미지와 아이콘

| 항목명 | 출처 또는 제작자 | 라이선스 | 앱에서 사용한 위치 |
|---|---|---|---|
| 앱 아이콘 및 Android 적응형 아이콘, favicon | ChatGPT로 생성 | [OpenAI 이용약관](https://openai.com/policies/terms-of-use/): 법이 허용하는 범위에서 생성 결과물에 대한 OpenAI의 권리를 사용자에게 양도 | `client/app.json`의 아이콘 및 웹 favicon |
| `assets/ui/*` 이미지, `assets/meal/*.svg` | Figma assets의 iOS and iPadOS 27 UI Kit, Material 3 Design Kit, Simple Design System, flaticon.com | MIT | `UiAssetIcon`: 홈, 온보딩, 식사 기록, 식후 리뷰, 추천 화면 / `AppIcon`: 식사 종류·장소 및 사진 선택 등 |
| Feather | [Feather Icons](https://github.com/feathericons/feather) | MIT | 공통 UI, 온보딩, 식사 기록, 마이페이지 |
| Ionicons | [Ionicons](https://github.com/ionic-team/ionicons) | MIT | 식후 리뷰 |
| Material Community Icons | [Material Design Icons](https://github.com/Templarian/MaterialDesign) | [Pictogrammers Free License](https://github.com/Templarian/MaterialDesign/blob/master/LICENSE): 아이콘·폰트 Apache 2.0 또는 개별 아이콘의 별도 라이선스 | 하단 내비게이션, 식사 기록 |


## 글꼴

| 항목명 | 출처 또는 제작자 | 라이선스 | 앱에서 사용한 위치 |
|---|---|---|---|
| Inter | [Rasmus Andersson / Google Fonts](https://github.com/google/fonts/tree/main/ofl/inter) | SIL Open Font License 1.1 | 앱 전반의 텍스트, `src/app/_layout.tsx`에서 로딩 |
| Poppins | [Indian Type Foundry / Google Fonts](https://github.com/google/fonts/tree/main/ofl/poppins) | SIL Open Font License 1.1 | 앱 전반의 텍스트, `src/app/_layout.tsx`에서 로딩 |

글꼴 패키지의 코드에는 MIT, 글꼴 자체에는 OFL-1.1이 적용된다.


## 코드와 라이브러리

| 항목명 | 출처 | 라이선스 | 앱에서 사용한 위치·역할 |
|---|---|---|---|
| `@expo-google-fonts/inter` | [프로젝트](https://github.com/expo/google-fonts) | MIT AND OFL-1.1 | 앱 전체 글꼴 |
| `@expo-google-fonts/poppins` | [프로젝트](https://github.com/expo/google-fonts) | MIT AND OFL-1.1 | 앱 전체 글꼴 |
| `@expo/metro-runtime` | [프로젝트](https://github.com/expo/expo) | MIT | Expo 실행 환경 |
| `@expo/ui` | [프로젝트](https://github.com/expo/expo) | MIT | 네이티브 UI |
| `@expo/vector-icons` | [프로젝트](https://github.com/expo/vector-icons) | MIT | 공통 UI·온보딩·식사 기록 |
| `@react-native-async-storage/async-storage` | [프로젝트](https://github.com/react-native-async-storage/async-storage) | MIT | 로컬 데이터 저장 |
| `@react-native-community/datetimepicker` | [프로젝트](https://github.com/react-native-datetimepicker/datetimepicker) | MIT | 날짜 선택 |
| `@tanstack/react-query` | [프로젝트](https://github.com/TanStack/query) | MIT | 서버 데이터 조회·캐시 |
| `expo` | [프로젝트](https://github.com/expo/expo) | MIT | 앱 실행 환경 |
| `expo-build-properties` | [프로젝트](https://github.com/expo/expo) | MIT | 네이티브 빌드 설정 |
| `expo-constants` | [프로젝트](https://github.com/expo/expo) | MIT | 앱 설정 |
| `expo-document-picker` | [프로젝트](https://github.com/expo/expo) | MIT | 파일 선택 |
| `expo-file-system` | [프로젝트](https://github.com/expo/expo) | MIT | 파일 접근 |
| `expo-font` | [프로젝트](https://github.com/expo/expo) | MIT | 글꼴 로딩 |
| `expo-image` | [프로젝트](https://github.com/expo/expo) | MIT | 이미지 표시 |
| `expo-image-picker` | [프로젝트](https://github.com/expo/expo) | MIT | 카메라·사진 선택 |
| `expo-linking` | [프로젝트](https://github.com/expo/expo) | MIT | 딥 링크 |
| `expo-router` | [프로젝트](https://github.com/expo/expo) | MIT | 화면 라우팅 |
| `expo-secure-store` | [프로젝트](https://github.com/expo/expo) | MIT | 인증 정보 저장 |
| `expo-splash-screen` | [프로젝트](https://github.com/expo/expo) | MIT | 시작 화면 |
| `expo-status-bar` | [프로젝트](https://github.com/expo/expo) | MIT | 상태 표시줄 |
| `react` | [프로젝트](https://github.com/react/react) | MIT | UI 구성 |
| `react-dom` | [프로젝트](https://github.com/react/react) | MIT | 웹 UI |
| `react-native` | [프로젝트](https://github.com/react/react-native) | MIT | 모바일 UI |
| `react-native-safe-area-context` | [프로젝트](https://github.com/appandflow/react-native-safe-area-context) | MIT | 안전 영역 |
| `react-native-screens` | [프로젝트](https://github.com/software-mansion/react-native-screens) | MIT | 화면 내비게이션 |
| `react-native-web` | [프로젝트](https://github.com/necolas/react-native-web) | MIT | 웹 UI |
