# ADR 003 — Home 프로토타입 연결

Home는 기존 앱의 단일 Activity 화면 전환과 ViewModelProvider.Factory를 유지한다. Hilt·Jetpack Navigation·DataStore로의 전면 이전은 Home 작업에 포함하지 않는다. 이는 `architecture.md`의 도구 선택에 대한 한시적 예외다. UI → ViewModel → Repository 의존 방향과 immutable UI state는 유지한다.

HomeRepository는 완료된 보호자 프로필, 저장된 Meal, 완료된 식후 기록의 음식 경험 단계, 현재도 유효한 저장 제안을 읽는다. HomeViewModel은 이 정보를 한 화면 상태로 제공하고, 화면은 식사 초안 선택과 탭 선택을 ViewModel 상태로 처리한다. 달력의 `Logged`는 Meal의 식사 날짜에서 계산한다. 기록이 없는 상태에는 Figma의 예시 음식·단계·추천을 생성하지 않는다.

Meal Log와 SOS 탭은 현재 저장된 기록의 목록을 보여준다. Ideas는 추천 화면, Profile은 기존 프로필 검토 흐름으로 연결한다. 아직 별도 화면 명세가 없는 Insight에는 빈 상태를 보여준다. 각 영역의 전용 화면이 구현되면 해당 탭의 임시 내용을 교체한다.
