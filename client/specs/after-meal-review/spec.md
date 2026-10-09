<!-- This Code is generated with AI -->

# After-meal Review

## Goal

보호자가 이미 저장한 Meal의 식후 사진과 실제 음식별 반응을 기록한다. 사진 비교 결과는 AI suggestion으로 표시하고, 보호자가 음식·재료별 결과를 확인하거나 수정한 값만 확정한다. 무엇이 어려웠는지 선택적으로 기록하고, 해당 식사에 설정한 Exposure goal과 저장된 제안의 실행 여부를 이어서 확인할 수 있어야 한다.

## Design Document

기준 파일: [Figma — C. After-meal Review](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=0-1). 아래 표는 C 영역의 기본 화면과 상호작용 상태를 모두 열거한다. 동일한 제목을 가진 프레임도 서로 다른 드롭다운·입력 상태를 보여주므로 누락하지 않는다.

| 흐름 | Figma 프레임 | 요구사항으로 반영할 상태 |
|---|---|---|
| 식후 사진 추가 | [96:942](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=96-942) | 촬영·갤러리·파일 선택, 예시 사진과 촬영 팁, 자동 저장 안내 |
| 사진 확인 | [39:5713](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=39-5713), [96:1020](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=96-1020) | 미리보기, 크게 보기, 교체·삭제, 사진 선택 경로 재표시, Use this photo |
| 사진 비교 | [39:5600](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=39-5600) | Before/After 병렬 사진, 확대, 사진 전송 안내, AI 비교·수동 입력 |
| 비교 진행·실패 | [39:5443](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=39-5443), [39:5398](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=39-5398) | 진행·저장 상태·안전한 취소, 실패 후 재시도·수동 기록 |
| 음식별 결과 | [56:3156](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=56-3156), [100:1501](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=100-1501) | 음식과 재료별 Eaten/Tasted/Untouched/Unclear, AI suggestion, edit info, Continue |
| 음식 정보 재편집 | [100:1904](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=100-1904) | C 영역에 배치된 B의 Review food 팝업 재사용; 음식·재료 편집 후 결과 화면 복귀 |
| 결과 설명 | [56:3227](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=56-3227), [65:3](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=65-3) | `?`의 Outcome definitions 팝업과 Unanswered 저장 불가 안내 |
| 어려움 기록 기본·카테고리 | [72:470](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=72-470), [72:110](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=72-110) | 음식별 category/value/+ Add, 9개 카테고리 목록, Continue·Skip |
| 맛·식감 | [81:2198](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=81-2198), [72:580](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=72-580), [72:377](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=72-377), [79:313](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=79-313), [80:505](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=80-505), [80:590](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=80-590) | Taste type/Texture 값, Taste intensity 선택, Other 직접 입력 전·중·후, 제거 가능한 태그 |
| 색 | [80:678](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=80-678), [80:1015](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=80-1015), [80:1127](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=80-1127), [80:789](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=80-789) | Color 카테고리, 색상 점이 붙은 값, 태그, Others 직접 입력 |
| 모양·크기 | [81:1236](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=81-1236), [81:1497](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=81-1497), [81:1422](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=81-1422), [81:1345](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=81-1345) | Shape and size 선택값, optional note, 태그, Not sure와 메모 입력 |
| 맛 강도·냄새 | [81:1589](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=81-1589), [81:1851](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=81-1851), [81:1775](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=81-1775), [81:1928](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=81-1928), [81:2113](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=81-2113), [81:2037](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=81-2037) | Taste intensity 값·태그, Smell 단일 선택 값·태그 |
| 목표·제안 후속 | [72:668](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=72-668), [79:3](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=79-3), [79:223](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=79-223) | 이 식사의 Exposure goal 확인·기록·건너뛰기, 저장된 제안의 실행 여부 카드, 다음 제안 카드로의 연결 |

공통 색·타이포·사진 프레임·진행 표시·버튼·드롭다운은 [`specs/ui-components/spec.md`](../ui-components/spec.md)를 따른다. C의 음식별 결과와 어려움 기록은 같은 디자인 파일에 있지만 화면별로 헤더와 진행 표시 방식이 다르므로 각 소스 프레임을 따른다.

