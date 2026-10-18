<!-- AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; specify source sheet missing-photo spacing and removal state -->
<!-- AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; specify full-photo back button geometry -->
<!-- AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; synced before-meal photo text from Figma 455:7879 -->
<!-- AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; specify anchored date dropdown pickers -->
<!-- AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; updated compact meal choice tiles -->
<!-- AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; corrected requirements after screen-by-screen comparison -->
<!-- AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; updated after manual-entry design review -->
<!-- AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing specification -->

# Meal Check-in

## Goal

보호자가 식사 정보와 실제 제공한 음식을 확인하고 저장한다. 사진은 선택 사항이며, 제안 연결만으로 시도·섭취를 기록하지 않는다.

## Design Document

[최종 ABC — B](https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/ABC?node-id=455-1277)

근거: 세부 정보 `455:7645`·`455:7751`, 사진 `455:7879`·`455:3528`·`455:9194`, 음식 카드 `455:8123`·`815:3432`·`815:3554`, 편집 `455:8593`, 제안 연결 `455:8856`·`455:7013`, 저장 `455:9936`·`455:10158`·`455:9843`.

## User Flow

1. 기존 미완료 초안이 있으면 이어서 작성하고, 완료된 기록 뒤에는 새 식사를 시작한다.
2. 날짜·유형·장소를 확인한다. 사진을 추가하거나 건너뛰고 음식만 입력한다.
3. 사진 미리보기에서 확대·교체·제거를 선택한다. 사진 사용 뒤에도 음식을 직접 추가한다. 사진 분석 단계는 없다.
4. 음식 카드를 열어 확인하거나 편집한다. 필요하면 이전 저장 제안을 실제 제공 음식에 연결한다.
5. Save check-in로 확인·저장하고, 저장 성공 뒤 같은 Meal의 식후 검토 또는 홈으로 이동한다.

## Requirements

### R1 — 날짜·식사 정보와 초안

- 식사 유형·장소 카드는 아이콘 배경 28px·아이콘 16px·체크 원 18px, 안쪽 여백 10px·요소 간격 6px로 표시한다. 글자는 남은 너비에서 줄바꿈하며 체크 원은 줄어들거나 카드 밖으로 밀려나지 않는다. 기본·선택·날짜 변경 화면에 동일하게 적용한다.

- 날짜는 현재 현지 날짜로 시작한다. 월·일·연도 선택창을 누르면 해당 창 바로 아래에 최대 180px 높이의 스크롤 picker를 오버레이로 표시한다. 바텀시트를 사용하지 않고 카드 높이와 아래 콘텐츠 위치를 유지한다. 한 번에 하나만 열리고 현재 선택값 주변을 표시한다. 값을 선택하거나 같은 창을 다시 누르면 닫히고 Confirm date로 날짜를 확정한다. 날짜 확정·카드 닫기에도 목록을 닫는다.
- 유형은 Breakfast/Lunch/Dinner/Snack, 장소는 Home/Restaurant/School/Others 중 하나를 고른다. 날짜·유형·장소를 보존하며 5분할 진행 표시를 제공한다.
- 입력을 로컬에 자동 저장한다. 저장 중·성공·실패를 구분하고 Save as Draft & Exit는 저장 성공 후 홈으로 이동한다. 실패하면 입력을 유지한다.
- 저장된 Meal에는 안정적인 ID를 사용한다. 재시도는 같은 ID로 저장하며 중복 Meal을 생성하지 않는다.

### R2 — 선택적 참고 사진

- 확대 화면 `455:5332`의 Go back 버튼은 헤더 왼쪽 24px 위치의 내용 너비 pill이다. 높이 38px, 가로 여백 12px, 원본 왼쪽 화살표 18px·문구 간격 8px, Poppins SemiBold 14px를 사용한다. 배경 #EEF7FF·1px 테두리 #1667FF·글자 #13233A이며 전체 너비 버튼으로 표시하지 않는다.

