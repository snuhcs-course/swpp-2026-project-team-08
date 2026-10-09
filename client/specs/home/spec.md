<!-- This Code is generated with AI -->

# Home — Today

## Goal

보호자가 오늘의 식사 기록을 시작하고, 아동의 음식 경험 진행 상황과 저장된 다음 시도 제안, 최근 식사 기록 날짜를 한 화면에서 확인한다. 각 카드의 값은 보호자가 확인·저장한 데이터에서 가져오며, Figma의 예시 이름·음식·날짜·단계를 실제 기록처럼 보여주지 않는다.

## Design Document

기준 화면은 [Home — 전체 화면](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=37-3607)이다. [390 × 844 기본 프레임](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=37-3369)은 달력 아래가 화면 밖으로 이어지는 상태를, [달력 범례 변형](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=52-1418)은 `Logged`/`Unlogged` 범례를 보여준다.

| 영역 | Figma 노드 | 화면에 반영할 내용 |
|---|---|---|
| 날짜·인사말·아바타 | [37:3619](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=37-3619) | 날짜, 보호자 이름을 넣은 인사말, 이름 이니셜 |
| 다음 식사 카드 | [37:3625](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=37-3625) | `NEXT UP`, 식사 유형, 안내 문구, 카메라 아이콘이 있는 `Log this meal` |
| SOS Progress | [37:3635](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=37-3635) | 항목 수, 음식별 아이콘·이름·기록된 단계·짧은 설명, `+` 진입점 |
| Recommended action goals | [37:3661](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=37-3661) | 저장된 제안의 짧은 제목·설명과 `Try` 동작 |
| Meal Log Calendar | [37:3731](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=37-3731), [52:1486](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=52-1486) | 표시 월, 요일, 식사 기록 날짜, 상태 설명 또는 범례 |
| 하단 탐색 | [37:3814](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/NurtureBites?node-id=37-3814) | Today, Meal Log, SOS, Ideas, Insight, Profile의 6개 목적지 |

색·서체·카드 치수·달력 칸·하단 탐색의 공통 규칙은 [`specs/ui-components/spec.md`](../ui-components/spec.md)를 따른다. 기준 파일에는 이 홈 화면의 기본 상태와 달력 범례 변형만 있다. 위젯이 비었을 때의 그림, 월 선택 팝업, 날짜 선택 뒤 화면, 다른 하단 탭의 화면은 이 프레임만으로 확정하지 않는다.

## User Flow

1. 온보딩을 완료한 보호자가 Today 홈에 진입한다.
2. 현재 날짜와 보호자 이름을 확인하고, 다음 식사 카드에서 `Log this meal`을 눌러 Meal Check-in을 시작한다.
3. SOS Progress에서 실제로 추적 중인 음식과 기록된 경험 단계를 확인한다.
4. 저장된 다음 시도 제안이 있으면 Recommended action goals에서 확인하고 `Try`로 제안 화면을 연다.
5. Meal Log Calendar에서 식사를 저장한 날짜를 확인한다.
6. 하단 탭에서 다른 제품 영역으로 이동한다.

## Requirements

### R1 — 진입과 화면 데이터

1. 온보딩을 완료하면 Today 홈으로 진입할 수 있어야 한다. 홈에 다시 돌아오면 최신 프로필, 식사, 음식 경험 및 저장된 제안을 읽어 화면을 갱신한다.
2. 보호자 이름은 계정에 입력한 이름을 사용한다. Figma의 `Luna`와 아바타의 `L`을 고정하지 않는다. 이름이 없으면 근거 없는 임의 이름이나 이니셜을 만들지 않는다.
3. 홈의 날짜는 기기의 현재 날짜를 앱 언어 설정에 맞춰 표시한다. Figma의 `SATURDAY · 26 SEPTEMBER`는 예시다. 인사말의 시간대 표현도 실제 현지 시간과 맞아야 한다.
4. 각 위젯은 로딩·데이터 없음·읽기 실패를 구분한다. 데이터가 없거나 읽기에 실패했을 때 Figma의 당근, 브로콜리, 단계, 4 items, 날짜, 추천 문구를 실제 값처럼 표시하지 않는다.

### R2 — 다음 식사 기록 카드

1. 인사말 아래의 진한 남색 `NEXT UP` 카드에 식사 유형, 제목, 짧은 설명, `Log this meal` 버튼을 배치한다. 실제 다음 식사 유형을 확정할 근거가 없으면 Figma의 `LUNCH`를 고정하지 않고 일반적인 식사 기록 문구를 사용한다.
2. 버튼은 Meal Check-in의 새 식사 기록 흐름으로 이동한다. 식사 초안이 있다면 초안 재개와 새 식사 시작을 구분해 보호자의 기존 입력을 잃지 않게 한다.
   작성 중인 Meal Check-in 초안이 있으면 이를 이어서 완료한 뒤 식후 검토로 진행할 수 있는 별도 동작도 제공한다. 초안 확정·저장에 실패하면 식후 검토로 이동하지 않는다.