## User Flow

1. 저장된 식사 기록에서 After-meal Review를 시작하고 그 Meal의 식사 날짜, 아이, 확인된 음식 목록과 before-meal 사진을 불러온다.
2. 보호자가 after-meal 사진을 촬영·선택하고 미리보기에서 확인한다. 사진을 확대·교체·삭제할 수 있다.
3. Before/After 사진을 확인한 뒤 `Compare with AI` 또는 `Enter Comparison manually`를 선택한다.
4. AI 비교를 택한 경우 진행 상태를 보며 취소할 수 있다. 실패하면 사진과 입력 내용을 유지한 채 재시도하거나 수동 입력한다.
5. 음식과 재료 각각의 실제 결과를 Eaten/Tasted/Untouched/Unclear 중 하나로 확인·수정한다. `?`로 정의를 볼 수 있고, 음식 정보 자체가 틀리면 Meal Check-in의 음식 편집 흐름으로 돌아간다.
6. 선택적으로 `What made this food difficult?`에서 음식별 원인을 카테고리와 값 또는 메모로 추가하거나 Skip한다.
7. 이 식사에 Exposure goal이 있으면 목표를 보여주고 기록하거나 건너뛴다. 저장된 제안이 있으면 실행 여부를 확인한다.
8. 확인된 결과를 저장하고 다음 제안/기록 화면에 전달한다.

## Requirements

### R1 — 진입, 연결 데이터, 공통 상태

1. After-meal Review는 저장된 하나의 Meal을 대상으로 시작한다. 화면 간에는 복잡한 Meal 객체가 아니라 Meal ID를 전달하고, 데이터 조회 함수에서 최신 기록을 읽는다.
   Meal Check-in 완료 화면에서 이어서 열거나, 홈에서 작성 중인 Meal Check-in 초안을 완료한 뒤 열 때에도 새로 저장된 동일한 Meal ID를 사용한다.
2. 사진과 음식 목록에는 그 Meal의 실제 데이터와 보호자가 입력한 아동 이름을 사용한다. Figma 예시 이름 Maya와 음식 예시 Rolled omelet 등을 고정 데이터로 사용하지 않는다.
3. 보호자가 B. Meal Check-in에서 확인한 음식·재료 정보가 식후 기록의 기준이다. AI가 음식 목록을 새로 추측해 기존 항목을 덮어쓰지 않는다.
4. 진행 중 입력과 현재 단계를 자동 저장하고, 저장 상태를 표시한다. 앱을 다시 열거나 화면에서 돌아와도 마지막 저장된 초안과 사진 선택을 복원한다.
5. 뒤로 가기, 시스템 뒤로 가기, 분석 취소는 저장된 Meal과 입력 중인 초안을 삭제하지 않는다. 저장에 실패하면 오류를 드러내고 입력 내용과 현재 화면을 유지한다.
6. 앱의 한글·영어 설정에 맞춰 모든 화면 문구, 결과명, 선택지, 설명, 오류와 버튼을 한 파일에서 관리하며 일관된 언어로 표시한다. 저장하는 결과·카테고리 값은 화면 번역과 분리한다.

### R2 — Add an after-meal photo

1. 카메라 촬영, 갤러리, 파일 선택의 세 경로를 제공한다. 파일 선택은 지원되는 이미지 형식만 받아들이고 권한은 해당 경로를 선택할 때 요청한다.
2. 안내 카드에 한 접시 전체가 보이는 예시 사진과 좋은 조명, 중앙 배치, 음식이 잘 보이도록 촬영하라는 팁을 표시한다. 초안 자동 저장 안내를 함께 보여준다.
3. Figma [96:942](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=96-942)의 화면 제목은 `after-meal photo`인데 안내 카드에는 `Add a before-meal photo`가 남아 있다. C에서는 식후 사진을 받는 단계이므로 안내 문구도 **after-meal photo / 식후 사진**으로 표시한다. 기존 B 사진과 혼동하거나 덮어쓰지 않는다.
4. 선택기를 취소하거나 권한이 거부되어도 현재 사진과 초안은 유지한다. 지원하지 않는 파일이나 열 수 없는 이미지는 선택되지 않은 것으로 처리하고 다시 선택할 수 있게 한다.

