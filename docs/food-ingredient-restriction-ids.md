<!-- AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim -->

# 제한 id (알러지 · 식이 제한)

아이의 알러지와 식이 제한은 클라이언트와 서버가 **같은 문자열 id**로 주고받는다. 이 id의 목록은 두 곳에 따로 정의되어 있으므로, 한쪽을 바꾸면 다른 쪽도 함께 바꿔야 한다.

| 위치 | 정의 |
|---|---|
| 클라이언트 | `client/src/util/strings.ts`의 `allergies` · `allergyCatalog` · `restrictions` · `restrictionCatalog` 옵션 그룹. 프로필 값은 `client/src/types/profile.ts`의 `allergies` · `restrictions` |
| 서버 | `server/app/features/suggestions/ingredients.py`의 `RestrictionId` (StrEnum) |

## 규칙

- 클라이언트에서 제한 id를 추가 · 삭제 · 이름 변경하면, 같은 변경에서 서버의 `RestrictionId`와 `server/app/features/suggestions/mock_ingredients.json`도 함께 고쳐야 한다.
- 서버의 `RestrictionId` 멤버는 클라이언트의 알러지 · 식이 제한 id와 값이 같아야 한다. 현재 20개다.
  - 알러지: `peanut` `tree-nut` `milk` `egg` `soy` `wheat` `fish` `shellfish` `sesame` `lupin` `coconut` `buckwheat` `kiwi` `strawberry`
  - 식이 제한: `gluten-free` `lactose-free` `casein-free` `low-fructose` `no-pork` `no-beef`
- 클라이언트의 `none`(제한 없음 선택)은 제한 id가 아니다. 서버에서는 빈 집합으로 나타낸다.
- 서버 카탈로그(`mock_ingredients.json`)에 `RestrictionId`에 없는 id가 있으면 카탈로그를 읽는 시점에 `ValueError`가 난다.

<!-- AI-generated with GPT-6, 2026-10-22, reviewed by Haechan Jung -->
## 추천 생성에 프로필 연결

- 추천 서비스는 로그인한 사용자의 `user_profiles`와 `user_profile_choices`에서 알레르기·식이 제한을 매 요청마다 읽는다.
- `allergy`와 `restriction`의 표준 `code`를 `RestrictionId`로 바꿔 합친 뒤,
  `ChildRestrictions(ids=frozenset(...))`로 생성기에 전달한다. 식사 선호 등 다른 선택 항목은 포함하지 않는다.
- `none_known` 알레르기와 `none` 식이 제한은 빈 집합으로 전달한다.
- 프로필이 없거나 알레르기가 `unknown`이면 해당 제한은 빈 집합으로 취급하고 추천 생성을 계속한다.
- `specified`인 그룹의 표준 코드만 포함한다. 직접 입력한 제한과 지원하지 않는 코드는 건너뛰며,
  같은 프로필의 나머지 표준 제한은 유지한다. 직접 입력값을 LLM 프롬프트에 별도로 전달하지 않는다.
- 선택 목록이 비어 있어도 `PROFILE_RESTRICTIONS_UNAVAILABLE`로 중단하지 않는다.
