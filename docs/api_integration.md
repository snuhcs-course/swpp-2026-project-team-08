<!-- AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim -->
<!-- Changed: DB 스키마 개편에 따른 클라이언트 API 연동 변경 정리 -->

# API 연동 변경 사항 (클라이언트)

> DB 스키마 개편([`db-overhaul.md`](db-overhaul.md))으로 서버 API가 바뀌는 부분 중 클라이언트가 맞춰야 하는 것을 모았다.
> 요청과 응답의 최종 모양은 실행 중인 서버의 `/docs`(OpenAPI)가 기준이다. 클라이언트 반영이 끝나면 이 문서는 삭제한다.

## 목차

1. 공통 변경
2. enum 값 변환표
3. 식사 API
4. 온보딩 API
5. 추천 API
6. 변경이 없는 API
7. 협의가 필요한 항목

## 1. 공통 변경

- **모든 enum 값이 대문자로 바뀐다.** 요청과 응답 모두 해당한다. 값 목록은 2절의 변환표를 따른다.
- **음식과 재료의 id는 서버가 발급한다.** 클라이언트는 새 음식·재료의 id를 보내지 않고 응답으로 받는다.
- **개편을 적용하면 기존 식사, 음식, 재료, 식후 리뷰, 추천, 아이 프로필이 삭제된다.** 로컬에 남아 있는 식사 id, 임시저장,
  캐시는 서버 데이터와 맞지 않으므로 앱을 업데이트할 때 지워야 한다. 모든 사용자가 아이 프로필을 다시 입력해야 한다.
  (동의 기록, 계정 정보는 유지된다.)
- 서버는 허용 값 밖의 값을 422로 거절한다.
- **재료 카탈로그 API가 삭제된다.** `GET /api/v1/ingredients`와 `POST /api/v1/ingredients/resolve`는 더 이상 없다.
  식사의 재료는 사용자가 입력한 이름을 그대로 저장하므로 카탈로그에서 고르거나 id를 맞출 필요가 없다. 카탈로그는 서버 내부에서
  추천에만 쓴다. **클라이언트 반영 완료**: `src/data/api/ingredientCatalogApi.ts`를 삭제하고 `checkinReferenceQueries.ts`에서
  `useIngredientCatalog`와 `checkinReferenceKeys.ingredients`를 제거했다(쓰는 화면이 없어 동작은 바뀌지 않는다).
  `Ingredient` 타입과 `toIngredient`는 식사 DTO가 쓰므로 남겼다. 식사 저장·수정에서 재료가 카탈로그에 없다는
  에러(`INGREDIENT_NOT_FOUND`)도 더 이상 나오지 않는다(`meals` 단계에서 서버 코드 정리).

## 2. enum 값 변환표

| 위치 | 이전 | 이후 |
|---|---|---|
| 식사 `meal_type` | `breakfast` `lunch` `dinner` `snack` | `BREAKFAST` `LUNCH` `DINNER` `SNACK` |
| 식사 `setting` | `home` `restaurant` `school` `others` | `HOME` `RESTAURANT` `SCHOOL` `OTHERS` |
| 음식 `cooking_method` | `raw` `boiled` `steamed` `pan_fried` `stir_fried` `baked_roasted` `mashed_blended` `other` | `RAW` `BOILED` `STEAMED` `PAN_FRIED` `STIR_FRIED` `BAKED_ROASTED` `MASHED_BLENDED` `OTHER` |
| 식후 `outcome` | `eaten` `tasted` `untouched` `unclear` | `EATEN` `TASTED` `UNTOUCHED` `UNCLEAR` |
| 동의 `kind` | `account_privacy` `photo_analysis` `ai_training` | `ACCOUNT_PRIVACY` `PHOTO_ANALYSIS` `AI_TRAINING` |
| 프로필 `age_group` | `under-2` `2-3` `4-5` `6-8` `9-12` `13-plus` | `UNDER_2` `AGE_2_3` `AGE_4_5` `AGE_6_8` `AGE_9_12` `AGE_13_PLUS` |
| 추천 `status` | `pending` `saved` `dismissed` | `PENDING` `SAVED` `DISMISSED` (새 값 `TRIED`) |
| 추천 시도 `feedback` | `helpful` `not_helpful` `not_sure` | `HELPFUL` `NOT_HELPFUL` `NOT_SURE` |
| 추천 `dismiss_reasons` | `restriction_conflict` `disliked_food_or_form` `food_preferences` `too_much_preparation` `ingredient_unavailable` `already_tried` | `RESTRICTION` `DISLIKE` `NOT_FIT` `TOO_MUCH_PREPARATION` `INGREDIENT_HARD_TO_GET` `ALREADY_TRIED` |