### R3 — Check your photo

1. 선택한 식후 사진을 `After-meal photo` 미리보기로 보여준다. 사진을 누르거나 `Tap to view full photo`를 누르면 별도 전체 화면에서 비율을 유지하며 사용 가능한 화면에 크게 표시한다.
2. `Replace photo`는 카메라·갤러리·파일 경로로 다시 선택할 수 있게 한다. 교체를 취소하면 기존 사진을 유지한다. `Remove photo`는 식후 사진만 제거한다.
3. 사진이 기기에 남는 시점과 분석·저장 선택 시 전송될 수 있음을 안내한다. `Use this photo`를 누르면 비교 화면으로 이동한다.
4. 화면 헤더, 5분할 진행 표시, 뒤로 가기, 사진 액션과 하단 CTA의 위치·상태는 [39:5713](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=39-5713)과 [96:1020](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=96-1020)의 두 상태를 따른다.

### R4 — Compare before and after

1. 확인한 before-meal과 after-meal 사진을 한 카드에 병렬로 보여주고 각각 `BEFORE`, `AFTER` 라벨을 붙인다. `Tap to enlarge`는 두 사진을 식별할 수 있는 큰 보기로 연결하고 뒤로 돌아올 수 있어야 한다.
2. `Compare with AI`와 `Enter Comparison manually`를 각각 제공한다. 수동 입력을 택하면 AI 비교 요청을 보내지 않고 음식별 결과 입력으로 간다.
3. AI 비교 전에 이 식사의 사진이 분석 제공자에게 전송될 수 있음을 명시한다. 별도 동의 없이 AI 학습에 쓰지 않는다는 문구와 `How photo data is used` 링크를 표시한다. 이는 B의 사진 처리 안내와 모순되지 않아야 한다.
4. AI 비교는 Feature Hook이 `data/queries`의 mutation을 통해 요청한다. 서버가 없는 프로토타입에서는 `data/api`의 mock 함수를 사용하며 결과는 보호자가 확인하기 전까지 suggestion이다.
5. 비교에는 두 사진과 해당 Meal ID를 사용한다. 둘 중 필요한 사진을 읽을 수 없다면 비교 성공으로 진행하지 않고 사진 확인·선택으로 돌아갈 수 있게 한다.

### R5 — Comparing photos and failure recovery

1. 비교 중에는 `Comparing photos...`, 진행 바/스피너, 현재 작업 안내, 분석 중인 사진, 초안 저장 상태와 `Cancel safely`를 보여준다. 표시된 시간 값은 실제 경과 상태를 반영하고 Figma 예시 `07 sec`를 고정하지 않는다.
2. 다른 화면으로 이동하거나 안전하게 취소해도 before/after 사진과 현재 초안을 보존한다. 취소된 응답이 뒤늦게 도착해도 결과 화면을 덮어쓰지 않는다.
3. 비교 실패 시 `We couldn’t compare the photos`, `Analysis Failed`와 두 사진이 안전하게 남아 있음을 표시한다. `Retry comparison`은 같은 사진으로 새 요청을 시작하고 `Enter outcomes manually`는 AI 제안 없이 결과 입력으로 간다.
4. 실패, 취소, 빈 분석 결과를 정상적인 비교 성공이나 실제 섭취 결과로 표시하지 않는다.

### R6 — What happened with each food item?

