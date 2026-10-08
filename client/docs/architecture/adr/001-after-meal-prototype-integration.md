# ADR 001 — 식후 검토 프로토타입 연결

현재 A/B는 ViewModelProvider.Factory, Activity의 저장 가능한 화면 키,
SharedPreferences JSON과 Kotlin Result로 동작한다. C도 이 프로토타입의
연결·저장 방식을 유지한다. Hilt/Navigation/DataStore로 전체 앱을 옮기는
작업은 이번 기능에 포함하지 않는다. 이는 architecture.md의 해당 도구
선택에 대한 한시적 예외이며, UI → ViewModel → Repository 의존 방향은 유지한다.

C의 Route는 상태 구독과 플랫폼 사진 선택만 담당하고 Screen은 값과 콜백을
받는다. ViewModel에는 Context를 전달하지 않는다. 화면 식별에는 Meal ID만
사용한다. 식후 초안은 Meal별로 저장하고, 직렬화된 쓰기로 이전 자동 저장이
새 입력을 덮지 않게 한다. 최종 저장 성공 전에는 완료 화면으로 이동하지 않는다.

기존 B의 음식 편집기를 공유한다. 재료 문자열을 유지하는 B 모델과 호환되도록
음식 ID와 재료 이름에서 결정적인 재료 ID를 만들고 결과 키로 사용한다.
현재 편집기는 재료 삭제/추가만 제공하므로 삭제 후 추가한 재료는 새 항목이다.
독립적인 재료 이름 변경 API를 도입할 때 영속적인 재료 ID 필드를 추가한다.

다음 추천 기능은 아직 없으므로 완료된 식후 기록을 Meal ID로 읽을 수 있게
저장한다. 저장된 제안과 추천이 없는 경우 예시 카드를 생성하지 않는다.
