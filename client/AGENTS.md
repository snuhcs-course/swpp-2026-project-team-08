# Agent Instructions

## Before implementing
1. Read docs/product/product.md
2. Read docs/architecture/architecture.md
3. Read the relevant specs/<feature>/spec.md
4. If plan.md exists, follow it.

## Development rules
- Kotlin + Jetpack Compose
- Single Activity architecture
- UI → ViewModel → Repository 구조 유지
- Composable에서 Repository 직접 접근 금지
- ViewModel은 Android Context를 직접 참조하지 않음
- UI state는 immutable data class로 정의
- navigation argument에는 복잡한 객체를 전달하지 않음
- Coroutine/Flow 기반 비동기 처리

## Verification
After implementation:
- ./gradlew test
- ./gradlew lint
- ./gradlew assembleDebug

## Spec rules
- 요구사항이 불명확하면 임의로 제품 요구사항을 추가하지 않는다.
- 구현 중 architecture 변경이 필요하면 ADR을 작성한다.
- 구현 결과가 spec과 달라지면 spec을 먼저 수정한다.
- 모든 텍스트는 한 파일에 모아 관리한다. 
  - 앱의 모든 text는 한글 버전, 영어 버전을 구분하며 앱 설정에 따라 올바른 언어로 보여져야 한다. 
  - 디자인 문서나 지시에 양쪽 언어의 텍스트가 모두 포함되지 않은 경우, 앱의 다른 부분과 일관적이도록 번역하여 삽입한다.
- 반복적으로 사용되는 색들은 한 파일에 모아 관리한다.