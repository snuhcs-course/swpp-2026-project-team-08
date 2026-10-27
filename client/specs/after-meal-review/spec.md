<!-- AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo -->
<!-- Changed: 화면 디자인 및 식사 흐름 개선 -->
<!-- AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo -->
<!-- Changed: 식후 검토 글자 크기 및 줄바꿈 기준 -->

# After-meal Review

## Goal

저장된 Meal의 실제 음식별 결과와 선택한 재료의 결과, 선택적 어려움을 보호자가 확인하고 저장한다. 사진·어려움 입력은 생략 가능하며 사진으로 먹은 양이나 결과를 추정하지 않으며 사용자가 직접 선택한 결과만 저장한다.

## Design Document

[최종 ABC — C](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/ABC?node-id=455-1277)

근거: 사진 `455:6876`·`455:4395`·`455:10254`, 비교 `455:4552`, 결과 `455:10470`·`455:10391`, 편집 `455:10537`, 정의 `455:4291`, 어려움 `455:4206`·`455:4093`·`455:3777`·`798:2611`, 맛 `455:6677`, 냄새 `455:6596`, 색 `455:5627`, 배치 `455:6070`, 재료 크기 `815:2907`, 온도 `455:6335`, 저장 `455:9982`·`455:10206`·`455:9892`.

## User Flow

1. 저장된 Meal ID로 식후 검토를 열고 기존 초안을 복원한다.
2. 식후 사진을 선택·확인하거나 Skip photo로 직접 결과를 입력한다.
3. 음식 전체의 결과를 선택한다. 별도로 관찰하려는 재료를 토큰에서 골라 그 결과를 입력한다.
4. 선택적으로 음식별 어려움 원인을 추가하거나 Skip한다.
5. 어려움 화면의 Continue 또는 Skip에서 바로 식후 검토를 저장한다. 저장 중 → 실패 시 Retry 또는 저장 완료로 진행한다.
6. 저장 성공 후 View Meal Suggestions 또는 홈으로 이동한다.

## Requirements

### R1 — 초안과 사진

- Meal·음식·재료의 안정적인 ID를 사용한다. 초안 자동 저장과 Save as Draft & Exit를 제공하며 저장 성공 후에만 홈으로 나간다.
- 카메라·갤러리·파일 선택, 미리보기·전체 보기·교체·제거를 제공한다. 기존 before 사진은 변경하지 않는다. 소스 선택 취소·잘못된 이미지는 현재 식후 사진과 입력을 보존한다.
- Skip photo는 사진 없이 결과 입력으로 이동한다. afterPhoto가 null이어도 수동 결과를 저장할 수 있다.
- 전후 사진이 모두 있으면 Review meal photos에서 참고용으로 나란히 보여준다. Enter food outcomes는 분석 없이 결과 입력으로 이동한다. 어느 사진이 없어도 직접 결과 입력이 가능하다.
- 두 사진은 높이 230px 카드 안에서 비율을 유지하고 사진 높이를 카드 높이에 맞춘다. 세로 사진은 위아래 여백 없이 높이에 맞고 좌우 남는 공간은 배경 여백으로 둔다. 확대 버튼은 사진 카드 밖 아래 중앙에 둔다. 가로 사진은 위아래 여백을 만들지 않고 좌우를 카드 경계에서 자른다.
- 사진 교체·제거·취소로 직접 선택한 결과·재료 선택·어려움·제안 피드백을 변경하지 않는다.
- 비교 요청·분석 진행·실패·AI 동의·자동 추천 결과는 제공하지 않는다. 이전 comparing/comparison-error 단계는 참고 사진 또는 결과 입력 단계로 복원하고 확정하지 않은 AI 제안만 지운다.

### R2 — 음식과 선택한 재료의 결과

