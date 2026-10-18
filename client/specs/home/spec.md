<!-- AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo -->

# Home — Today

## Goal

보호자가 새 식사를 기록하고, 체크인은 저장했지만 식후 리뷰를 마치지 않은 식사를 찾아 이어서 작성한다. 실제 아동·식사·저장된 제안을 표시하며 Figma 예시를 기본 데이터로 넣지 않는다.

## Design Document

- [저장된 식사·식후 리뷰 대기 홈 — 455:8912](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/?node-id=455-8912)
- [첫 방문·식사 기록 없는 홈 — 455:9007](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/?node-id=455-9007)
- [체크인 저장 완료 — 455:9843](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/?node-id=455-9843)
- [식후 리뷰 시작 — 455:6876](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/?node-id=455-6876)

이전 37:3607의 Recommended action goals 위젯은 이 홈의 기준에서 제외한다. 사용자 요청에 따라 바텀바는 Figma의 홈 전용 디자인 대신 기존 공통 탐색을 사용한다. 기록 유무와 현재 탭에 관계없이 Today·Meal Log·Ideas·Insight·Profile의 5개 탭을 같은 순서·아이콘·크기·간격으로 표시한다. 상태 표시줄·홈 인디케이터는 앱 콘텐츠로 복제하지 않는다.

## User Flow

1. 홈 진입·다른 화면에서 복귀·당겨서 새로고침 시 현재 아동의 저장된 식사·식후 리뷰·초안·제안을 갱신한다.
2. Log new meal을 누르면 Meal Check-in을 연다. 미완료 체크인 초안이 있으면 Ongoing Meal 안내를 거쳐 이어가고 기존 입력을 덮어쓰지 않는다.
3. 체크인을 저장한 뒤 식후 리뷰를 끝내지 않은 식사는 After-meal Review에 Awaiting review 카드로 표시한다.
4. 해당 카드를 누르면 같은 Meal ID의 식후 리뷰로 이동한다. 처음에는 선택적 식후 사진 단계에서 시작하고, 작성한 식후 초안이 있으면 마지막 단계·입력값을 복원한다.
5. 식후 리뷰 저장을 마친 식사는 대기 목록에서 빠진다. 결과는 Meal Log에서 볼 수 있다.
6. View saved suggestions는 저장된 제안 목록, View meal history는 Meal Log로 이동한다.

## Requirements

### R1 — 데이터와 상태 구분

- 체크인 미완료 초안, 체크인 저장 완료·식후 리뷰 대기, 식후 리뷰 완료를 구분한다. 완료된 체크인을 미완료 체크인으로 표시하지 않는다.
- 대기 카드는 현재 아동의 실제 저장 Meal 중 저장된 식후 리뷰가 없는 기록으로 구성한다. 체크인 초안·예시 Meal·다른 아동의 기록은 포함하지 않는다.
- 미완료 식후 리뷰 초안만으로 완료 처리하지 않는다. 식후 리뷰 저장 성공 뒤 대기 목록을 갱신한다.
- 대기 식사가 여러 개면 식사 날짜·저장 시각이 최신인 순서로 모두 표시하고 각각의 Meal ID를 사용한다.
- 읽기 실패를 빈 목록으로 바꾸지 않는다. 로딩·오류·재시도를 제공하고 식사 기록 동작은 대기 데이터 읽기 실패로 잠그지 않는다. 프로필 변경 후 다른 아동의 이전 값을 보여주지 않는다.
- 현재 앱의 저장 계층에서 확정된 Meal과 식후 리뷰를 함께 읽는다. 홈 전용으로 식사나 리뷰를 다시 저장하거나 테스트 데이터를 생성하지 않는다.

### R2 — 인사말과 새 식사 카드

- 좌우 24px. 현재 현지 날짜를 대문자 요일 · 일 월 연도로 표시한다. 글자 10px Poppins Bold·파란색, 아래 인사말 23px SemiBold·행간 1.25, 둘 사이 4px이다.
- 인사말은 현재 시간에 맞추고 Good morning/afternoon/evening 옆에 프로필의 Caregiver name(보호자 이름)을 표시한다. 이름이 없으면 임의 이름이나 아이 이름으로 대체하지 않는다. Child avatar의 아동 이름·이니셜과 44px 원은 유지한다.
- 남색 카드: 모서리 22px, 안쪽 20px, 항목 간 14px. 오른쪽 위 104px 장식 원을 표시한다.
- LOG THIS MEAL · FOR {아동 이름} 10px Bold, Ready when you are 17px SemiBold, A little note about a meal is a good start. Add foods with or without a photo. 12px·행간 18px이다.
- 파란 버튼은 높이 46px·모서리 14px·카메라 18px·문구 13px이다. 기록이 있으면 Log new meal, 없으면 Log this meal. 미완료 초안이 있어도 별도 가짜 식사 유형을 표시하지 않고 기존 초안 진입 흐름을 따른다.