난이도 사유(`DifficultyReason`)와 제한(`RestrictionType`)은 값의 구조가 달라져서 각각 3절과 4절에서 설명한다.

## 3. 식사 API

### 음식·재료 id
- 음식과 재료의 `id`는 서버가 발급한다. 식사를 저장하는 요청(`PUT /meals`)에는 음식과 재료의 `id`를 보내지 않고
  (보내면 422), 응답(저장·수정·리뷰·조회 공통, `MealDetailResponse`)에 발급된 id가 들어온다.
- 재료는 이름만 보낸다. 사용자가 입력한 이름을 그대로 저장하며 음식마다 별도 행이다. 같은 음식 안에서 공백·대소문자를
  무시하고 이름이 겹치면 `422 DUPLICATE_INGREDIENT`다. 추천용 재료 카탈로그를 참조하지 않으므로 `INGREDIENT_NOT_FOUND`는 없다.
- 식사를 수정할 때(`PUT /meals/{id}/foods`)는 음식 목록 전체를 보낸다.
  - 기존 음식은 `id`를 함께 보내 갱신하고, `id`가 없는 음식은 새로 만들며, 요청에서 빠진 음식은 삭제한다.
    삭제한 음식에 붙은 추천 시도 기록도 함께 삭제된다. 이 식사에 속하지 않는 `id`는 `422 INVALID_MEAL_FOOD`다.
  - 재료는 음식별로 목록 전체를 교체한다. 재료 `id`는 저장할 때마다 새로 발급되므로 서버에 다시 보내거나 영구 키로 쓰지 않는다.
  - 식후 리뷰가 있는 식사는 수정할 수 없다 (`409 MEAL_ALREADY_REVIEWED`).

### 추천 시도 연결
- 식사를 저장할 때 음식 객체의 `food_recommendation_ids`(문자열 id 목록)로 이 음식으로 시도한 **저장된 추천**을 연결한다.
  `suggestion_links`는 없어진다. 재료 단위 연결(`ingredient_id`)도 없어진다.
- 본인의 `SAVED` 추천이 아니거나 없는 id는 `422 INVALID_MEAL_LINK`다. 같은 추천을 한 식사의 두 음식에 연결하면 `422 VALIDATION_ERROR`다.
- 응답에서는 음식 객체의 `recommendation_tries`에 `{id, food_recommendation_id, feedback, created_at, updated_at, recommendation}`
  목록으로 돌아온다. `recommendation`은 `what_to_try`, `why_this_may_help`, `serving_tip`이다. 수정 요청으로는 연결을 추가하지 않는다.

### 식후 리뷰
- `PUT /meals/{id}/review`의 요청은 `food_results[]`(`food_id`, `outcome`, `difficulty_reasons`, `ingredient_outcomes[]`)를 쓰고,
  응답은 식사 상세(`MealDetailResponse`)다.
  - 모든 음식을 한 번씩 포함해야 하고 음식의 `outcome`은 필수다 (`null`이면 422). 재료의 `outcome`은 생략할 수 있다.
  - 요청에 없는 재료는 리뷰하지 않은 상태(`outcome: null`, 사유 `[]`)가 된다. 다시 저장하면 이전 결과를 덮어쓴다.
  - 음식·재료 id가 이 식사의 것이 아니거나 중복이면 `422 INVALID_MEAL_REVIEW`다.