- 사진 추가 화면 `455:7879`의 상단 안내는 `Optional - keep a photo for your meal record.`, 사진 건너뛰기 버튼은 `Skip photo`, 보조 설명은 `Add foods yourself without a photo.`로 표시한다. 한국어는 각각 `선택 사항 - 식사 기록용 사진을 남길 수 있습니다.`, `사진 건너뛰기`, `사진 없이 음식을 직접 추가하세요.`로 표시한다.

- 카메라·갤러리·파일 경로를 제공하고 해당 경로를 선택할 때 권한을 요청한다. 지원 이미지 형식만 받아들이며 취소·권한 거부·손상 이미지에는 기존 입력을 보존한다.
- 좋은 조명·접시 중앙·음식이 잘 보이게 촬영하라는 안내와 기존 예시 사진을 표시한다. Skip photo는 분석 요청 없이 음식 입력으로 이동한다.
- 사진 미리보기와 전체 화면 보기를 제공한다. Replace photo는 소스 선택을 열며, 이미 음식이나 연결이 있으면 먼저 교체 확인을 받는다.
- 유효한 새 사진을 고르면 사진만 바꾼다. 음식·상세·목표·제안 연결·날짜·유형·장소는 유지한다. 취소 또는 잘못된 이미지에는 아무것도 초기화하지 않는다.
- 사진 제거는 사진만 제거하고 확인한 음식 입력을 보존한다. 음식 목록에 사진이 없으면 `No Before-meal photo added`와 Add 동작을 표시한다.
- 사진 분석 요청·동의 안내·진행·실패·재시도 화면은 제공하지 않는다. 사진 사용과 건너뛰기는 모두 직접 음식 추가로 이어진다. 이전 분석 단계 초안은 foods로 복원한다.

### R3 — 음식 카드와 확인 상태

- 사진 요약, Add Food, 음식 목록, 이전 제안 진입점, 검토 안내, Save check-in, Save as Draft & Exit 순서로 표시한다.
- 음식 카드는 한 번에 하나만 펼친다. 접힌 카드는 이름, 펼친 카드는 재료 토큰·Cooking method·Additional detail·선택적 Acceptance·Remove/Edit를 표시한다.
- 사용자가 모든 음식을 직접 추가·수정한다. AI/Confirmed 출처 표시·범례·확인 안내는 없으며 재료 토큰은 같은 중립색으로 표시한다. 기존 음식의 ID·내용·원출처 저장값은 호환을 위해 보존한다.
- Remove 뒤 음식 이름과 Undo를 표시한다. Undo는 같은 ID·내용·순서·제안 연결을 복원한다. 사진 교체는 음식 목록을 초기화하지 않는다.
- 빈 목록은 직접 추가 안내를 표시하고 Save check-in를 비활성화한다.

### R4 — 음식 편집

- 같은 음식 ID로 이름·재료·선택적 Cooking method·Additional detail·Acceptance를 편집한다. 재료는 개별 제거 가능한 토큰으로 표시하며 Add로 추가한다.
- Cooking method는 선택 목록을 제공한다. Acceptance는 0–3의 네 단계로 입력하며 미입력은 0으로 자동 대체하지 않는다. 기존 Food history와 혼동하지 않는 별도 값이다.
- 편집창은 흰색 대화상자와 어두운 배경, Cancel/Save food를 제공한다. 이름이 없으면 저장하지 않는다. Cancel은 편집 입력을 버리고 카드로 돌아온다.
- 이번 화면에서는 이전 Food traits selector와 Exposure goal 입력을 표시하지 않는다. 기존 저장 데이터는 읽을 수 있어야 한다.

### R5 — 이전 제안을 실제 음식에 연결

