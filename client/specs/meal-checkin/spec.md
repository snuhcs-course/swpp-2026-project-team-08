# Meal Check-in

## Goal

보호자가 식사 날짜와 상황을 기록하고, 식사 사진을 분석하거나 음식 정보를 직접 입력해 Meal 기록 초안을 만든다. 사진 분석 결과는 제안으로 취급하며, 보호자가 확인하고 수정하기 전에는 확정된 음식 정보로 사용하지 않는다.

## Design Document

[Meal details — setting of the meal](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=94-191)

[Add before-meal photo](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=94-457)

[Before-photo preview](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=34-2819)

[Analyze or enter food items manually](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=34-2779)

[Analysis progress and recovery](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=34-2739)

[Analysis failed](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=34-2397)

[Review food items](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=96-821)

[Review or edit a food item](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=56-2424)

[Food traits selector](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=56-2558)

[Optional exposure goal](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=59-3335)

[Exposure Tracker explanation](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=39-5093)

공통 시각 규칙과 사진 미리보기, 진행 표시, Meal form 버튼은 [`specs/ui-components/spec.md`](../ui-components/spec.md)를 따른다. Figma의 진행 표시는 5개 segment로 구성된다.
입력 필드의 글자색과 키보드 대응, 한글·영어 표시는 온보딩과 같은 앱 공통 규칙을 따른다.

## User Flow

1. 보호자가 Meal Check-in을 시작한다.
2. 식사 날짜를 확인하거나 변경하고, 식사 유형과 장소/상황을 선택한다.
3. 카메라, 갤러리 또는 파일에서 한 장의 식사 사진을 추가한다.
4. 사진을 확인하고 필요하면 전체 화면으로 보거나 교체·삭제한다.
5. 사진 분석을 선택하거나 음식 정보를 직접 입력한다.
6. 사진 분석 중 취소할 수 있으며, 분석 실패 시 재시도하거나 수동 입력으로 전환한다.
7. 음식별로 인식된 정보를 보호자가 확인하거나 추가·수정·삭제한다.
8. Confirm food items로 음식 확인을 마친 뒤, 선택적으로 한 음식을 Exposure goal로 지정하거나 건너뛴다.
9. 보호자가 선택 또는 건너뛰기를 확정하면 Meal 기록을 저장한다.

## Requirements

### R1 — Meal details

1. 날짜, 식사 유형, 식사 장소/상황을 입력할 수 있어야 한다.
2. 날짜 입력은 날짜 선택 UI를 통해 변경할 수 있어야 한다.
   날짜 필드를 누르면 날짜 카드 안에 월·일·연도 필드가 펼쳐진다. 각 필드를 누르면 선택 목록은 날짜 카드의 자식 레이아웃이 아닌 별도의 오버레이에 나타나야 하며, 목록을 열고 닫아도 날짜 카드의 크기는 바뀌지 않아야 한다. 날짜 숫자와 선택 상태는 밝은 배경 위에 선명하게 표시한다. `Confirm date`를 눌러 선택을 확정한다.
   오늘 날짜는 `Today · 17 October` / `오늘 · 10월 17일`처럼 오늘 표시와 월·일을 함께 보여준다.
3. 식사 유형은 Breakfast, Lunch, Dinner, Snack 중 하나를 선택할 수 있어야 한다.
4. 장소/상황은 Home, Restaurant, School, Others 중 하나를 선택할 수 있어야 한다.
   한국어에서 Home 장소 선택지는 `집`으로 표시한다. School은 학교를 나타내는 아이콘, Others는 기타를 나타내는 아이콘을 사용한다.
5. 선택된 항목은 선택되지 않은 항목과 시각적으로 구분되어야 하며, 다시 선택해 변경할 수 있어야 한다.
6. Continue to photo를 누르면 사진 추가 단계로 이동해야 한다.

### R2 — Add a before-meal photo

1. 보호자는 카메라 촬영, 사진 보관함 선택, 파일 선택 중 하나로 사진을 추가할 수 있어야 한다.
2. 파일 선택은 지원되는 이미지 형식만 허용해야 한다.
3. 사진 안내에는 한 접시 전체가 보이는 사진을 권장한다는 점과, 좋은 조명·접시 중앙 배치·음식이 잘 보이도록 촬영하라는 팁을 표시해야 한다.
   안내 카드에는 Figma의 예시 식사 사진을 함께 표시한다.
4. 카메라 또는 사진 보관함 권한은 보호자가 해당 입력 방식을 선택한 뒤 요청해야 한다.
5. 사진이 아직 선택되지 않은 상태를 구분하고, 사진을 선택한 뒤 미리보기 단계로 이동해야 한다.

### R3 — Review the photo