- 리뷰 결과가 음식과 재료 객체 안으로 들어간다. 별도의 `review`, `food_results`, `ingredient_results`는 응답에서 없어진다.
  - 음식과 재료는 각각 `outcome`(`EatingOutcome` 값 또는 `null`)과 `difficulty_reasons`를 가진다. **`outcome`이 `null`이면 아직 리뷰하지 않은 것이다.**
  - 응답의 `food_snapshot`은 사라진다. 음식 정보는 음식 객체가 직접 갖는다.
- 난이도 사유는 `{category, subcategory, value}` 객체의 목록에서 **문자열 목록**(`difficulty_reasons`)으로 바뀐다. 중복은 422다.

### 난이도 사유 값 (`DifficultyReason`)
값은 category를 점(`.`)으로 구분한 경로 문자열이다. `texture`만 하위 category가 하나 더 있다.

| 이전 (`category` / `subcategory` / `value`) | 이후 |
|---|---|
| `texture` / `hardness` / `soft` | `TEXTURE.HARDNESS.SOFT` |
| `texture` / `chewing` / `tough` | `TEXTURE.CHEWING.TOUGH` |
| `color` / - / `red` | `COLOR.RED` |
| `color` / - / `other` | `COLOR.OTHER` |
| `pieceSize` / - / `fine` | `PIECE_SIZE.FINE` |
| `notSure` / - / `notSure` | `NOT_SURE` |

- category 이름: `texture` → `TEXTURE`, `smell` → `SMELL`, `tasteType` → `TASTE`, `pieceSize` → `PIECE_SIZE`,
  `arrangement` → `ARRANGEMENT`, `color` → `COLOR`, `temperature` → `TEMPERATURE`, `notSure` → `NOT_SURE`.
- value 이름은 대문자 SNAKE_CASE로 바꾼다 (`nonSticky` → `NON_STICKY`, `nonFatty` → `NON_FATTY`).
- 전체 값 목록(77개)은 바로 아래 표와 같다. 값의 기준은 PRD의 "Reason Category and Mapped Values"다.
- **PRD에 없는 항목은 서버가 받지 않는다.** 클라이언트의 `tasteIntensity`(`mild` `strong`), `shape`(`consistent` `varied` `notSure`
  `note`), `visibility`(`visible` `hidden` `mixed`), `tasteType`의 `other`는 선택지에서 제거해야 한다. 보내면 422다.
- 메모(`note`)는 지금처럼 서버로 보내지 않는다.

#### `DifficultyReason` 전체 값 (77개)

`TEXTURE`를 뺀 category (36개)

| category | 값 |
|---|---|
| `SMELL` (13) | `SMELL.FRUIT` `SMELL.HERB` `SMELL.MUSHROOM` `SMELL.TOASTED` `SMELL.VANILLA` `SMELL.DAIRY` `SMELL.MEATY` `SMELL.SULFUR` `SMELL.SEA` `SMELL.FERMENTED` `SMELL.SPICE` `SMELL.MINT` `SMELL.SMOKE` |
| `TASTE` (5) | `TASTE.SWEET` `TASTE.SALTY` `TASTE.SOUR` `TASTE.BITTER` `TASTE.SAVORY` |
| `ARRANGEMENT` (4) | `ARRANGEMENT.EVEN` `ARRANGEMENT.UNEVEN` `ARRANGEMENT.CLUSTERED` `ARRANGEMENT.OTHER` |
| `PIECE_SIZE` (3) | `PIECE_SIZE.FINE` `PIECE_SIZE.SMALL` `PIECE_SIZE.LARGE` |
| `TEMPERATURE` (4) | `TEMPERATURE.HOT` `TEMPERATURE.WARM` `TEMPERATURE.COOL` `TEMPERATURE.ROOM` |
| `COLOR` (6) | `COLOR.RED` `COLOR.YELLOW` `COLOR.GREEN` `COLOR.BROWN` `COLOR.WHITE` `COLOR.OTHER` |
| `NOT_SURE` (1) | `NOT_SURE` |