- `Are you trying a previous suggestion?`은 저장된 실제 제안을 선택하는 1단계 화면을 연다. 로딩·오류·빈 목록을 구분하고 재시도를 제공한다.
- 2단계에서는 선택한 제안과 이번 Meal의 음식 카드를 표시한다. 실제 제공 음식 하나를 고른 뒤 Link suggestion으로 연결한다. 제안의 음식을 목록에 자동 추가하지 않는다.
- 연결에는 제안 ID, 대상 음식 ID, 확인 가능한 제안 내용 스냅샷을 저장한다. 취소는 기존 연결을 보존한다. 음식 제거 시 연결을 함께 제거하고 Undo 시 복원한다.
- 연결은 pending 상태이며 시도 기록을 생성하지 않는다. 식후 검토 저장에서 실제 사용 여부를 확정한다. 추천 화면에서 진입해도 미완료 초안의 음식은 임의로 교체하지 않는다.

### R6 — 최종 저장과 식후 검토

- Save check-in 후 Exposure goal 선택 없이 Meal을 저장한다. 이전 버전의 goal 단계 초안은 음식 검토로 복원한다.
- 저장 중 진행·식사 요약·초안 유지 안내를 표시한다. 저장 실패에는 Retry와 Save & exit를 제공하고 같은 Meal로 재시도한다.
- 성공 화면에는 Check-in saved, Awaiting after-meal review, 실제 식사 정보와 음식, Add after-meal review, Back to Home을 표시한다.
- 저장 성공 후에만 Meal ID로 식후 검토에 진입한다. 앱 재시작 뒤에도 완료 영수증으로 ID를 복원한다.

## Acceptance Criteria

- 사진 없이 음식 하나를 추가하면 확인·저장 후 같은 Meal ID로 식후 검토에 진입한다.
- 사진 유무와 관계없이 Add Food로 직접 음식을 추가·편집할 수 있으며 카드 하나만 펼쳐진다. 분석 호출과 AI 출처 표시는 없다.
- 음식 제거·Undo는 같은 ID와 연결을 복원한다. 교체 취소·잘못된 이미지는 초안을 유지하며 유효한 교체도 음식과 연결을 유지한다.
- 이전 제안을 음식에 연결·저장해도 tries에 시도가 추가되지 않는다.
- 저장 오류·재시도는 초안을 잃거나 중복 Meal을 만들지 않는다.

## 구현 범위

`features/meal-checkin`, 공유 FoodEditor, Meal 타입·저장 검증, 한글·영어 문구를 변경한다. 기존 로컬 Meal 저장 경로에서 연결 스냅샷까지 보존하고, 서버 tries 생성은 보호자의 식후 확인 전 실행하지 않는다. 홈의 전체 위젯 개편은 세 기능 구현에 포함하지 않는다.

서버 연동: 식사 API는 acceptance·origin·suggestion_links, 식후 API는 사진 없는 입력과 suggestion_feedback을 보존한다. 식후 검토 저장 트랜잭션에서 연결 제안의 tried 응답만 서버 시도로 확정하며 같은 Meal·음식·제안의 재시도는 중복을 만들지 않는다. 새 저장 필드의 마이그레이션은 작성만 하고 적용은 별도 확인 후 진행한다.

## 변경 범위와 호환

분석 버튼·화면·요청 Hook 연결을 제거한다. 기존 분석 단계 초안은 직접 음식 목록으로 이동한다. 보호자가 직접 추가했거나 확인한 음식은 보존하고, 확인하지 않은 과거 AI 샘플 음식·해당 음식의 편집 초안·제안 연결만 제외한다. 완료된 식사는 변경하지 않는다. 사진 선택과 Save check-in은 이미지 인식 요청을 만들지 않는다. 사진·제안 연결·Undo·저장 실패 복구는 유지한다.

## 화면 대조 보완 — 2026-10-18