1. 선택한 사진을 화면에 표시해야 한다.
2. 사진을 누르면 작은 팝업이 아닌 전체 화면 사진 보기로 이동해야 한다. 사진은 비율을 유지하면서 화면의 사용 가능한 너비와 높이에 맞게 크게 표시되고, Go back 및 시스템 뒤로 가기로 미리보기로 돌아올 수 있어야 한다.
3. Replace photo를 누르면 다른 사진을 선택할 수 있어야 한다.
4. Remove photo를 누르면 현재 사진이 제거되어야 한다.
5. 사진 전송 안내에는 보호자가 분석을 시작하거나 명시적으로 저장하기 전까지 사진이 기기에 남는다는 점을 표시해야 한다.
6. Use this photo를 누르면 음식 입력 방법 선택 단계로 이동해야 한다.

### R4 — Analyze photo or enter food manually

1. 보호자는 사진 분석 또는 음식 정보 직접 입력 중 하나를 선택할 수 있어야 한다.
2. 분석 실행 전에, Analyze photo를 누르면 해당 식사의 사진이 분석 제공자에게 전송된다는 동의를 명확하게 안내해야 한다.
3. 사진은 별도의 동의 없이 AI 학습에 사용되지 않는다는 점을 함께 안내해야 한다.
4. 사진 사용 안내의 상세 내용을 확인할 수 있는 링크를 제공해야 한다.
5. Enter food items manually를 누르면 사진 분석을 실행하지 않고 음식 입력으로 이동해야 한다.
6. 사진 분석은 Repository를 통해 요청해야 한다. 서버가 없는 프로토타입에서는 Repository 내부 mock API를 사용한다.

### R5 — Analysis progress and recovery

1. 분석 중 진행 상태와 현재 사진을 표시해야 한다.
2. 보호자는 분석을 취소할 수 있어야 한다.
3. 분석이 실패하면 실패 상태를 안내하고 재시도와 수동 입력 경로를 제공해야 한다.
4. 분석 실패 시 기존 사진과 Meal 초안은 유지되어야 한다.
5. 실패 또는 네트워크 오류를 성공으로 표시하거나 음식 정보를 임의로 추정해서는 안 된다.

### R6 — Review food items

1. 분석으로 찾은 음식 수와 보호자 검토가 필요하다는 상태를 표시해야 한다. 수동 입력 항목만 있는 경우에는 AI suggestion 수가 아니라 전체 음식 항목 수를 표시한다.
2. 각 음식 카드는 음식 이름, 재료, 제공 형태, serving note, food traits, food history를 요약해 보여줘야 한다.
3. 음식 출처를 AI suggestion 또는 parent input으로 표시해야 하며 색상 외 텍스트 표기도 제공해야 한다. 보호자가 AI 제안 음식을 열어 확인·수정한 뒤 Save food를 누르면 그 음식의 출처는 Parent input으로 바뀌어야 한다.
4. 보호자는 음식 카드를 편집하거나 제거할 수 있어야 한다.
5. 보호자가 Add food item에서 음식 이름을 입력하고 Save food를 누르면 새 항목이 목록에 실제로 추가되고 Parent input으로 표시되어야 한다.
6. 음식 편집 화면에서 음식 이름을 수정하고 재료를 추가·제거할 수 있어야 한다.
7. 음식 편집 화면에서 제공 형태와 serving note를 수정할 수 있어야 한다.
8. 음식 편집 시트에서는 현재 Food traits를 읽기 전용 태그로 보여준다. 태그를 직접 눌러 켜거나 끌 수 없다. `Edit all traits →`를 누르면 별도의 Food traits selector로 이동한다.
   selector는 Texture·Taste type의 복수 선택, Taste intensity·Smell·Shape and size·Ingredient visibility·Temperature의 단일 선택, Color의 복수 선택을 제공한다. Color와 Shape and size에는 직접 입력과 Add 동작을 제공한다. `Save traits`는 선택 결과를 음식 편집 시트에 반영하고, Cancel은 변경을 버린다.
9. Food history는 자유 입력 필드가 아닌 드롭다운이어야 한다. 프로토타입에서는 `Usually accepted`, `Sometimes accepted`, `Not sure` 중 하나를 선택하거나 미선택 상태를 유지할 수 있으며, 선택 결과가 카드와 저장된 음식 정보에 반영되어야 한다.
10. 음식별 Exposure Goal 추가는 선택 사항이어야 하며, 이를 추가해도 음식 정보 확인·수정 흐름을 막지 않아야 한다.
11. AI 분석 결과는 보호자 확인 전 확정된 음식 정보로 취급하지 않아야 한다.

### R7 — Save meal

