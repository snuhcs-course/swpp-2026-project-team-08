# Onboarding

## Goal

보호자가 계정을 만들고 아동 프로필을 설정한다. 프로필은 안전하지 않거나 적합하지 않은 음식을 추천에서 제외하고, 아이의 식사 패턴과 감각적 선호를 파악하며, 이후 식사 추천과 음식 경험 추적의 시작점으로 활용한다. 보호자는 설정 후에도 Profile Settings에서 프로필을 수정할 수 있다.

## Design Document
https://www.figma.com/design/mxsRk3PMmZGuNpJVeAiRi5/%25EC%2586%258C%25EA%25B0%259C%25EC%259B%2590%25EC%258B%25A4?node-id=0-1&p=f&t=fuXx8U3J6aPHAmKj-0

## User Flow

1. 보호자가 이름, 이메일, 비밀번호를 입력해 계정을 만든다.
2. 개인정보와 사진 수집 및 이용에 동의한다.
3. 아동의 닉네임과 연령대를 입력한다. 
4. 식품 알레르기를 입력한다. 
5. 기타 식이 제한을 입력한다.
6. 가족이 식단에 포함하는 식품군을 선택한다.
7. Dietary Approaches를 선택한다.
8. 아이의 감각적 경향(Sensory Profile)을 입력한다. (Texture, Smell, Taste, Presentation, Temperature)
9. Familiarity with New Foods를 입력한다.
10. Safe Food를 입력한다.
11. 아이의 profile을 리뷰한다.
12. 메인 화면으로 진입한다.

## Requirements

### R1 - 화면 공통 제약사항
1. 12개의 화면 모두 하단에 Previous, Continue 버튼을 가져야 한다.
2. 화면에 따라 Continue 버튼은 화면의 조건을 만족시키기 전까지엔 비활성화될 수도 있다.
3. 화면 최상단에는 온보딩이 얼마나 완료되었는지를 나타내는 진행 바가 현재 진행도를 기준으로 표시되어야 한다. 
4. 모든 화면에서 사용자의 입력이 자동으로 로컬 저장소에 저장되어야 하며, 저장이 성공한 경우에 progress bar의 우측 상단에 auto-saved 표시가 떠야 한다.
5. 입력 필드의 입력값은 밝은 배경 위에서 진한 글자색으로 보여야 한다. 키보드가 열리면 현재 입력 필드와 하단 버튼이 가려지지 않도록 화면을 이동·스크롤할 수 있어야 한다.
6. 화면 문구는 앱의 한글·영어 설정에 따라 일관되게 표시되어야 하며, 선택 데이터는 언어를 바꿔도 유지되어야 한다.

### R2 — Create caregiver account

1. 보호자는 이름, 이메일 주소, 비밀번호를 입력해 계정을 만들 수 있어야 한다.
2. 비밀번호는 입력될 때 가려져야 한다.
3. 비밀번호가 8글자 미만인 경우 입력 필드 테두리와 안내 문구가 붉은색으로 표시되며 최소 8글자라는 hint를 준다.
4. 비밀번호가 8글자 미만인 경우 Continue 버튼이 비활성화된다. 8글자부터 사용할 수 있다.

### R3 — Data and photo consent

1. 보호자는 아동 정보를 입력하기 전에 개인정보 수집 및 이용 안내를 확인하고 동의할 수 있어야 한다. 
2. `Account and care privacy`와 `Photo analysis and personalization`은 Required이다. 둘 중 하나라도 동의하지 않으면 Continue 버튼이 비활성화된다.
3. `AI training and model research`는 Optional이며, 동의하지 않아도 Continue가 가능하다.
4. View Detail을 눌러 해당 약관의 자세한 내용을 확인할 수 있다 ( TODO: 프로토타입 단계에서는 View Detail을 눌러도 아무 일도 일어나지 않는다. )
5. 약관을 클릭하면 약관들이 포함된 Consent to Collection and Use of Personal Information 카드의 색이 바뀌어 light up된다.

### R4 — Tell us about your child

