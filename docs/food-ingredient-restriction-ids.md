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