1. 보호자가 Confirm food items를 누르면 확인된 AI 제안 음식의 출처를 Parent input으로 바꾸고 `Add an exposure goal` 선택 시트를 열어야 한다. 이 단계에서는 아직 Meal 저장을 완료하지 않는다.
2. 기록에는 Meal 날짜, 유형, 장소/상황, 사진(있는 경우), 보호자가 확인한 음식 정보를 함께 저장해야 한다.
3. 보호자는 분석 결과가 없거나 분석을 건너뛴 경우에도 직접 입력한 음식 정보를 저장할 수 있어야 한다.
4. Meal 초안은 입력 도중 자동 저장되어야 하며, 화면에는 저장 상태를 표시해야 한다.
5. 저장 실패 시 현재 화면과 입력 내용을 유지하고 다시 시도할 수 있어야 한다.
6. 저장에 성공한 Meal의 ID를 완료 화면에서 보존하고, `After-meal Review` 동작으로 바로 그 Meal의 식후 검토를 시작할 수 있어야 한다. 저장 실패 상태에서는 식후 검토로 이동하지 않는다.
7. 보호자가 홈의 Meal Check-in 초안에서 식후 검토를 선택했다면, 초안의 음식 확인·선택적 Exposure goal 단계를 먼저 완료해 Meal을 저장한 뒤 저장된 ID로 식후 검토를 연다. 불완전한 초안을 저장된 Meal처럼 식후 검토에 전달하지 않는다.

### R8 — Optional exposure goal

1. `Add an exposure goal` 시트는 확인된 음식 목록을 표시하고, 보호자가 이번 식사에서 집중할 음식 하나를 선택할 수 있어야 한다.
2. `Select this meal as exposure goal`을 누르면 선택한 음식 ID를 Meal에 저장하고 온보딩 답변만을 근거로 Exposure 단계를 자동 설정하지 않아야 한다.
3. `Skip exposure goal`을 누르면 목표 음식 없이 Meal을 저장해야 한다.
4. 시트의 `?`를 누르면 Exposure Tracker가 음식별 익숙함과 작은 시도를 기록한다는 안내 및 Look·Interact·Smell·Touch·Taste/Lick·Swallow의 6단계 설명 바텀시트가 열려야 한다. 뒤로 가면 음식 선택 상태를 유지한 채 목표 선택 시트로 돌아와야 한다.
5. 목표 선택 또는 건너뛰기 이후 저장에 실패하면 확인한 음식과 목표 선택을 유지하고 다시 시도할 수 있어야 한다.

## Edge Cases

- 날짜 선택기를 열고 닫거나 날짜를 변경함
- 식사 유형 또는 장소/상황을 선택하지 않거나 이후 선택을 변경함
- 권한이 거부되거나 사진 선택기를 취소함
- 지원하지 않는 형식이거나 손상된 이미지 파일을 선택함
- 미리보기에서 사진을 교체하거나 제거함
- 사진 전체 화면 보기에서 Go back 또는 시스템 뒤로 가기로 복귀함
- 사진 분석 동의를 하지 않고 이전 화면으로 돌아감
- 분석 중 취소하거나 네트워크 오류가 발생함
- 분석 결과가 비어 있거나 일부 음식만 인식됨
- 분석에 실패한 뒤 재시도하거나 직접 입력으로 전환함
- 인식된 음식의 이름, 재료, 제공 형태 또는 serving note를 수정함
- 음식의 재료를 추가하거나 제거함
- 음식 항목을 제거하거나 새 항목을 추가함
- AI 제안 음식이 보호자 편집·확인을 거쳐 Parent input으로 전환됨
- Food history 드롭다운에서 선택을 바꾸거나 선택하지 않음
- Food traits를 입력하지 않거나 일부만 선택함
- Food traits 태그를 눌렀을 때 편집되지 않음, selector에서 선택 후 저장 또는 취소함
- Exposure Goal을 추가하거나 추가하지 않음
- Confirm food items 이후 목표 음식 선택 또는 건너뛰기, `?` 설명 시트에서 돌아오기
- 음식을 입력하지 않은 상태로 저장하려고 함
- 저장 전에 화면을 이탈하거나 앱을 종료함
- 자동 저장 또는 최종 저장에 실패함

## Acceptance Criteria

Given 보호자가 Meal details 화면에 있고<br>
When 식사 날짜, 유형, 장소/상황을 선택한 뒤 Continue to photo를 누르면<br>
Then 선택한 Meal 정보가 유지된 채 사진 추가 화면으로 이동한다.

Given 보호자가 Meal details의 날짜 필드를 눌렀고<br>
When 펼쳐진 월·일·연도를 선택해 Confirm date를 누르면<br>
Then 선택한 날짜가 화면의 날짜 필드에 반영되고 오늘이면 Today/오늘 표시가 함께 나타난다.