`TEXTURE` (41개, 하위 category 12개)

| 하위 category | 값 |
|---|---|
| `HARDNESS` | `TEXTURE.HARDNESS.SOFT` `TEXTURE.HARDNESS.FIRM` `TEXTURE.HARDNESS.HARD` |
| `BREAKING` | `TEXTURE.BREAKING.CRUMBLY` `TEXTURE.BREAKING.CRUNCHY` `TEXTURE.BREAKING.BRITTLE` |
| `CHEWING` | `TEXTURE.CHEWING.TENDER` `TEXTURE.CHEWING.CHEWY` `TEXTURE.CHEWING.TOUGH` |
| `STICKINESS` | `TEXTURE.STICKINESS.NON_STICKY` `TEXTURE.STICKINESS.STICKY` `TEXTURE.STICKINESS.GUMMY` |
| `SPRINGINESS` | `TEXTURE.SPRINGINESS.SPRINGY` `TEXTURE.SPRINGINESS.RUBBERY` |
| `THICKNESS` | `TEXTURE.THICKNESS.FLUID` `TEXTURE.THICKNESS.THIN` `TEXTURE.THICKNESS.THICK` `TEXTURE.THICKNESS.VISCOUS` |
| `MOISTURE` | `TEXTURE.MOISTURE.DRY` `TEXTURE.MOISTURE.MOIST` `TEXTURE.MOISTURE.JUICY` `TEXTURE.MOISTURE.WET` |
| `OILINESS` | `TEXTURE.OILINESS.NON_FATTY` `TEXTURE.OILINESS.OILY` `TEXTURE.OILINESS.GREASY` |
| `GRAININESS` | `TEXTURE.GRAININESS.GRAINY` `TEXTURE.GRAININESS.GRITTY` `TEXTURE.GRAININESS.SANDY` `TEXTURE.GRAININESS.MEALY` `TEXTURE.GRAININESS.POWDERY` |
| `DENSITY` | `TEXTURE.DENSITY.DENSE` `TEXTURE.DENSITY.AIRY` |
| `SURFACE` | `TEXTURE.SURFACE.SMOOTH` `TEXTURE.SURFACE.ROUGH` `TEXTURE.SURFACE.BUMPY` `TEXTURE.SURFACE.CRUSTY` `TEXTURE.SURFACE.FUZZY` |
| `STRUCTURE` | `TEXTURE.STRUCTURE.FIBROUS` `TEXTURE.STRUCTURE.FLESHY` `TEXTURE.STRUCTURE.LAYERED` `TEXTURE.STRUCTURE.SPONGY` |

- 기존 클라이언트의 `subcategory`가 `TEXTURE`의 하위 category(`hardness` → `HARDNESS` 등)에 해당한다.
- 기존 `shape`의 `notSure`는 새 값에 대응이 없다. `notSure` category(`NOT_SURE`) 하나만 있다.

### 클라이언트 반영 상태

**클라이언트 반영 완료.**

- 앱 안의 값(`lunch`, `home`, `stir_fried`, `eaten` 등)은 소문자로 두고, 서버의 대문자 값과의 변환은 데이터 계층 경계에서만 한다
  (`src/data/dto/values.ts`의 `fromApiEnum`, `toApiEnum`). 서버가 소문자를 보내면 오류로 처리한다.
- 난이도 사유는 앱의 `{category, subcategory, value}` 태그와 서버의 경로 문자열을 `src/data/dto/difficultyReasons.ts`가 변환한다.
  선택지에서 `tasteIntensity`, `shape`, `visibility`, `tasteType`의 `other`를 제거했다. 난이도 메모는 서버로 보내지 않고, 같은 사유는 한 번만 보낸다.