3. 카드의 예시 문구 `Ready when you are`와 사진 설명은 앱 언어에 맞춰 표시한다. 음식 인식 또는 식후 결과가 이미 확정된 것처럼 표현하지 않는다.

### R3 — SOS Progress 위젯

1. `SOS Progress` 제목과 보조 설명, 전체 추적 항목 수를 나타내는 상태 필을 표시한다. 미리보기 행에는 대상 음식별 이름, 기록된 단계, 설명이 있으면 그 내용을 표시한다.
2. 단계는 해당 음식에 실제로 저장된 Exposure Tracker 기록에서 가져온다. 온보딩의 일반적인 새 음식 친숙도나 Meal Check-in에서 음식 하나를 목표로 선택한 사실만으로 `Stage 1` 또는 다른 단계를 자동 설정하지 않는다.
3. 상태 필은 전체 추적 항목 수, 행은 미리보기 항목 수를 나타낸다. Figma의 `4 items`와 두 음식 행은 이 차이를 보여주는 예시다. 실제 전체 수와 미리보기 내용은 같은 저장 데이터에서 계산한다.
4. 위젯의 음식 행과 `+` 표시는 Figma에 보이지만 탭 후 동작은 정의되어 있지 않다. 추적 기록이 없으면 가짜 단계·진행 설명 없이 빈 상태를 보여준다. 진입 동작은 SOS/Exposure Tracker 명세에서 정한다.

### R4 — Recommended action goals 위젯

1. 저장되어 있고 현재도 안전 조건을 만족하는 실제 제안만 보여준다. 제목·설명·대상 음식은 [`specs/personalized-recommendation/spec.md`](../personalized-recommendation/spec.md)의 저장된 제안과 일치해야 한다.
2. `Try`는 표시된 제안을 열어 보호자가 내용을 검토할 수 있게 한다. `Try`를 누른 사실만으로 실제로 시도했다고 기록하지 않는다. 시도 여부는 이후 식후 검토에서 별도로 기록한다.
3. 제안이 없거나 최신 안전 정보를 다시 확인할 수 없으면 Figma의 `Put carrot next to fish` 예시를 노출하지 않는다. 제안이 없는 상태와 추천 기능으로 이동하는 동작을 구분한다.

### R5 — Meal Log Calendar

1. 표시 월, 월요일부터 일요일까지의 요일 머리글, 날짜 칸, 기록 여부 설명을 표시한다. 기본 월은 현재 현지 날짜의 월이며 `Sept`와 1–28일 배열을 고정하지 않는다.
2. 식사를 하나 이상 저장한 날짜는 파란색, 저장한 식사가 없는 날짜는 연한 파란색으로 구분한다. 상태는 Meal의 식사 날짜를 기준으로 계산하고 사진만 선택한 초안이나 식후 검토만 시작한 상태를 `Logged`로 세지 않는다.
3. 색만으로 상태를 전달하지 않는다. 기본 프레임의 설명 문구 또는 범례 변형의 `Logged`/`Unlogged`처럼 두 상태를 텍스트로도 이해할 수 있어야 한다.
4. 표시 월의 실제 날짜와 요일 배치를 사용한다. 5주·6주가 필요한 달, 윤년 2월, 월 시작 전후의 빈 칸을 올바르게 처리한다. Figma의 4주 캘린더는 9월 일부를 보여주는 시각 예시로 취급한다.
5. 월 표시 필, 날짜 칸의 탭 동작과 이동 화면은 현재 Figma에 정의되어 있지 않다. 해당 동작을 추가할 때는 Meal Log의 날짜 탐색 명세와 함께 정한다.

### R6 — 하단 탐색

1. Today, Meal Log, SOS, Ideas, Insight, Profile의 6개 목적지를 아이콘과 텍스트로 표시한다. 현재 화면인 Today는 선택 상태로 구분한다.
2. 탭을 누르면 해당 제품 영역으로 이동한다. 아직 목적지 화면이 준비되지 않은 탭은 임의의 예시 데이터를 실제 화면처럼 보여주지 않는다.
3. 하단 바는 스크롤하는 홈 카드 아래에 고정하고 기기의 하단 안전 영역을 침범하지 않는다. 선택 상태는 색과 텍스트·접근성 상태로 함께 알린다.

### R7 — 화면 배치와 언어