- 음식 카드는 이름·Edit·Eaten/Tasted/Untouched/Unclear를 표시한다. 최초 결과는 모두 미선택이다. 사용자가 직접 선택한 결과만 연한 초록 배경과 초록 테두리로 구분한다. SUGGESTED 표시나 먹은 양의 미리 채우기는 없다.
- 모든 음식의 결과는 필수다. Unanswered와 명시적인 Unclear는 다르며 자동 대체하지 않는다.
- `Select Ingredients to log outcome` 아래에 그 음식의 재료 토큰을 표시한다. 선택한 재료에만 별도 결과 카드를 만들고 `Egg in Rolled omelet`처럼 재료와 소속 음식을 함께 표시한다.
- 선택하지 않은 재료는 미관찰로 남기고 Continue를 막지 않는다. 선택한 재료는 결과를 입력해야 진행한다. 선택 해제 후에도 초안의 기존 답변은 보존하며, 최종 결과에는 선택한 재료만 포함한다.
- 음식 전체와 재료 결과는 독립적으로 입력한다. 재료는 사용자가 직접 선택하며 어떤 결과도 사진에서 채우지 않는다.
- Edit과 Add a food는 공통 음식 편집기를 사용하며 돌아오면 목록에 반영한다. 같은 음식·재료 ID의 답변은 유지하고 제거한 재료의 결과·선택은 제거한다.
- `?`는 어두운 배경의 Outcome definitions를 연다. Eaten은 삼킴 확인, Tasted는 맛봄·삼킴 미확인, Untouched는 먹거나 맛보지 않음, Unclear는 판단 불가다. Got it·닫기·뒤로 가기는 선택을 유지한다.

### R3 — 선택적 어려움

- 음식별 카테고리·값·Add와 제거 가능한 태그를 제공한다. 카테고리는 Texture, Tastes, Food Smells, Colors, Ingredient Piece Size, Food Arrangement, Serving Temperature, Not sure다.
- Texture는 2단계 입력으로 식감 질문과 특성을 고른다. 회색 문장 영역에 `{질문} may have caused the refusal, especially {값} trait of the food`를 표시한다. 이는 보호자의 선택적 추정이며 AI가 원인을 확정한 표현으로 사용하지 않는다.
- 식감 질문과 값은 아래 표를 따른다. 한 음식에 여러 질문·값을 추가할 수 있고 태그에 질문과 값을 함께 보존한다.

| 식감 질문 | 값 |
|---|---|
| 단단한 정도 | Soft, Firm, Hard |
| 씹을 때 부서지는 느낌 | Crumbly, Crunchy, Brittle |
| 씹는 정도 | Tender, Chewy, Tough |
| 달라붙는 정도 | Non-sticky, Sticky, Gummy |
| 탄력 | Springy, Rubbery |
| 액체의 걸쭉한 정도 | Fluid, Thin, Thick, Viscous |
| 촉촉한 정도 | Dry, Moist, Juicy, Wet |
| 기름기 | Non-fatty, Oily, Greasy |
| 입자감 | Grainy, Gritty, Sandy, Mealy, Powdery |
| 촘촘하고 묵직한 정도 | Dense, Airy |
| 표면 촉감 | Smooth, Rough, Bumpy, Crusty, Fuzzy |
| 속의 구조와 식감 | Fibrous, Fleshy, Layered, Spongy |

