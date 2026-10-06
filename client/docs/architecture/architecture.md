## **기본 구조**

안드로이드 권장 아키텍처를 따른다.

`UI -> ViewModel -> Repository -> Data Source`

단계를 건너뛰거나, 역방향 의존은 허용하지 않는다.

### ** UI Layer **

Jetpack Navigation을 사용한다.

#### UI
**Route**
- Jetpack Navigation의 route와 일대일로 대응되는 컴포저블
- HiltViewModel 인스턴스를 생성, ViewModel과 의사소통한다.
- UiState를 구독하고, 하위 UI에 전달한다.
- UiEvent를 구독하여, 적절하게 처리한다.
- 하위에서 발생한 이벤트를 적절히 ViewModel에 전달한다.
- 하위에서 발생한 Navigation 관련 이벤트를 처리한다.

**Screen**
- 로직과 상태를 가지지 않는, 순수한 UI 요소로서의 화면
- 주로 Route로부터 UiState를 전달받아 화면에 표시한다.
- Event가 발생하면 Route에 전달한다.

#### 재사용 Compose 컴포넌트

- 여러 화면에서 반복되는 입력 필드, 진행 표시, 선택 행, 정보 안내, 액션 버튼은 `ui/components/` 아래의 재사용 가능한 Composable로 분리한다.
- 공통 컴포넌트의 Figma 근거, 변형, 크기, 색상, 패딩, 상태 규칙은 [`specs/ui-components/spec.md`](../../specs/ui-components/spec.md)에 정의한다. 화면별 기능 명세는 이 공통 명세를 참조하고, 화면 특유의 변형이 필요하면 근거가 되는 Figma 프레임과 함께 해당 기능 명세에 기록한다.
- 재사용 컴포넌트는 화면 상태나 Repository에 직접 접근하지 않는다. 필요한 값과 콜백을 매개변수로 받으며, 화면별 상태와 동작은 Screen 또는 Route가 소유한다.
- 화면 구성에만 쓰이는 조각은 해당 feature 패키지에 두고, 둘 이상의 화면/기능에서 쓰이는 공통 UI는 `ui/components/`에 둔다.
- 공통 색상·형태·입력 크기 등 시각 규칙은 공통 컴포넌트와 UI 테마에서 관리해 화면마다 중복 정의하지 않는다.
- 입력 컴포넌트는 입력 텍스트와 placeholder가 잘리지 않도록 Material 컴포넌트의 최소 높이를 보장하고, 고정 높이가 필요하면 글꼴 크기와 내부 패딩을 함께 검토한다.

#### ViewModel

**ViewModel**
- 상태를 가지고, 비즈니스 로직을 담당하는 HiltViewModel
- Jetpack Navigation 에서 route 별로 유일하게 존재한다.

역할
- 각 Route 별 화면(기능 단위)에 필요한 모든 UI 상태를 단일 데이터 클래스의 StateFlow로 제공한다.
- 이벤트를 받아, 상태 변경, UiEvent 발생 등 비즈니스 로직을 처리한다. 

원칙
- UiState와 무관하게 비즈니스 로직에만 사용되는 값(주로 SavedStateHandle로 주입된 값)은 UiState 밖에 ViewModel 멤버 변수로 둔다.

**UiState**
- 한 Route가 가지는 화면의 state를 모두 가지는 클래스
- 각 Route가 가질 수 있는 상태를 적절히 분류해서 표현한다.
- 다이얼로그·바텀시트 등 "어떤 UI를 띄울지"에 대한 상태도 UiState의 일부로 포함한다.
    - 보통 nested sealed interface (예: `DialogState`, `SheetType`) 로 표현


구조

UiState의 형태는 화면의 특성에 따라 결정한다.

(a) **콘텐츠 로딩 분기가 없는 경우**: data class 하나로 표현한다.

```kotlin
data class SettingsUiState(
    val themeMode: ThemeMode = ThemeMode.AUTO,
    val dialogState: DialogState = DialogState.None,
)
```

(b) **콘텐츠 로딩 분기가 있고, UI 인터랙션 상태(다이얼로그, 편집 모드 등)가 콘텐츠 전이와 무관하게 유지되어야 하는 경우**: 최상위를 data class로 두고,
콘텐츠 로딩 상태만 nested sealed interface(`ContentState`)로 분리한다.

```kotlin
data class VacancyUiState(
    val contentState: ContentState = ContentState.Loading,
    val dialogState: DialogState = DialogState.None,
    val isEditMode: Boolean = false,
) {
    sealed interface ContentState {
        data object Loading : ContentState
        data object Error : ContentState
        data object Empty : ContentState
        data class Loaded(...) : ContentState
    }
}
```

이 구조의 장점:

- 외부 데이터 갱신 시 `it.copy(contentState = ...)`로 콘텐츠만 교체하면 dialogState 등 UI 인터랙션 상태가 자동 보존된다.
- Loading 상태에서도 다이얼로그를 열 수 있다.
- `showDialog()`, `dismissDialog()` 등이 콘텐츠 상태 분기 없이 단순 `it.copy(dialogState = ...)`로 구현된다.

(c) **콘텐츠 로딩 분기가 있지만, UI 인터랙션 상태가 없거나 극히 단순한 경우**: 최상위를 sealed interface로 표현해도 무방하다.

```kotlin
sealed interface PushPreferencesUiState {
    data object Loading : PushPreferencesUiState
    data class Success(...) : PushPreferencesUiState
    data object Error : PushPreferencesUiState
}
```


**UiEvent**

- 한 번 소비되고 사라지는 일회성 이벤트 (토스트, 네비게이션, 바텀시트 열기/닫기 등)
- UiState는 영속적인 상태, UiEvent는 소비 후 사라지는 이벤트로 역할을 명확히 구분한다.
- 컴포즈 UI 라이브러리의 상태(예: `ModalBottomSheetState`)는 Route가 소유한다. ViewModel은 직접 제어하지 않고 UiEvent를 통해 제어를
  요청한다.



### **Data 레이어**

**Repository**
- data source 로의 요청 및 data source 로부터의 데이터 수신을 추상화
- 서버 스펙에서 기원하는 관심사(API에 전달할 ID 결정, DTO 필드 매핑 등)는 Repository(data layer)에서 처리한다. ViewModel/도메인 로직이 이를
  알아서는 안 된다.
- 캐시 무효화·재조회 등 데이터 갱신 시점 판단은 Repository가 투명하게 처리한다. ViewModel은 mutate 후 "refetch해야겠다"는 것을 신경 쓰지 않는다.
- 도메인 모델을 반환한다. DTO를 상위 레이어에 노출하지 않는다.
- 성공/실패는 예외를 throw하지 않고 `Result.Success` / `Result.Fail` 타입으로 반환한다.

---

### Date Source

실제 데이터의 원천 (서버 / 로컬 저장소)

**Storage**

- DataStore 기반으로 추상화되어 있는 로컬 저장소
- 유저 로그인 토큰, 마지막으로 본 화면 / 진행도 등 특정 데이터를 저장 및 제공한다.

**API**

- 서버와 직접적으로 대응되는 인터페이스.