1. 홈의 콘텐츠는 24 px 좌우 여백을 사용하고 날짜·인사말, 다음 식사 카드, SOS Progress, Recommended action goals, Meal Log Calendar 순서로 배치한다. 위젯 사이 간격과 내부 패딩은 공통 UI 명세의 Home 값을 따른다.
   전체 Figma 프레임에서 상태 영역은 높이 44 px이고, 그 아래 기준 인사말은 y=54, 식사 카드는 y=126, SOS 위젯은 y=338, 추천 목표 위젯은 y=567, 달력은 y=725에 시작한다. 이 값은 화면 구성 기준이며 운영체제의 상태 표시줄을 앱에서 다시 그리라는 뜻은 아니다.
2. 390 × 844 기본 프레임에서는 달력의 하단이 화면 밖으로 이어진다. 콘텐츠를 세로 스크롤할 수 있게 하고, 390 × 1122 전체 프레임처럼 마지막 날짜까지 접근 가능해야 한다. 하단 탐색은 콘텐츠와 겹치지 않는다.
3. 앱의 모든 제목, 인사말, 설명, 빈 상태, 오류, 버튼, 요일·월 이름은 한글·영어를 한 파일에서 관리하고 앱 언어 설정에 맞춰 표시한다. 이름·음식명 같은 보호자 입력은 번역된 고정 문구로 덮어쓰지 않는다.
4. 반복적으로 사용하는 색은 공통 색상 파일에서 관리한다. UI 컴포넌트는 데이터 접근 코드를 직접 호출하지 않고, Screen이 Feature Hook의 상태와 동작을 props로 전달한다.

## Edge Cases

- 보호자 이름이 비어 있거나 이름을 수정한 뒤 홈으로 돌아옴
- 자정 또는 시간대 변경 후 날짜와 인사말이 바뀜
- 오늘 기록할 식사 유형을 판단할 근거가 없음
- 작성 중인 Meal 초안이 있는 상태에서 `Log this meal`을 누름
- SOS 대상 음식이 없거나 단계가 아직 기록되지 않음
- 추적 음식 수가 Figma의 두 행·4 items 예시보다 많음
- 저장된 제안이 없거나 최신 알레르기·식이 제한 정보와 충돌함
- 식사 기록 날짜와 저장 시각이 다른 날짜임
- 월 첫날이 월요일이 아니거나 달력이 5주·6주를 필요로 함
- 홈 데이터 읽기 실패 또는 다른 화면에서 기록을 수정한 뒤 복귀함
- 화면 높이가 짧거나 시스템 글자 크기가 커서 달력과 하단 탐색이 동시에 보이지 않음

## Acceptance Criteria

Given 보호자가 온보딩을 완료했고 이름을 입력했으며<br>
When Today 홈을 열면<br>
Then 현재 날짜와 그 이름에 맞는 인사말·이니셜이 표시되고 Figma 예시 이름은 표시되지 않는다.

Given 보호자가 Today 홈의 다음 식사 카드에 있고<br>
When `Log this meal`을 누르면<br>
Then Meal Check-in으로 이동하며 작성 중인 초안은 임의로 삭제되지 않는다.

Given 작성 중인 Meal Check-in 초안이 있고<br>
When 홈에서 그 초안의 식후 기록 동작을 누르면<br>
Then 기존 초안에서 이어서 음식 정보를 확정할 수 있으며, 저장 성공 후에만 식후 검토가 열린다.

Given 아동의 음식 경험 단계가 실제로 기록되어 있고<br>
When SOS Progress를 보면<br>
Then 해당 음식과 저장된 단계가 표시되고 항목 수는 실제 목록과 일치한다.

Given 아동의 Exposure 기록이 없고<br>
When SOS Progress를 보면<br>
Then Figma의 `Stage 3` 같은 예시 단계 대신 기록이 없는 상태가 표시된다.

Given 안전성을 다시 확인한 저장 제안이 있고<br>
When Recommended action goals의 `Try`를 누르면<br>
Then 그 제안의 상세 화면이 열리며 실제 시도 여부는 변경되지 않는다.

Given 저장된 제안이 없거나 최신 제한과 충돌하고<br>
When 홈을 열면<br>
Then Figma 예시 추천을 실제 목표처럼 표시하지 않는다.

Given 표시 월에 서로 다른 날짜의 저장된 Meal이 있고<br>
When Meal Log Calendar를 보면<br>
Then Meal의 식사 날짜에 해당하는 칸만 `Logged` 상태로 표시된다.

Given 표시 월이 5주 또는 6주 배치를 필요로 하고<br>
When 달력을 보면<br>
Then 그 달의 날짜가 요일에 맞게 모두 표시되고 하단 바와 겹치지 않은 채 스크롤해 볼 수 있다.

Given Today 탭이 선택되어 있고<br>
When 하단 탐색의 다른 탭을 누르면<br>
Then 선택한 목적지로 이동하고 선택 상태가 아이콘 색과 접근성 정보에 반영된다.