1. Meal의 음식 수와 음식 목록을 보여준다. AI 비교에서 제안한 음식·재료별 결과는 `AI suggestion` 출처와 제안 상태를 구분해 표시한다. 수동 입력 경로에는 AI suggestion을 표시하지 않는다.
2. 각 음식과 화면에 표시된 각 재료에 대해 `Eaten`, `Tasted`, `Untouched`, `Unclear` 중 정확히 하나의 결과를 보호자가 선택·변경할 수 있어야 한다. 음식 전체의 결과와 재료별 결과는 별도 값이며 하나를 바꿨다고 다른 값이 임의로 확정되지 않는다.
3. AI 제안은 선택하거나 수정할 때만 확정된다. 선택 전 제안이 표시되더라도 확정된 보호자 입력과 시각적·데이터상으로 구분한다. Figma의 `Eaten SUGGESTED`와 보호자가 선택한 진한 단색 버튼 상태를 각각 지원한다.
4. `edit info` 또는 `Edit served foods`는 B의 음식 정보 편집으로 이동한다. 음식 이름·재료를 수정한 후 돌아오면 변경된 목록이 결과 화면에 반영되어야 하며, 유지 가능한 기존 결과는 보존한다. 제거된 음식·재료에 고아 결과를 남기지 않는다.
5. `?`를 누르면 Outcome definitions 팝업이 열려야 한다. `Got it`, 닫기, 시스템 뒤로 가기로 닫으면 기존 선택을 유지한다.
6. `Continue`는 모든 필수 음식·재료 결과가 보호자에 의해 답변된 경우에만 다음 단계로 간다. `Unanswered`는 저장할 수 없고, 결과를 모르면 `Unclear`를 명시적으로 선택할 수 있다.
7. 사진 비교가 음식의 양을 정확히 측정했다고 가정하지 않는다. 결과는 관찰한 사실을 보호자가 확정한다.

### R7 — Outcome definitions

| 상태 | 화면 설명과 저장 의미 |
|---|---|
| Eaten / 먹음 | 삼킨 양이 확인됨. |
| Tasted / 맛봄 | 핥거나 맛봤지만 삼킨 것은 확인되지 않음. |
| Untouched / 먹거나 맛보지 않음 | 먹거나 맛보지 않음. 보기·냄새 맡기·만지기·옮기기는 별도 경험으로 기록할 수 있음. |
| Unclear / 확인 어려움 | 실제로 어떤 일이 있었는지 판단할 수 없음. |
| Unanswered / 미응답 | 아직 보호자가 답하지 않음. 저장 불가하며, 결과를 모르면 Unclear를 선택하라는 안내를 표시함. |

팝업은 정확한 양을 추정할 필요가 없다고 안내한다. `Unanswered`는 네 가지 결과 중 하나가 아니라 입력 상태이며, `Unclear`로 자동 치환하지 않는다. [Outcome definitions](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=65-3)의 뒷배경은 dim 처리한다.

### R8 — What made this food difficult? (Optional)