1. 보호자는 아동의 닉네임과 연령대를 입력할 수 있어야 한다.
2. 닉네임과 연령대가 입력되기 전까지 Continue 버튼이 비활성화되어야 한다.
3. 정확한 생년월일이 다른 기능에 필요하지 않아 연령대만 수집한다고 안내되어야 한다.
4. 이후 온보딩 화면에서 아동을 지칭할 때는 보호자가 입력한 닉네임을 사용하고, 닉네임을 수정하면 관련 문구도 변경되어야 한다. 디자인 예시의 Leo·Max를 고정 텍스트로 사용하지 않는다.

### R5 — Food allergies

1. 보호자는 아동에게 해당하는 식품 알레르기를 입력할 수 있어야 한다.
2. 보호자는 Other allergy 항목을 클릭해 알레르기 catalog를 검색하고 검색 결과를 눌러 항목을 추가할 수 있어야 한다.
3. 추가된 알레르기는 보호자가 x를 눌러 제거 가능한 토큰 형태로 Other allergy 검색 필드 아래에 표시되어야 한다. 기본 체크박스 목록에는 추가하지 않는다.
4. 알레르기가 없으면 `None`을 선택할 수 있어야 하며, `None`과 다른 알레르기는 동시에 선택될 수 없다.
5. 알레르기 입력을 완료했거나 알레르기가 없음을 선택하면 Continue 버튼을 사용할 수 있어야 한다.

### R6 — Other dietary restrictions

1. 보호자는 아동에게 해당하는 알레르기 외 식이 제한을 입력할 수 있어야 한다.
2. 보호자는 Other restrictions 항목을 클릭해 제한 항목 catalog를 검색하고 검색 결과를 눌러 항목을 추가할 수 있어야 한다.
3. 추가된 제한 항목은 보호자가 x를 눌러 제거 가능한 토큰 형태로 Other restrictions 검색 필드 아래에 표시되어야 한다. 기본 체크박스 목록에는 추가하지 않는다.
4. 해당하는 제한이 없으면 `None`을 선택할 수 있어야 하며, `None`과 다른 제한 항목은 동시에 선택될 수 없다.
5. 식이 제한 입력을 완료했거나 식이 제한이 없음을 선택하면 Continue 버튼을 사용할 수 있어야 한다.

### R7 — Foods included in family meals

1. 보호자는 가족 식단에 포함하는 식품군을 선택할 수 있어야 한다.
2. 보호자는 하나 이상의 식품군을 선택할 수 있어야 한다.
3. 선택된 식품군은 화면에서 구분되어 표시되어야 하며, 보호자는 선택을 변경할 수 있어야 한다.
4. Other를 클릭하는 경우 검색 입력창이 활성화되며, food catalog를 검색하고 검색 결과를 눌러 항목을 추가할 수 있어야 한다. 
5. 추가된 식품은 보호자가 x를 눌러 제거 가능한 토큰 형태로 Other 검색 필드 아래에 표시되어야 한다. 기본 체크박스 목록에는 추가하지 않는다.
6. `All`을 누르면 화면의 모든 기본 식품군이 한 번에 선택되어야 한다. 이후 개별 항목을 다시 눌러 선택을 변경할 수 있어야 한다.
7. 아무 것도 입력하지 않아도 Continue 버튼이 활성화되어 있어야 한다.

### R8 — Dietary approaches

1. 보호자는 가족이 따르는 식이 접근 방식 또는 식단 유형을 선택할 수 있어야 한다.
2. 선택된 항목은 화면에서 구분되어 표시되어야 하며, 보호자는 선택을 변경할 수 있어야 한다.
3. 해당 사항이 없는 경우 이를 나타내는 선택지를 사용할 수 있어야 한다. 이 선택지는 타 선택지와 중복으로 선택될 수 없어야 한다.
4. Other를 클릭하는 경우 검색 입력창이 활성화되며, dietary approaches catalog를 검색하고 검색 결과를 눌러 항목을 추가할 수 있어야 한다.
5. 추가된 접근 방식은 보호자가 x를 눌러 제거 가능한 토큰 형태로 Other 검색 필드 아래에 표시되어야 한다. 기본 체크박스 목록에는 추가하지 않는다.
6. 식이 접근 방식 없음을 선택하거나, 식이 접근 방식을 선택했다면 Continue 버튼이 활성화되어야 한다.

### R9 — Sensory profile

