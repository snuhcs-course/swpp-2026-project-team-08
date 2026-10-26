<!-- AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung -->

# 제한 id (알러지 · 식이 제한)

아이의 알러지와 식이 제한은 클라이언트와 서버가 **같은 문자열 id**로 주고받는다. 이 id의 목록은 두 곳에 따로 정의되어 있으므로, 한쪽을 바꾸면 다른 쪽도 함께 바꿔야 한다.

| 위치 | 정의 |
|---|---|
| 클라이언트 | `client/src/util/strings.ts`의 `allergies` · `allergyCatalog` · `restrictions` · `restrictionCatalog` 옵션 그룹. 프로필 값은 `client/src/types/profile.ts`의 `allergies` · `restrictions` |
| 서버 | `server/app/features/suggestions/ingredients.py`의 `RestrictionId` (StrEnum) |

## 고정 목록의 근거

`client/src/features/onboarding/screens/ChoiceStepView.tsx`가 `MultiChoice.options`에 전달하는 기본 선택 그룹만 고정한다. `catalogOptions`는 Other 검색 후보이므로 별도다.

| 화면 기본 그룹 | 서버 payload | 개수 |
|---|---|---:|
| `allergies` | `safety.allergies.items` | 9 |
| `restrictions` | `safety.restrictions.items` | 3 |
| `approaches` | `food_preferences.dietary_approaches` | 5 |

합계 17개. ID·한국어 이름은 `client/src/util/strings.ts` 기본 그룹을 따른다. 같은 ID는 한 번만 둔다.

- `*Catalog` 검색 후보·`none`·자유 입력은 고정 restriction이 아니다.
- 현재 `onboardingApi.ts`는 검색 후보를 code로도 전송한다. 이를 기본 제한으로 자동 등록하지 않으며, 검색 입력 해석은 별도로 구현해야 한다.
- 서버 enum과 [고정 데이터](../data/ingredient_db/restrictions.json)의 ID·이름·타입을 기본 버튼과 비교하는 테스트를 둔다.
- 재료별 의미는 [판정 기준](../data/ingredient_db/docs/restriction-policy.md)을 따른다. 목록 등록과 실제 관계 데이터 생성은 별도다.