1. 음식별로 `Select category`, `value`, `+ Add` 행을 제공한다. 이 단계는 Optional이고, `Continue`는 입력한 내용을 저장해 진행하며 `Skip`은 추가 입력 없이 진행한다. 뒤로 돌아오면 이전에 추가한 값은 유지한다.
2. Category 드롭다운에는 아이콘과 함께 `Texture`, `Taste type`, `Taste intensity`, `Smell`, `Color`, `Shape and size`, `Ingredient visibility`, `Temperature`, `Not sure`를 표시한다. 카테고리를 바꾸면 값 선택지는 그 카테고리의 것만 보여준다.
3. `Texture`는 `Smooth/creamy`, `Soft/mushy`, `Lumpy/chunky`, `Crunchy/crisp`, `Chewy/tough`, `Wet/slippery`, `Mixed textures`, `Other`를 제공한다. `Taste type`은 `Sweet`, `Salty`, `Sour`, `Bitter`, `Spicy/hot`, `Other`를 제공한다. 두 카테고리는 한 음식에 여러 값을 추가할 수 있다.
4. `Taste intensity`는 `Mild`, `Strong`을 제공한다. `Smell`은 `Strong`, `Mild`, `No noticeable smell`, `Not sure` 중 한 값만 허용한다. 단일 선택 카테고리의 새 값을 확정하면 기존 같은 카테고리 값을 대체하고, 다른 카테고리 값은 유지한다.
5. `Color` 값 목록은 색상 점과 함께 `Red`, `Orange`, `Yellow`, `Green`, `Blue`, `Purple`, `Brown`, `Black`, `White`, `Gray`, `Others`를 제공한다. 값 선택 후 Add하면 색상 점이 있는 제거 가능한 태그를 보여준다. `Others`를 택하면 실제 색을 입력하는 필드를 보여주며, 빈 입력은 추가하지 않는다.
6. `Shape and size` 값 목록은 `Consistent`, `Varied`, `Not sure`, `Optional note`를 제공한다. 추가된 값은 제거 가능한 태그로 표시한다. `Optional note` 또는 Figma의 `Not sure` 메모 상태에서는 모양·크기 설명을 입력할 수 있으며, 메모는 해당 음식의 Shape and size 정보로 저장한다.
7. `Texture: Other`처럼 직접 입력이 가능한 선택지는 선택 즉시 입력 필드를 보여주고, 사용자가 내용을 입력한 뒤 `+ Add`를 눌렀을 때만 태그로 확정한다. 입력 중 텍스트를 저장된 태그로 간주하지 않는다. 태그의 `×`로 해당 값만 제거할 수 있다.
8. `Ingredient visibility`와 `Temperature`는 B의 [Food traits selector](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=56-2558)에 있는 해당 카테고리 값을 재사용한다. `Not sure` 카테고리는 보호자가 어려움의 이유를 판단하지 못한 명시적 선택으로 보관한다.
9. 드롭다운 목록은 다른 음식의 필드나 하단 버튼의 레이아웃을 불필요하게 밀어내지 않는 오버레이로 표시한다. 긴 태그와 입력 필드는 잘리지 않고 줄바꿈·스크롤되며, 키보드가 열려도 현재 입력과 Continue/Skip에 접근할 수 있어야 한다.

### R9 — Exposure goal follow-up

1. B에서 이 Meal에 Exposure goal을 선택했다면 [Meal review · Exposure goal](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=72-668) 화면에 해당 음식과 보호자가 정한 실제 목표를 표시한다. 예시 문구 `Try one bite of the new food`를 모든 식사에 고정하지 않는다.
2. `Record what happened`는 해당 음식의 목표 달성·시도 내용을 기록하는 다음 흐름으로 이동한다. `Skip`은 목표 응답을 강제로 만들지 않고 다음 단계로 진행한다. 기존 목표 자체와 음식별 결과는 보존한다.
3. B에서 목표를 선택하지 않았다면 목표가 있는 것처럼 예시 카드를 띄우지 않는다. 목표 카드와 후속 기록은 Exposure Tracker의 음식별 단계 정보와 연결하되, 온보딩의 일반적인 친숙도만으로 단계를 확정하지 않는다.

### R10 — Saved suggestion feedback and next step handoff

1. 이전에 저장한 제안이 있다면 [Did you try a saved suggestion?](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=79-3)에 제안 카드를 겹친 덱으로 보여준다. Figma 예시는 3장이며 실제 저장된 제안 수만 표시한다. 각 카드에는 저장 상태, `WHAT TO TRY`, `WHY THIS MAY BE EASIER`, `SERVING TIP`을 표시한다.
2. 오른쪽 스와이프/`✓`는 시도함, 왼쪽 스와이프/`×`는 시도하지 않음으로 각 제안에 기록한다. `Go back`과 상단 뒤로 가기는 입력을 보존하며 이전 단계로 돌아간다. 실제 저장된 제안 내용으로 카드를 채우고 Figma 예시 문구를 고정하지 않는다.
3. [Recommended next step](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=79-223) 카드는 다음 제안 기능으로 넘어가는 경계 화면이다. `RECOMMENDED` 출처, 시도할 일·이유·serving tip, 카드 덱과 선택 동작을 표시한다. 추천 생성·안전성 판단 규칙은 D. Personalized Recommendation 명세에서 정의하며 C의 결과 데이터가 그 입력으로 전달된다.
4. 저장된 제안이 없거나 추천을 만들 수 없는 상태를 허위 카드로 채우지 않는다. C의 음식 결과와 선택적 어려움 기록은 저장한 뒤 다음 기능으로 전달한다.

### R11 — C 화면의 시각·조작 규칙