- Tastes는 Sweet, Salty, Sour, Bitter, Savory · rich taste, Other taste를 제공하고 예시 음식 설명을 함께 표시한다. Other는 직접 입력 후 Add해야 태그로 확정한다.
- Food Smells는 음식당 하나만 저장한다. Fruit-like, Fresh herb/leafy, Mushroom-like, Toasted/browned, Sweet/vanilla/caramel, Milk/butter/cheese, Meaty/broth, Egg/cabbage, Sea/seafood, Aged/fermented, Warm/sharp spice, Cool mint, Smoke/char의 13종과 예시를 표시한다. 새 값을 추가하면 같은 음식의 냄새만 교체한다.
- Colors는 Red/Yellow/Green/Brown/White/Others와 색상 점을 제공하고 복수 태그를 허용한다. Others는 직접 입력 후 추가한다.
- Food Arrangement는 Evenly distributed/Unevenly distributed/Clustered/Other, Ingredient Piece Size는 Fine/Small/Large, Serving Temperature는 Hot/Warm/Cool-chilled/Room temperature를 제공한다. 배치·크기·온도는 음식별 한 값이며 새 입력은 같은 카테고리의 이전 값만 교체한다.
- Add 후 입력값·식감 질문을 비우고 태그는 유지한다. 태그 ×는 해당 태그만 제거한다. 입력 중 값은 저장된 태그가 아니다.
- 긴 냄새 목록·식감 질문은 스크롤 가능한 오버레이에 표시한다. 내용·태그·키보드가 하단 Continue/Skip을 가리지 않는다.
- Continue와 Skip 모두 이미 추가한 태그를 보존하고 바로 최종 저장한다. Did you try a saved suggestion? 후속 화면은 표시하지 않는다.

### R4 — 최종 저장과 기존 초안 호환

- Figma `455:4206`의 Continue·Skip에서 `455:9982` 저장 화면으로 바로 이동한다. 제안 사용 확인이나 별도 Finish 버튼을 끼워 넣지 않는다.
- B의 제안 연결 정보는 보존하되 연결 상태만으로 `{ tried: boolean }` 응답을 만들지 않는다. 이 흐름에서는 제안 사용 여부를 새로 수집하지 않는다.
- 기존 초안의 goal·suggestions 단계는 어려움 입력으로 복원한다. 음식 결과·태그·사진·기존 응답을 보존하고 복원만으로 자동 제출하지 않는다.
- 저장 중·실패·완료 화면에는 실제 Meal 날짜·유형·음식 요약과 초안 유지 안내를 표시한다. 실패 시 Retry는 같은 Meal 결과를 저장하며 중복 결과를 생성하지 않는다.
- 저장 성공 후에만 View Meal Suggestions로 해당 Meal의 추천 기능을 연다. Back to Home을 제공한다.
- 기존 로컬 결과의 저장·재조회·안전성 검사를 유지한다. 서버 호출이 없는 로컬 Meal에서 서버 tries API로 임의 기록을 만들지 않는다.

## Acceptance Criteria

- 사진을 건너뛰고 모든 음식 결과를 입력하면 선택하지 않은 재료가 있어도 진행·저장할 수 있다.
- 재료 토큰을 선택하면 해당 재료와 음식 이름이 있는 별도 결과 카드가 생기고, 그 결과를 입력하기 전에는 진행할 수 없다.
- 사진으로 결과가 미리 선택되지 않고 사용자가 고른 결과만 저장된다. 음식 편집 후 유지 가능한 답변과 재료 선택이 보존된다.
- Texture의 질문·값을 Add하면 둘 다 태그에 저장되고 입력이 초기화된다. 냄새를 바꾸면 기존 냄새만 교체된다.
- 제안 사용 확인 화면을 거치지 않는다. 어려움 Continue·Skip은 직접 저장하며 제안 사용 응답을 자동 생성하지 않는다.
- 저장 실패·초안 복원·사진 취소에서 기존 사진·답변·태그를 잃지 않는다.

## 구현 범위

`features/after-meal-review`, 결과·어려움 타입, 저장 검증과 기존 결과 호환, 공통 음식 편집기, 한글·영어 문구를 변경한다. 추천 알고리즘·홈 전체 개편은 포함하지 않는다.

서버 연동: 식사 API는 acceptance·source·confirmed·suggestion_links, 식후 API는 사진 없는 입력과 suggestion_feedback을 보존한다. 기존 결과의 명시적 `{ tried: true }` 응답 처리와 중복 방지는 호환성을 위해 유지하지만, 이번 화면 흐름에서는 suggestion_feedback 응답을 새로 만들지 않는다. 새 저장 필드의 마이그레이션은 작성만 하고 적용은 별도 확인 후 진행한다.