Given 월·일·연도 필드가 날짜 카드에 표시되어 있고<br>
When 어느 필드의 선택 목록을 열면<br>
Then 목록은 카드 밖 오버레이에 표시되며 날짜 카드의 높이는 바뀌지 않는다.

Given 보호자가 사진 추가 화면에 있고<br>
When 카메라, 갤러리 또는 파일에서 지원되는 사진을 선택하면<br>
Then 선택한 사진의 미리보기가 표시된다.

Given 사진 미리보기 화면에 사진이 표시되어 있고<br>
When Replace photo 또는 Remove photo를 누르면<br>
Then 사진이 교체되거나 제거되고 해당 변경 상태가 화면에 반영된다.

Given 사진 미리보기 화면에 사진이 표시되어 있고<br>
When 사진이나 전체 화면 보기 동작을 누르면<br>
Then 사진이 전체 화면의 사용 가능한 영역에 크게 표시되고 뒤로 돌아올 수 있다.

Given 보호자가 사진 분석 화면에 있고<br>
When Analyze photo를 선택하면<br>
Then 사진이 분석 요청으로 전달되고 분석 진행 상태가 표시된다.

Given 보호자가 분석 대신 수동 입력을 선택했고<br>
When Enter food items manually를 누르면<br>
Then 분석 요청 없이 음식 직접 입력 화면으로 이동한다.

Given 사진 분석이 진행 중이고<br>
When 보호자가 Cancel analysis를 누르면<br>
Then 분석 요청이 취소되고 Meal 초안과 사진은 유지된다.

Given 사진 분석에 실패했고<br>
When 실패 화면이 표시되면<br>
Then 보호자는 재시도하거나 음식 정보를 직접 입력할 수 있다.

Given 사진 분석 결과가 표시되어 있고<br>
When 보호자가 음식 카드를 수정하거나 제거하고 새 항목을 추가하면<br>
Then 변경 사항이 화면에 반영되고 AI 제안과 보호자 입력의 출처가 구분된다.

Given AI suggestion 음식의 편집 화면에 있고<br>
When 보호자가 Save food를 누르면<br>
Then 해당 음식이 Parent input으로 바뀌어 목록과 초안에 저장된다.

Given 보호자가 Add food item에서 새 음식 이름을 입력했고<br>
When Save food를 누르면<br>
Then 새 음식이 Parent input 항목으로 목록에 추가된다.

Given 보호자가 음식 편집 화면에서 Food history를 눌렀고<br>
When 드롭다운 값을 선택해 Save food를 누르면<br>
Then 선택값이 음식 카드와 저장된 초안에 반영된다.

Given 보호자가 음식 편집 시트에서 Food traits 태그를 보고 있고<br>
When 태그를 누르거나 Edit all traits를 누르면<br>
Then 태그를 누른 경우 값은 바뀌지 않고, Edit all traits를 누른 경우에만 selector가 열려 선택·저장할 수 있다.

Given 보호자가 음식 정보를 검토하고 있고<br>
When Confirm food items를 누르면<br>
Then Add an exposure goal 시트가 열리고 음식 하나를 선택하거나 건너뛸 수 있다.

Given Add an exposure goal 시트에서 음식을 선택했고<br>
When Select this meal as exposure goal을 누르면<br>
Then 선택한 음식과 보호자가 확인한 음식 정보 및 Meal 세부 정보가 함께 저장된다.

Given Add an exposure goal 시트가 열려 있고<br>
When ?를 누르면<br>
Then Exposure Tracker 설명 바텀시트가 열리고, 뒤로 돌아오면 선택한 음식은 유지된다.

Given 보호자가 Meal Check-in 도중 앱을 종료했다가 다시 열었고<br>
When 저장된 진행 상태를 불러오면<br>
Then 마지막으로 자동 저장된 Meal 정보와 단계에서 이어서 입력할 수 있다.

Given 보호자가 Meal Check-in을 완료해 Meal 저장에 성공했고<br>
When 완료 화면에서 After-meal Review를 누르면<br>
Then 방금 저장한 Meal ID로 식후 검토가 열린다.

Given 보호자가 홈에 저장된 Meal Check-in 초안이 있고<br>
When 그 초안의 식후 기록 동작을 선택해 음식 확인과 목표 선택 또는 건너뛰기를 마치면<br>
Then 초안이 Meal로 저장된 후 같은 Meal의 식후 검토가 열린다.

Given 초안에서 식후 기록으로 이어가던 중 Meal 저장에 실패했고<br>
When 저장 오류가 표시되면<br>
Then 초안과 현재 입력을 유지하고 식후 검토로 이동하지 않는다.
