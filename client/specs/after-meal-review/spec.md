<!-- AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing specification -->

# After-meal Review

## Goal

저장된 Meal의 실제 음식별 결과와 선택한 재료의 결과, 선택적 어려움을 보호자가 확인하고 저장한다. 사진·어려움 입력은 생략 가능하며 확인하지 않은 AI 제안을 실제 섭취로 저장하지 않는다.

## Design Document

[최종 ABC — C](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/ABC?node-id=455-1277)

근거: 사진 `455:6876`·`455:4395`·`455:10254`, 비교 `455:4552`, 결과 `455:10470`·`455:10391`, 편집 `455:10537`, 정의 `455:4291`, 어려움 `455:4206`·`455:4093`·`455:3777`·`798:2611`, 맛 `455:6677`, 냄새 `455:6596`, 색 `455:5627`, 배치 `455:6070`, 재료 크기 `815:2907`, 온도 `455:6335`, 저장 `455:9982`·`455:10206`·`455:9892`.

## User Flow

1. 저장된 Meal ID로 식후 검토를 열고 기존 초안을 복원한다.
2. 식후 사진을 선택·확인·비교하거나 Skip photo로 직접 결과를 입력한다.
3. 음식 전체의 결과를 선택한다. 별도로 관찰하려는 재료를 토큰에서 골라 그 결과를 입력한다.
4. 선택적으로 음식별 어려움 원인을 추가하거나 Skip한다.
5. 이 Meal에 연결된 제안의 실제 사용 여부를 확인하고 식후 검토를 저장한다.
6. 저장 성공 후 View Meal Suggestions 또는 홈으로 이동한다.

## Requirements

### R1 — 초안과 사진

- Meal·음식·재료의 안정적인 ID를 사용한다. 초안 자동 저장과 Save as Draft & Exit를 제공하며 저장 성공 후에만 홈으로 나간다.
- 카메라·갤러리·파일 선택, 미리보기·전체 보기·교체·제거를 제공한다. 기존 before 사진은 변경하지 않는다. 소스 선택 취소·잘못된 이미지는 현재 식후 사진과 입력을 보존한다.
- Skip photo는 사진 없이 결과 입력으로 이동한다. afterPhoto가 null이어도 수동 결과를 저장할 수 있다.
- Compare Eaten Portions는 before/after 사진이 모두 있을 때만 요청한다. 전송·AI 학습 별도 동의 안내를 표시하고 두 사진의 확대·수동 입력·실패 재시도를 제공한다.
- 비교 중 실제 진행 상태·취소를 제공한다. 취소·이탈·사진 변경 후 늦은 응답을 무시하고 보호자 확정 결과는 보존한다.

### R2 — 음식과 선택한 재료의 결과

- 음식 카드는 이름·Edit·Eaten/Tasted/Untouched/Unclear를 표시한다. 선택은 연한 초록 배경과 초록 테두리로 구분하고 AI 제안은 분홍 테두리·SUGGESTED로 구분한다.
- 모든 음식의 결과는 필수다. Unanswered와 명시적인 Unclear는 다르며 자동 대체하지 않는다.
- `Select Ingredients to log outcome` 아래에 그 음식의 재료 토큰을 표시한다. 선택한 재료에만 별도 결과 카드를 만들고 `Egg in Rolled omelet`처럼 재료와 소속 음식을 함께 표시한다.
- 선택하지 않은 재료는 미관찰로 남기고 Continue를 막지 않는다. 선택한 재료는 결과를 입력해야 진행한다. 선택 해제 후에도 초안의 기존 답변은 보존하며, 최종 결과에는 선택한 재료만 포함한다.
- 음식 전체와 재료 결과는 독립적으로 입력한다. AI가 재료를 제안했다는 이유만으로 재료를 선택·확정하지 않는다.
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
- Continue와 Skip 모두 이미 추가한 태그를 보존한다. 이번 버전에는 Exposure goal 후속 단계를 표시하지 않는다.

### R4 — 제안 연결과 최종 저장

- B에서 실제 음식에 연결한 제안만 이번 Meal의 확인 대상으로 표시한다. 원래 제안 내용과 실제 대상 음식 이름을 함께 표시하고 시도함/하지 않음을 구분한다.
- 연결 상태만으로 tried를 만들지 않는다. 식후 검토의 보호자 응답을 최종 저장한 뒤에만 확정된 결과로 사용한다. 연결되지 않은 모든 저장 제안을 이번 식사에서 사용한 것으로 가정하지 않는다.
- 저장 중·실패·완료 화면에는 실제 Meal 날짜·유형·음식 요약과 초안 유지 안내를 표시한다. 실패 시 Retry는 같은 Meal 결과를 저장하며 중복 결과를 생성하지 않는다.
- 저장 성공 후에만 View Meal Suggestions로 해당 Meal의 추천 기능을 연다. Back to Home을 제공한다.
- 기존 로컬 결과의 저장·재조회·안전성 검사를 유지한다. 서버 호출이 없는 로컬 Meal에서 서버 tries API로 임의 기록을 만들지 않는다.

## Acceptance Criteria

- 사진을 건너뛰고 모든 음식 결과를 입력하면 선택하지 않은 재료가 있어도 진행·저장할 수 있다.
- 재료 토큰을 선택하면 해당 재료와 음식 이름이 있는 별도 결과 카드가 생기고, 그 결과를 입력하기 전에는 진행할 수 없다.
- AI 제안과 보호자 확정은 구분된다. 음식 편집 후 유지 가능한 답변과 재료 선택이 보존된다.
- Texture의 질문·값을 Add하면 둘 다 태그에 저장되고 입력이 초기화된다. 냄새를 바꾸면 기존 냄새만 교체된다.
- Exposure goal 화면을 거치지 않는다. 제안 연결은 식후 확인을 저장하기 전 시도로 기록되지 않는다.
- 저장 실패·초안 복원·사진 취소에서 기존 사진·답변·태그를 잃지 않는다.

## 구현 범위

`features/after-meal-review`, 결과·어려움 타입, 저장 검증과 기존 결과 호환, 공통 음식 편집기, 한글·영어 문구를 변경한다. 추천 알고리즘·홈 전체 개편은 포함하지 않는다.