- 저장·수정·리뷰 응답은 모두 식사 상세로 받는다. 음식 안의 `outcome`, `difficulty_reasons`에서 앱의 식후 리뷰(`MealDetail.review`)를,
  `recommendation_tries`에서 추천 연결(`suggestionLinks`, 재료 연결 없음)을 만든다.
- 앱 안의 음식 id는 서버 id를 받기 전까지의 임시 값이다. 저장 응답의 음식 순서로 서버 id를 대응시키고, 수정할 때는 서버 id를 가진
  음식만 `id`와 함께 보낸다.

## 4. 온보딩 API

### 동의
- `kind`가 대문자로 바뀐다 (2절).

### 아이 프로필
- `safety.allergies`와 `safety.restrictions`(`status` + `items`)가 **`restrictions` 목록 하나**로 합쳐진다. 원소는 `RestrictionType` 값이다.

  ```json
  { "restrictions": ["ALLERGY.PEANUTS", "ALLERGY.EGGS", "VEGETARIAN.DAIRY", "DIETARY_APPROACH.GLUTEN_FREE"] }
  ```

- 규칙
  - `ALLERGY.*` 값이 최소 하나 있어야 한다. 알러지가 없으면 `["ALLERGY.NONE"]`을 보낸다. 알러지를 모르는 상태는 없다.
  - `ALLERGY.NONE`은 다른 `ALLERGY.*` 값과 함께 보낼 수 없다.
  - `VEGETARIAN.*`, `DIETARY_APPROACH.*`는 없어도 되며, 없으면 해당 없음이다.
  - 같은 값을 두 번 보낼 수 없다.
- 화면별로 나눠 보여줄 때는 값의 접두사(`ALLERGY.`, `VEGETARIAN.`, `DIETARY_APPROACH.`)로 구분한다.
- 사용자 직접 입력(`custom_name`)은 더 받지 않는다. 선택지에 있는 값만 보낼 수 있다.
- `food_preferences.family_foods`(선호 음식)는 없어진다.
- `age_group`은 2절의 `AgeGroup` 값을 쓴다.
- `safe_foods`는 `status` 없이 항목 목록만 보낸다. 빈 목록이 "없음"이다.
  - 항목은 `name`, `preparation`, `presentation_note`만 보낸다. **`id`는 보내지 않는다.** 서버가 저장할 때마다 목록 전체를
    요청 순서대로 교체하고, 응답에 새로 발급한 `id`를 돌려준다. `id`가 저장마다 바뀔 수 있으므로 클라이언트는 이 `id`를 서버에
    다시 보내거나 영구 키로 쓰지 않는다. 서버가 순서를 따로 보장하는 필드는 없지만 저장한 순서(`id` 순)로 돌려준다.
  - 다른 사용자의 안전 음식을 가리키는 요청이 없어졌으므로 에러 코드 `SAFE_FOOD_NOT_FOUND`는 더 이상 나오지 않는다.

### 요청과 응답

```json
// PUT /api/v1/onboarding 요청
{
  "profile": {
    "child_name": "아이",
    "age_group": "AGE_4_5",
    "restrictions": ["ALLERGY.EGGS", "VEGETARIAN.DAIRY"],
    "safe_foods": [{ "name": "감자", "preparation": "푹 삶기", "presentation_note": null }]
  },
  "consents": [
    { "kind": "ACCOUNT_PRIVACY", "granted": true },
    { "kind": "PHOTO_ANALYSIS", "granted": true },
    { "kind": "AI_TRAINING", "granted": false }
  ]
}
```

- 응답(`GET`, `PUT` 공통)의 `profile`은 같은 필드에 `user_id`, `updated_at`을 더하고, `safe_foods`의 각 항목에 서버가 발급한 `id`가 들어간다.
  프로필이 아직 없으면 `"profile": null`이다.