1. 보호자는 식감(Texture), 냄새(Smell), 맛(Taste), 제공 형태(Presentation), 온도(Temperature)에 대한 아동의 경향을 각각 입력할 수 있어야 한다.
2. 식감 화면에서는 어려워하는 식감 여러 개를 선택할 수 있어야 한다. `No clear texture difficulty`는 다른 식감과 동시에 선택할 수 없어야 한다.
3. 식감 화면에서 `Other texture`를 선택하면 직접 입력창과 Add 버튼이 나타나야 한다. 보호자는 식감 설명을 한 번에 하나씩 추가하고, 추가된 항목을 x로 제거할 수 있어야 한다.
4. 냄새 화면에서는 강한 음식 냄새를 어려워하는지 `Yes`, `Sometimes`, `No`, `Not sure` 중 하나만 선택할 수 있어야 한다.
5. 맛 화면에서는 어려워하는 맛을 여러 개 선택할 수 있어야 한다. `No clear taste difficulty`는 다른 맛과 동시에 선택할 수 없어야 한다. `Other taste` 입력창과 Add 버튼으로 목록에 없는 맛을 한 번에 하나씩 추가할 수 있어야 한다.
6. 제공 형태 화면에서는 음식의 색, 모양과 크기, 음식끼리 닿는지, 재료가 보이는지 등 중요하게 여기는 조건을 여러 개 선택할 수 있어야 한다. `No presentation preferences`는 다른 조건과 동시에 선택할 수 없어야 한다. `Other`를 선택하면 제공 형태를 직접 입력하고 Add 버튼으로 한 번에 하나씩 추가할 수 있어야 한다.
7. 온도 화면에서는 `No clear preference`, `Warm`, `Cool / chilled`, `Room temperature`, `It depends on the food` 중 하나만 선택할 수 있어야 한다.
8. 각 질문의 답변은 다른 질문의 선택을 바꾸지 않아야 하며, 보호자는 Previous로 돌아가 답변을 수정할 수 있어야 한다.
9. 맛 화면에는 선택한 경향이 진단이 아니며 실제 식사 기록을 통해 수정할 수 있다는 안내가 표시되어야 한다. 온도 화면에는 음식별로 실제로 받아들인 온도를 식사 기록에서 확인할 수 있다는 안내가 표시되어야 한다.

### R10 — Familiarity with new foods

1. 보호자는 아동이 새로운 음식을 처음 보았을 때 보통 어떻게 반응하는지 입력할 수 있어야 한다.
2. `Usually tastes a new food`, `Okay on the plate, may not taste`, `Prefers it nearby but separate`, `Wants it removed`, `Varies by food`, `Not sure` 중 하나만 선택할 수 있어야 한다.
3. 선택된 답변은 화면에서 구분되어 표시되어야 하며, 보호자는 다른 답변을 선택해 변경할 수 있어야 한다.
4. 이 답변은 일반적인 시작점으로 안내되어야 하며, 개별 음식의 Exposure 진행 단계로 자동 설정되어서는 안 된다. 음식별 진행 상황은 별도로 기록되어야 한다.

### R11 — Safe foods

1. 보호자는 아동이 익숙한 형태로 꾸준히 받아들이는 음식을 Safe Foods로 여러 개 추가할 수 있어야 한다.
2. 음식 입력창 옆의 `+` 버튼을 누르면 `Add safe food` 카드가 열려야 한다.
3. 카드에서 Food name과 Preparation을 입력하고, 필요한 경우 Presentation note를 추가할 수 있어야 한다. Presentation note는 선택 입력 항목으로 표시되어야 한다.
4. 카드의 Add 버튼을 누르면 음식 이름과 입력한 조리·제공 정보가 하나의 Safe Food로 추가되어야 한다.
5. 추가된 Safe Food는 x로 제거할 수 있는 토큰으로 표시되어야 하며, x를 누르기 전까지 목록에 남아 있어야 한다.
6. 아직 Safe Food가 없으면 `No safe foods yet`을 선택할 수 있어야 한다. Safe Food를 추가하면 이 선택은 해제되어야 하며, 선택된 상태에서는 Safe Food가 동시에 저장되지 않아야 한다.
7. Safe Foods 화면에는 Save & exit가 표시되어야 하며, 이를 누르면 현재까지 입력한 답변을 저장하고 나중에 이어서 입력할 수 있어야 한다.
8. 음식 입력창 옆의 `+` 버튼은 작은 화면에서도 잘리지 않고 전체가 보여야 한다.