1. 사진 비교 카드에는 식전·식후 이미지가 동일한 높이의 두 칸으로 나란히 보이고, 각 이미지 위에 BEFORE/AFTER 배지를 둔다. 확대 동작은 카드 하단의 확대 아이콘과 텍스트로도 찾을 수 있어야 한다.
2. 결과 선택 행에는 네 상태를 같은 크기의 버튼으로 배치한다. 미선택은 밝은 배경과 테두리, 보호자가 확정한 선택은 진한 파란 채움, AI가 제안만 한 값은 분홍 테두리와 `SUGGESTED` 문구로 구분한다. 색만으로 출처나 상태를 표현하지 않는다.
3. 음식 제목과 그 아래 재료 이름·결과 행의 들여쓰기를 구분한다. 결과 항목이 많으면 내용을 스크롤하되 하단 Continue에 계속 접근할 수 있어야 한다. 설명 팝업은 배경을 어둡게 하고 가운데에 내용을 보여주며 닫기 동작을 제공한다.
4. 어려움 기록은 음식 이름마다 카테고리 드롭다운, 값 드롭다운, 파란 `+ Add` 버튼을 한 행으로 둔다. 선택 목록은 각 입력 너비에 맞춰 나타나고 선택 후 해당 음식 아래에 초록 계열의 제거 가능한 태그를 보여준다. Color 태그에는 선택한 색의 점을 함께 표시한다.
5. Optional 단계의 Continue/Skip, 비교 실패 화면의 Retry/수동 입력, Exposure goal 화면의 Record/Skip은 주 동작과 보조 동작의 대비를 유지한다. 작은 화면과 키보드가 열린 상태에서도 필드·태그·하단 동작이 잘리지 않아야 한다.

## Data and integration rules

- 식후 기록은 Meal ID에 연결한다. Before 사진과 After 사진은 별도 필드로 다루고, 식후 사진 교체·삭제가 식전 사진을 변경하지 않는다.
- 음식과 재료의 결과는 각각 안정적인 ID에 매핑한다. AI suggestion 값, 보호자 확정 값, 미응답 상태를 구분한다. 결과 정의의 `Unclear`는 미응답과 다르다.
- 어려움 기록은 음식 ID, 카테고리, 선택 값 또는 직접 입력 메모로 저장한다. 단일 선택과 복수 선택 규칙은 R8을 따른다.
- 비교 요청·저장·불러오기는 Screen, Feature Hook, `data/queries`와 `data/api`의 책임에 따라 처리한다. 서버 없는 프로토타입의 API 동작은 `data/api`의 mock으로 제공하며, 취소·실패·재시도·초안 복원은 동일한 화면 상태 규칙을 지킨다.
- 음식 정보 자체의 편집은 B의 동일한 Meal/food 레코드에 반영한다. 변경 후 결과 입력으로 돌아올 때 ID가 같은 음식·재료의 사용자 확정 결과를 보존한다.

## Edge Cases

- 시작한 Meal에 식전 사진이 없거나 사진 파일을 읽을 수 없음
- 식후 사진 촬영 권한 거부, 선택기 취소, 파일 형식 불일치, 손상된 사진
- 식후 사진 미리보기에서 확대·교체·삭제한 뒤 다시 선택
- 비교 중 앱 이탈·취소·재진입, 늦게 도착한 비교 응답
- 비교 실패·빈 결과·재시도·수동 결과 입력
- 음식 수가 변하거나 B에서 재료를 편집·추가·삭제한 뒤 결과 화면으로 복귀
- AI가 음식별 결과와 재료별 결과를 다르게 제안하거나 일부 값만 제안
- 보호자가 제안된 값을 그대로 확인하거나 다른 결과로 수정
- 결과를 모르는 항목에 Unclear를 선택함과 항목을 아예 답하지 않은 상태의 차이
- 결과 설명 팝업을 열고 닫아도 입력 상태 유지
- 어려움 기록의 category만 선택, value만 선택, Other 메모 입력 후 Add하지 않음
- 한 음식에 여러 Texture/Taste type/Color 태그, 단일 선택 Smell·Taste intensity 변경
- Optional note 추가·삭제, Not sure 선택, 단계 전체 Skip
- Exposure goal이 없거나, 있어도 결과 기록을 Skip함
- 저장된 제안이 0개이거나 3개보다 적음, 제안 카드에 예/아니요를 기록한 뒤 뒤로 감
- 자동 저장 또는 최종 저장 실패, 앱 재실행 후 초안 복원