## 화면 대조 보완 — 2026-10-18

- 사진 선택 `455:6876`: 20px 제목과 선택적 사진 안내가 있는 짙은 카드, 세 개의 사진 소스, 아이콘·설명이 있는 Continue without photo를 표시한다. Figma에 없는 예시 사진·촬영 팁은 추가하지 않는다. Save as Draft & Exit는 선택 버튼 아래, 자동 저장 안내는 화면 아래에 둔다.
- 사진 미리보기 `455:4395`·`455:4450`: 318px 사진 카드 높이를 채우며 좁은 세로 사진에는 좌우 여백이 남는다. 확대 버튼은 카드 아래 중앙에 둔다. 전후 사진 `455:4552`도 같은 높이 맞춤 규칙을 적용한다.
- 결과 입력 `455:10470`·`455:10391`: 공통 헤더 아래 식사 요약·음식 개수는 14px이며 대문자로 바꾸지 않는다. 도움말은 음식 개수보다 위에 둔다. 음식 제목은 18px, Edit·재료 토큰은 16px이다. 결과 버튼은 두 열로 배치하며 최소 높이 48px·글자 14px이고 긴 문구는 줄바꿈한다. 최초 결과·재료는 전부 미선택이며 Continue는 비활성이다.
- 음식 전체 결과와 재료 결과를 별도로 대조한다. 재료 선택 시 `Egg in Rolled omelet`처럼 소속을 표시하고 선택한 재료에 미응답이 있으면 Continue를 막는다. `+ Add a food`는 B와 같은 빈 입력 Dialog를 연다.
- Outcome definitions `455:4368`: 중앙 흰색 대화상자에 결과별 색상 배지, 14px 회색 설명, 빨간 Unanswered 배지와 Got it을 표시한다.
- 어려움 `455:4206`·`455:4093` 및 카테고리별 화면: 진행 바·식사 요약을 추가하지 않는다. 제목·Optional·설명 다음에 음식별 분류/값/Add 행을 놓는다. 선택 목록은 해당 음식 아래에 펼치고 중앙 모달로 바꾸지 않는다. 분류는 원본 아이콘과 화면 너비를 채우는 웹 목록을 표시하고, 값에는 예시·색상 점을 표시한다. 선택기·입력·태그는 16px, 목록·예시는 14px이며 입력 행은 공간이 부족하면 줄바꿈한다. Continue·Skip은 각각 하단 파란 버튼·테두리 없는 버튼이다.
- 최종 저장 `455:9982`·실패 `455:10206`·완료 `455:9892`: 초안 자동 저장 실패와 최종 저장 실패를 별도로 관리한다. 최종 저장의 식사 요약·초안 유지 안내·동일 기록 Retry·완료 후 View Meal Suggestions/홈을 표시한다. 참고용 전후 사진이 없으면 썸네일을 임의 생성하지 않는다.
- Figma 완료 화면의 ‘아직 결과가 기록되지 않았다’는 문구는 결과 필수 입력과 충돌하므로 복사하지 않는다. 실제 리뷰 저장 성공을 표시하며 삭제한 제안 사용 확인 단계를 안내하지 않는다.

- 어려움 선택기 `455:4206`: 카테고리·값·Texture 세부 선택 버튼의 아래 화살표는 텍스트 바로 옆이 아니라 버튼 오른쪽 안쪽 여백 12px에 맞춘다. 텍스트와 아이콘 사이의 남는 공간을 배분하고 긴 텍스트는 아이콘을 밀어내지 않도록 줄어든다.

`suggestion_feedback`은 제안 ID별 `{ "tried": true | false }` 객체를 저장한다. 미응답은 키를 생략하며 `false`로 자동 채우지 않는다.