- 교체 확인 `455:9247`: 화면 중앙의 342px 흰색 Dialog, 모서리 24px, 제목 18px. 본문 12px와 `Cancel or an invalid image keeps everything.` 11px 회색 보조문을 별도 줄로 둔다. Replace photo와 Cancel은 세로로 배치하며 바텀시트 손잡이를 표시하지 않는다.
- 최초 사진 없는 빈 목록 `455:6970`: 제목 Add food items, 한 줄 안내, 46px 흰색 Add food item 버튼, 비활성 Save check-in만 표시한다. 사진 요약·음식 개수·이전 제안 링크를 추가하지 않는다.
- 사진 있는 빈 목록 `815:3080`: Review food items·0 food items·식사 요약·사진 요약·검은 Add Food·일반 텍스트 빈 안내를 표시한다. 하단 추천 연결·직접 입력 안내·Save check-in·Save as Draft & Exit를 유지한다. 별도 빈 상태 카드를 만들지 않는다.
- 추가 `455:8047`·편집 `455:8628`: 중앙 374px Dialog, 모서리 28px. 새 음식은 이름·재료·조리 방법·추가 설명·Acceptance가 전부 비어 있다. `Enter food name`은 입력값이 아닌 placeholder이며 예시 음식명을 넣지 않는다. 이름 입력 중에도 Add food item 제목을 유지한다.
- Cooking method와 Additional detail은 동일한 줄의 두 열이며 사이 간격 8px, 입력 높이 38px이다. Optional은 각 제목 줄에 둔다. Acceptance 0–3은 최초 미선택이며 미입력을 0으로 저장하지 않는다. 이름이 비어 있으면 Save food는 비활성이다.
- 음식 목록 `455:8123`: 처음에는 첫 음식 카드를 펼치고, 이후 한 번에 하나만 펼친다. 추천 링크는 카드 아래에 놓고 카드·하단 안내와 겹치지 않는다.
- 제안 선택 `455:8856`·연결 `455:7013`: 뒤로가기·식사 요약·진행 바·Step 1/2 표시·라디오 선택·하단 Continue/Link suggestion을 표시한다. 카드의 날짜·식사 종류는 실제 제안의 원본 식사 정보를 사용하며 임의 날짜를 만들지 않는다.
- 저장 `455:9936`·실패 `455:10158`·완료 `455:9843`: 버튼 문구만 바꾸지 않고 해당 전용 화면과 실제 식사 요약을 표시한다. 저장 중 편집 복귀는 요청을 취소하거나 중복 저장하지 않으며 입력은 잠근다. 오류 후 Retry는 동일 기록을 저장한다. 성공 뒤에만 식후 리뷰를 연다.
- 비교 기준은 390px 콘텐츠 너비다. iOS 상태 표시줄과 예시 식사 데이터는 콘텐츠·실제 사용자 데이터와 구분한다.

## 사진 교체·음식 목록 보완 — 2026-10-18

- Check your photo의 Replace photo는 사진 소스 바텀시트 `455:10796`을 연다. 기존 음식·연결이 있으면 중앙 교체 확인 Dialog를 거친 다음 연다. 제목 Replace meal check-in photo, 카메라·갤러리·파일의 60px 선택 행, Cancel을 표시한다. 화면 안에 소스 행을 펼치지 않는다. 취소·바깥 영역·뒤로가기는 시트만 닫고 기존 사진과 입력을 보존한다.
- 사진 없는 카드 `815:3432`는 화면 좌우 24px, 카드 안쪽 좌우 10px·상하 13px, 요소 간격 10px이다. Add는 64×29px 파란 버튼이며 긴 문구가 버튼을 밀어내지 않는다.
- Add and edit foods yourself. Photos are optional. 안내는 중앙 정렬한다.
- 삭제 직후 `815:3554`는 Add Food 아래에 높이 41px 이상·남색 배경·모서리 10px·안쪽 12px 알림을 표시한다. 삭제 이름은 흰색 12px, Undo는 파란색 11px이다. 남은 음식 카드와 이전 제안 진입점을 유지하고 제안 진입점은 아래쪽에 배치한다. 이 상태에서는 일반 직접 입력 안내를 생략하며 Undo로 원래 ID·순서·연결을 복원한다.
