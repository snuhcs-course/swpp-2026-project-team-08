<!-- AI-generated with Claude Sonnet 5.5, 2026-10-19, reviewed by Jaemin Kim -->
<!-- AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim -->
<!-- Changed: 서버 RestrictionType 기준 id 규칙과 DB 카탈로그 판정 규칙으로 재작성 -->

# 제한 id (알러지 · 채식 · 식이 제한)

아이의 제한은 서버의 `RestrictionType`(StrEnum) 값 하나로 표현한다. 값은 `<분류>.<이름>` 형태의 대문자 문자열이다
(예: `ALLERGY.EGGS`, `VEGETARIAN.DAIRY`, `DIETARY_APPROACH.GLUTEN_FREE`). 이 어휘는 서버·클라이언트·재료 데이터가 공유하므로
한쪽을 바꾸면 나머지도 함께 바꿔야 한다.

| 위치 | 정의 |
|---|---|
| 서버 | `server/app/models/restriction_enums.py`의 `RestrictionType` (분류는 `category` 속성) |
| 클라이언트 | `client/src/util/strings.ts`의 `allergies` · `restrictions` · `vegetarian` 선택지. 프로필 값은 `client/src/types/profile.ts`의 `allergies` · `restrictions` · `vegetarianRestrictions` |
| 재료 데이터 | `server/assets/ingredients_restrictions.jsonl`의 `restriction_type` |

## 규칙

- 클라이언트 선택지 id는 서버 값에서 분류 접두사(`ALLERGY.` `VEGETARIAN.` `DIETARY_APPROACH.`)를 뺀 값이다
  (`ALLERGY.MILK_DAIRY` → `MILK_DAIRY`). 요청에는 접두사를 붙여 보내고 응답에서는 뗀다 (`client/src/data/api/onboardingApi.ts`).
- 제한 값을 추가 · 삭제 · 이름 변경하면 같은 변경에서 `RestrictionType`, 클라이언트 선택지, 재료 데이터(`restriction_type`)를 함께 고친다.
- 클라이언트의 `none`(해당 없음 선택)은 제한 값이 아니다. 알러지의 `none`은 `ALLERGY.NONE`으로 보내고, 식이 제한 · 채식의 `none`은 보내지 않는다.
  `ALLERGY.NONE`은 재료의 판정에 쓰지 않는다.
- 아이의 제한은 프로필의 `restrictions`에서 `ALLERGY.NONE`을 뺀 값이다. 추천은 이 값을 그대로 `ingredient_restrictions.restriction_type`과 비교한다.

## 재료 판정 (`ingredient_restrictions`)

- 판정 정도(`RestrictionDegree`)는 `NEVER`(제한에 걸리지 않음) `DEPENDS_ON_PRODUCT`(제품 배합에 따라 걸릴 수 있음) `ALWAYS`(항상 걸림)다.
- 추천에 쓸 수 있는 재료는 **아이의 제한마다 `NEVER` 판정이 있는 재료**다. 판정 행이 없으면 아직 판정하지 않은 것이므로 쓰지 않는다.
  `DEPENDS_ON_PRODUCT`와 `ALWAYS`도 쓰지 않는다. 제한이 없는 아이는 이름이 있는 모든 재료를 쓸 수 있다. 모든 분류에 같은 규칙을 쓴다.
- 쓸 수 있는 재료는 쿼리 한 번으로 읽고(`server/app/features/suggestions/catalog.py`), 이름 목록을 LLM 프롬프트에 처음부터 담는다.
  LLM이 목록에 없는 이름을 쓰면 검증에서 거절된다.

## 데이터 적재

재료와 판정의 원본은 `server/assets/ingredients.jsonl`, `ingredients_restrictions.jsonl`이다. DB에는 서버에 접속해 한 번 적재한다.

```bash
uv run python scripts/load_ingredients.py --check   # 파일만 검증한다. DB는 바꾸지 않는다
uv run python scripts/load_ingredients.py           # DB에 적재한다. DB 데이터가 바뀐다
```

- 여러 번 실행해도 결과가 같다. 재료는 `id`로 갱신하고, 파일에 있는 재료의 판정은 파일의 판정으로 교체한다. 파일에 없는 재료는 건드리지 않는다.
- 파일의 값이 현재 enum과 맞지 않거나 재료 id가 어긋나면 아무것도 쓰지 않고 오류로 끝난다.