- `consents`는 세 종류가 모두 한 번씩 있어야 하고 `ACCOUNT_PRIVACY`, `PHOTO_ANALYSIS`는 `granted`가 `true`여야 한다.
- 이전 필드(`safety`, `food_preferences`, 안전 음식의 `status`와 `id`)를 보내면 **422 `VALIDATION_ERROR`**로 거절된다.
  허용 값 밖의 enum 값(소문자 옛 값 포함)이나 위 규칙을 어긴 값도 같은 에러이며, 이때 저장은 일어나지 않는다.

### `RestrictionType` 값 (20개)

| category | 값 |
|---|---|
| `ALLERGY` | `ALLERGY.NONE` `ALLERGY.PEANUTS` `ALLERGY.TREE_NUTS` `ALLERGY.MILK_DAIRY` `ALLERGY.EGGS` `ALLERGY.SOY` `ALLERGY.WHEAT` `ALLERGY.FISH` `ALLERGY.SHELLFISH` `ALLERGY.SESAME` |
| `VEGETARIAN` | `VEGETARIAN.DAIRY` `VEGETARIAN.EGGS` `VEGETARIAN.SEAFOOD` `VEGETARIAN.POULTRY` `VEGETARIAN.RED_MEAT` `VEGETARIAN.LEGUMES_SOY` `VEGETARIAN.NUTS_SEEDS` |
| `DIETARY_APPROACH` | `DIETARY_APPROACH.GLUTEN_FREE` `DIETARY_APPROACH.CASEIN_FREE` `DIETARY_APPROACH.LACTOSE_FREE` |

기존 클라이언트의 제한 id와 달라진다. 이전의 알러지 `lupin` `coconut` `buckwheat` `kiwi` `strawberry`와 식이 제한 `low-fructose`
`no-pork` `no-beef`는 선택지에서 없어진다. 나머지는 위 값으로 옮긴다 (예: `peanut` → `ALLERGY.PEANUTS`, `gluten-free` →
`DIETARY_APPROACH.GLUTEN_FREE`).

### 클라이언트 반영 상태

**클라이언트 반영 완료.**

- 선택지 id는 서버 값에서 category를 뺀 값이다 (`PEANUTS`, `GLUTEN_FREE`, `DAIRY`, 연령 `AGE_4_5` 등). `src/data/api/onboardingApi.ts`가
  전송할 때 `ALLERGY.` `DIETARY_APPROACH.` `VEGETARIAN.`을 붙이고 받을 때 뗀다. 응답에 모르는 값이 있으면 오류로 처리한다.
- 클라이언트 안의 `none`은 서버 값이 아니다. 알러지 `none`은 `ALLERGY.NONE`으로 보내고, 식이 제한 `none`은 보내지 않는다.
  읽을 때 식이 제한이 비어 있으면 `none`으로 복원한다.
- `family` 단계는 `vegetarian` 단계(`VEGETARIAN.*`, 프로필 필드 `vegetarianRestrictions`)로 바뀌었고 선택 사항이다.
  채식 제한이 하나라도 있으면 `hasVerifiedNoRestrictions`는 거짓이다.
- 안심 음식 단계도 선택 사항이다. `noSafeFoods`는 없어졌고 빈 목록이 "없음"이다. 안심 음식 `id`는 보내지 않는다.
- 직접 입력(`other`)과 카탈로그 검색, 카탈로그 전용 선택지는 제거했다.
- 이전 형식의 로컬 초안과 프로필 캐시는 필드 검증에서 걸러져 버려진다.

## 5. 추천 API

### 응답 (`SuggestionResponse`)

- `ingredient_id`, `food_snapshot`이 사라지고 `food_id`는 `origin_food_id`가 된다(근거가 된 음식).
  `meal_id`는 남는다. 서버가 근거 음식에서 채우며, 원본 식사를 찾는 데 쓴다.
- `ingredients`(문자열 목록), `cooking_method`(2절의 값), `causes`(식후 리뷰에서 참고한 특성을 서술한 문장)가 추가된다.
  `what_to_try`, `why_this_may_help`, `serving_tip`은 그대로다.