### R12 — Review profile

1. 보호자는 온보딩을 완료하기 전에 Child basics, Safety restrictions, Family practices, Dietary approaches, Sensory tendencies, Safe foods에 입력한 내용을 요약 카드로 검토할 수 있어야 한다.
2. 감각 프로필과 새로운 음식에 대한 친숙도는 Food smell, Taste intensity, Presentation, Serving temperature, New-food familiarity 등 입력한 질문별로 확인할 수 있어야 한다.
3. 각 카드의 수정 버튼을 누르면 해당 입력 화면으로 이동해야 한다. 수정 후 검토 화면으로 돌아왔을 때 다른 항목의 답변은 유지되어야 한다.
4. 검토 화면에는 입력하지 않은 항목도 미입력 상태로 구분되어야 하며, 보호자가 이를 수정할 수 있어야 한다.
5. 새로 입력한 제한 조건이 Safe Food 또는 Learning Food와 충돌하면 기존 음식 기록은 유지하고, 충돌 안내와 해당 프로필 항목을 검토하는 동작을 제공해야 한다.
6. 보호자가 `Looks good`을 누르면 프로필을 저장하고 온보딩을 완료해야 한다. 저장에 실패하면 검토 화면과 입력값을 유지하고 다시 시도할 수 있어야 한다.

## Edge Cases

- 비밀번호가 8글자 미만이거나 필수 계정 입력값이 비어 있음
- 개인정보 수집 및 이용의 필수 동의를 하지 않았거나, 동의한 뒤 다시 해제함
- 아동의 닉네임 또는 연령대 중 하나만 입력함
- 알레르기 또는 기타 식이 제한을 선택하지 않은 채 화면을 벗어나려 함
- `None` 또는 식이 접근 방식의 ‘해당 없음’을 다른 항목과 함께 선택하려 함
- catalog 검색 결과가 없거나 이미 추가한 항목을 다시 선택함
- `Other` 입력창에 내용을 입력했지만 Add를 누르지 않고 다음 화면으로 이동함
- 가족 식단에 포함하는 식품군을 아무것도 선택하지 않음
- 식감·맛·제공 형태의 ‘해당 없음’ 항목을 다른 항목과 함께 선택하려 함
- 직접 추가한 감각 항목을 제거하거나, 이전 화면으로 돌아가 선택을 변경함
- 냄새·온도·새로운 음식에 대한 친숙도 화면에서 다른 선택지를 눌러 기존 단일 선택을 변경함
- Safe Food의 Food name 또는 Preparation을 입력하지 않은 채 Add를 누름
- `No safe foods yet`을 선택한 상태에서 Safe Food를 추가하거나, Safe Food가 있는 상태에서 이를 선택함
- Safe Food를 추가한 뒤 제거하거나, 입력 도중 Save \& exit를 누름
- 자동 저장이 완료되기 전에 앱이 종료되거나 저장에 실패함
- 검토 화면에서 항목을 수정한 뒤 돌아옴
- 새 식이 제한이 기존 Safe Food 또는 Learning Food와 충돌함
- `Looks good`을 누른 뒤 프로필 저장에 실패함

## Acceptance Criteria

Given 보호자가 계정 생성 화면에 있고  
When 비밀번호를 8글자 미만으로 입력하면<br>
Then 비밀번호 오류 안내가 표시되고 Continue 버튼이 비활성화된다.

Given 보호자가 비밀번호를 정확히 8글자로 입력했고 이름과 이메일도 입력했으며<br>
When 계정 생성 화면을 확인하면<br>
Then 비밀번호 오류 안내가 사라지고 Continue 버튼이 활성화된다.

Given 보호자가 동의 화면에 있고  
When 필수 동의 항목을 선택하지 않으면  
Then Continue 버튼이 비활성화된다.

Given 보호자가 계정 정보와 사진 분석의 필수 동의 항목을 선택했고 AI 학습 선택 동의 항목은 선택하지 않았으며<br>
When Continue를 누르면  
Then 아동 정보 입력 화면으로 이동한다.