### R3 — After-meal Review

- 새 식사 카드 아래 18px 간격. 제목 16px SemiBold·행간 1.35, 카드와 12px 간격이다.
- 각 카드는 흰색·모서리 20px·안쪽 16px·높이 92px 이상. 아동 이름 · 식사 종류를 16px SemiBold, 식사 날짜 · 음식 수를 11px Regular로 표시한다.
- 오른쪽 아래 Awaiting review 9px Bold와 원본 오른쪽 화살표 18px을 배치한다. 카드 전체를 눌러 해당 식후 리뷰를 연다. 긴 이름이나 큰 글자 설정에서 상태 표시와 겹치지 않게 높이가 늘어날 수 있다.
- 대기 카드가 없으면 이 영역을 생략한다. 카드 탭은 체크인이나 새 식사 생성으로 연결하지 않는다.

### R4 — Saved Suggestions

- 제목 16px SemiBold, 카드 간격 10px. 흰색 카드·모서리 20px·안쪽 16px이다.
- 현재 아동에게 유효한 실제 저장 제안 하나를 미리보기로 표시한다. 원본 40px 제안 아이콘, 제목 13px SemiBold, An idea to revisit, not a recorded try. 11px Regular를 사용한다.
- View saved suggestions 12px SemiBold와 16px 화살표를 표시하고 저장 제안 목록으로 이동한다. 제안 탭만으로 실제 시도나 식후 결과를 기록하지 않는다.
- 저장 제안이 없으면 No saved suggestions yet를 표시하고 View meal history로 Meal Log에 진입한다. 예시 당근·생선 제안을 생성하지 않는다.

### R5 — 기록 없는 상태와 달력

- 식사 기록과 체크인 초안이 없을 때는 455:9007처럼 새 식사 카드 아래 Meal Log Calendar, Log a meal, 저장 제안 빈 상태를 표시한다.
- 일요일부터 토요일 순서, 실제 표시 월의 날짜·이전/다음 달 날짜를 배치한다. 현재 월로 시작하고 이전·다음 버튼과 월·연도 선택으로 이동한다. 날짜를 누르면 해당 날짜의 Meal Log로 이동한다.
- 달력은 흰색·1px 테두리·모서리 16px, 위쪽 범례 1 log / 2 logs / 3+ logs를 표시한다. 기록 수는 저장된 Meal의 식사 날짜로만 계산한다. 이전·다음 달은 회색 글자로 구분한다.
- 기록이 있는 상태에서는 455:8912의 간결한 구성을 사용하며 달력은 Meal Log에서 확인한다.

### R6 — 공통 배치·언어·탐색

- 화면 배경 #F7FAFF, 콘텐츠 좌우 24px, 인사말 위 10px·아래 20px, 본문 섹션 간 18px, 하단 여백 24px이다.
- 바텀바는 모든 탭이 MainLayout에서 공유하는 기존 BottomNavigation을 사용한다. 5개 탭·20px MaterialCommunityIcons·9px 라벨·72px 높이·좌우 22px 여백을 유지한다. 탭 전환 시 본문만 이동하며 바텀바의 위치·크기·구성은 바뀌지 않고 선택 표시만 갱신한다. 기록 유무에 따라 탭을 숨기지 않는다. 콘텐츠는 세로 스크롤한다.
- 모든 문구는 strings.ts, 색은 colors.ts에 모은다. 한국어·영어 모두 지원하며 실제 이름·음식명은 유지한다.
- View는 props만 받아 렌더링하고 Hook·Query·Storage가 데이터 조회와 상태를 담당한다.

## Acceptance Criteria

- 체크인만 저장 후 홈으로 돌아오면 해당 Meal의 Awaiting review 카드가 나온다. 앱을 다시 열어도 같은 식사를 이어갈 수 있다.
- 카드에서 사진 단계로 들어간다. 식후 리뷰를 작성하다 나왔으면 해당 Meal의 기존 초안을 복원한다.
- 리뷰 저장 후 홈에 돌아오면 해당 카드만 사라지고 다른 대기 식사는 남는다. 체크인 초안·음식·사진은 임의로 덮어쓰지 않는다.
- 사진 없는 체크인, 여러 대기 식사, 저장된 리뷰가 있는 식사, 다른 아동의 기록을 구분한다.
- 기록·제안 없는 홈은 가짜 데이터 없이 달력·빈 상태를 표시한다. 읽기 오류에는 재시도를 제공한다.
- 390×844 웹 화면에서 최신 Figma와 제목·카드·간격·아이콘을 대조한다. 큰 글자·긴 이름에서도 동작에 접근할 수 있다.

## 구현 범위

홈 View·Hook·홈 식사 상태 Query/Storage·식후 저장 후 갱신·기존 공통 바텀바 공유·문구·원본 에셋을 변경한다. 기존 식사·리뷰 저장 형식과 다른 탭의 화면 구성은 유지한다.