- `status`는 `PENDING` `SAVED` `DISMISSED` `TRIED`, `dismiss_reasons`는 2절의 새 값이다.

### 요청과 규칙

- 생성(`POST /meals/{id}/suggestions`)의 대상은 음식 단위다: `{"targets": [{"food_id": "…"}]}`. `ingredient_id`를 보내면 422다.
  - 식후 리뷰가 없는 식사는 `409 REVIEW_REQUIRED`, 리뷰하지 않은 음식이나 이 식사에 없는 음식은 `422 INVALID_SUGGESTION_TARGET`이다.
  - 아이의 제한은 프로필의 `restrictions`(`ALLERGY.NONE` 제외)다. 프로필이 없으면 `409 PROFILE_REQUIRED`다.
  - 추천에 쓰는 재료는 아이의 모든 제한에 `NEVER` 판정이 있는 재료뿐이다 ([제한 id 규칙](food-ingredient-restriction-ids.md)).
- 결정(`PUT/DELETE /suggestions/{id}/decision`)의 `status`는 `SAVED` `DISMISSED`만 보낸다. `TRIED`인 추천은 결정을 바꿀 수 없다
  (`409 RECOMMENDATION_ALREADY_TRIED`).
- 목록(`GET /meals/{id}/suggestions`)의 `status` 쿼리는 `SAVED`(기본) `ALL`이다. `SAVED`는 `SAVED`와 `TRIED`를 함께 보여 주며,
  저장된 추천 목록(`GET /suggestions`)도 같다. `ALL`은 enum 값이 아니라 조회용 값이다.

### 시도 상태 (`TRIED`)

- 식사를 저장할 때 음식의 `food_recommendation_ids`로 추천을 연결하면(3절) 그 추천은 `TRIED`가 된다. `SAVED`와 `TRIED`인 추천만 연결할 수 있고,
  이미 `TRIED`인 추천도 다른 식사에 다시 연결할 수 있다.
- 시도한 식사나 음식을 지워 마지막 시도 기록이 없어지면 추천은 `SAVED`로 돌아간다.
- 추천의 근거가 된 음식(식사)을 지우면 그 음식에서 나온 추천과 그 추천의 시도 기록도 함께 지워진다.

### 클라이언트 반영 상태

**클라이언트 반영 완료.**

- 앱 안의 상태·사유 값은 소문자(`tried`, `not_fit` 등)로 두고 서버의 대문자와의 변환은 `src/data/dto/suggestionDto.ts`에서만 한다.
  거절 사유의 앱 값은 서버 값을 소문자로 쓴 것이다 (`restriction` `dislike` `not_fit` `too_much_preparation` `ingredient_hard_to_get` `already_tried`).
  화면 문구는 키만 바꾸었고 내용은 그대로다.
- 추천은 음식 단위다. 재료를 골라 추천받는 선택지와 추천 카드의 재료 이름 표시, 식사 기록의 재료 카드에 붙던 추천 연결을 없앴다.
  추천에 음식 이름이 없으므로 화면은 원본 식사(`meal_id`)의 음식에서 이름을 찾는다.
- 추천 카드의 상세는 추천이 제안하는 음식의 `ingredients`, `cooking_method`, `serving_tip`을 보여 준다. `causes`는 아직 화면에 보이지 않는다.
- 저장된 추천 목록은 `SAVED`와 `TRIED`를 함께 받는다.
- 식사 저장 요청의 추천 연결은 음식별 `food_recommendation_ids`다 (3절).

## 6. 변경이 없는 API

- 로그인, 회원가입, 토큰 재발급, 이름 변경, 이메일 변경(요청과 확인), 계정 삭제의 요청과 응답은 그대로다.
  이메일 변경은 서버 내부 저장 구조만 바뀐다.

## 7. 협의가 필요한 항목

남은 협의 항목은 없다.