Given 보호자가 가족 식품군 화면에 있고<br>
When All을 누르면<br>
Then 모든 기본 식품군이 선택된다.

Given 보호자가 Other를 선택해 catalog 항목을 추가했고<br>
When 추가 결과를 확인하면<br>
Then 기본 체크박스 목록 아래의 검색 필드 아래에 제거 가능한 토큰으로 표시된다.

Given 보호자가 아동 닉네임을 입력했으며<br>
When 이후 감각 프로필, Safe Foods 또는 검토 화면을 보면<br>
Then 디자인 예시 이름 대신 입력한 닉네임이 표시된다.

Given 보호자가 아동 정보 화면에 있고  
When 닉네임 또는 연령대를 입력하지 않으면  
Then Continue 버튼이 비활성화된다.

Given 보호자가 알레르기 또는 기타 식이 제한 화면에서 항목을 선택했고  
When `None`을 선택하면  
Then 기존 선택이 해제되어 `None`과 다른 항목이 동시에 선택되지 않는다.

Given 보호자가 알레르기 또는 기타 식이 제한 화면에서 `None`을 선택했고  
When 다른 항목을 선택하면  
Then `None`이 해제된다.

Given 보호자가 `Other allergy` 또는 `Other restrictions`에서 catalog 항목을 추가했고  
When 해당 항목의 x를 누르면  
Then 항목이 선택 목록에서 제거된다.

Given 보호자가 가족 식단에 포함하는 식품군을 선택하지 않았고  
When Continue를 누르면  
Then 다음 화면으로 이동한다.

Given 보호자가 Dietary approaches 화면에 있고  
When 식이 접근 방식 또는 ‘해당 없음’을 선택하면  
Then Continue 버튼이 활성화된다.

Given 보호자가 Dietary approaches 화면에서 ‘해당 없음’을 선택했고  
When 다른 식이 접근 방식을 선택하면  
Then ‘해당 없음’이 해제된다.

Given 보호자가 식감·맛·제공 형태 화면에서 여러 항목을 선택했고  
When 각 화면의 ‘해당 없음’ 항목을 선택하면  
Then 기존 선택이 해제되어 두 종류의 답변이 동시에 저장되지 않는다.

Given 보호자가 `Other texture`, `Other taste` 또는 제공 형태의 `Other`를 선택했고  
When 내용을 입력해 Add를 누르면  
Then 입력한 항목이 해당 질문의 답변에 추가된다.

Given 보호자가 냄새·온도·새로운 음식에 대한 친숙도 화면에서 답변을 선택했고  
When 다른 답변을 선택하면  
Then 기존 답변이 해제되고 새 답변 하나만 선택된다.

Given 보호자가 새로운 음식에 대한 친숙도를 입력했고  
When 개별 음식의 Exposure 기록을 시작하면  
Then 온보딩 답변이 그 음식의 Exposure 진행 단계로 자동 설정되지 않는다.

Given 보호자가 Safe Foods 화면에서 Food name과 Preparation을 입력했고  
When Add를 누르면  
Then 해당 음식과 조리·제공 정보가 하나의 Safe Food로 추가된다.

Given 보호자가 `No safe foods yet`을 선택했고  
When Safe Food를 추가하면  
Then `No safe foods yet` 선택이 해제된다.

Given 보호자가 Safe Foods 화면에서 Save \& exit를 눌렀고  
When 온보딩을 다시 시작하면  
Then 저장된 답변과 진행 단계에서 이어서 입력할 수 있다.

Given 보호자가 검토 화면에서 항목의 수정 버튼을 눌렀고  
When 답변을 수정한 뒤 검토 화면으로 돌아오면  
Then 수정한 답변이 반영되고 다른 항목의 답변은 유지된다.

Given 보호자가 검토 화면에서 `Looks good`을 눌렀고  
When 프로필 저장에 성공하면  
Then 온보딩이 완료되고 메인 화면으로 이동한다.

Given 보호자가 검토 화면에서 `Looks good`을 눌렀고  
When 프로필 저장에 실패하면  
Then 검토 화면과 입력값이 유지되고 다시 시도할 수 있다.
