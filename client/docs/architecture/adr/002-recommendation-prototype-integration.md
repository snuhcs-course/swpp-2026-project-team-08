# ADR 002 — 추천 프로토타입 연결

추천 기능은 현재 앱의 단일 Activity, ViewModelProvider.Factory, 로컬 Repository 저장 방식을 따른다. Hilt·Navigation·DataStore로 전체 앱을 옮기는 작업은 이 기능 범위에 포함하지 않는다. architecture.md의 도구 선택에 대한 한시적 예외이며, UI → ViewModel → Repository 의존 방향은 유지한다. ViewModel은 Context를 참조하지 않고, 화면 이동에는 Meal ID만 전달한다.

추천 후보는 Repository에서 보호자 확정 식후 결과와 프로필을 읽은 뒤 생성한다. 현재 프로토타입에는 재료별 알레르기·식이 제한 검증 목록이 없으므로, 제한이 있는 프로필에서는 안전성을 확정할 수 없어 음식 제안을 보류한다. 제한이 없음을 명시한 프로필에 대해서도 재료가 확인된 기존 음식의 제공 방식만 제안한다. 추천·건너뛰기 선택은 Meal ID별로 로컬 저장하며, 기존 식후 검토는 안전성을 다시 확인한 저장 제안만 읽는다.