## Acceptance Criteria

Given 보호자가 저장된 Meal의 After-meal Review를 시작했고<br>
When 카메라·갤러리·파일에서 식후 사진을 선택하면<br>
Then 해당 Meal의 식전 사진은 유지되고 식후 사진 미리보기가 표시된다.

Given 식후 사진 미리보기가 표시되고<br>
When 전체 화면 보기·교체·삭제 중 하나를 선택하면<br>
Then 각 동작이 식후 사진에만 반영되며 뒤로 돌아올 수 있다.

Given 식전·식후 사진이 모두 있고<br>
When Compare with AI를 누르면<br>
Then 사진 전송 안내가 표시된 상태에서 비교가 시작되고 진행 상태와 안전한 취소 동작이 제공된다.

Given 사진 비교가 실패했고<br>
When 실패 화면에서 Retry comparison 또는 Enter outcomes manually를 누르면<br>
Then 두 사진과 초안을 유지한 채 재시도하거나 AI suggestion 없는 결과 입력으로 이동한다.

Given 비교 결과가 Eaten을 제안했지만 보호자가 아직 확인하지 않았고<br>
When 결과 화면을 보면<br>
Then AI suggestion으로 표시되며 보호자 확정 결과나 저장 가능한 답변으로 취급되지 않는다.

Given 보호자가 음식 결과는 Eaten, 재료 결과는 Untouched로 각각 선택했고<br>
When 다음 단계로 진행하면<br>
Then 두 결과가 독립적으로 저장된다.

Given 결과 화면에 미응답 항목이 있고<br>
When Continue를 누르면<br>
Then 미응답 항목을 알려주고 진행하지 않는다. 보호자가 Unclear를 명시적으로 선택하면 진행할 수 있다.

Given 결과 화면에서 `?`를 눌렀고<br>
When Outcome definitions를 닫으면<br>
Then Eaten/Tasted/Untouched/Unclear/Unanswered의 설명을 확인한 뒤 기존 선택을 유지한다.

Given 음식 정보 자체가 틀렸고<br>
When edit info에서 음식·재료를 수정한 뒤 돌아오면<br>
Then 새 목록이 결과 화면에 반영되며 유지 가능한 사용자 확정 결과는 남는다.

Given 보호자가 어려움 기록에서 Texture의 Other를 선택했고<br>
When 내용을 입력해 `+ Add`를 누르면<br>
Then 해당 음식 아래에 제거 가능한 태그가 생긴다. Add 전 입력은 태그로 저장되지 않는다.

Given 보호자가 Smell의 한 값을 추가했고<br>
When 다른 Smell 값을 추가하면<br>
Then 같은 음식의 Smell 값은 새 값 하나가 되며 다른 카테고리 태그는 유지된다.

Given 보호자가 어려움 기록을 원하지 않고<br>
When Skip을 누르면<br>
Then 어려움 원인을 임의로 만들어 저장하지 않고 다음 단계로 이동한다.

Given 이 Meal에 Exposure goal이 있고<br>
When 목표 화면에서 Record what happened 또는 Skip을 누르면<br>
Then 실제 목표를 대상으로 기록하거나 응답 없이 지나가며 기존 목표와 음식 결과는 유지된다.

Given 이전에 저장한 제안이 있고<br>
When 제안 카드를 스와이프하거나 `×`/`✓`를 누르면<br>
Then 해당 제안의 시도 여부가 기록되고 다음 카드로 진행한다.

Given 보호자가 식후 검토 도중 앱을 종료했고<br>
When 같은 Meal의 검토를 다시 열면<br>
Then 마지막으로 저장한 단계, 두 사진과 보호자가 확정한 결과·태그가 복원된다.
