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
- 식사를 저장하는 요청에서 음식과 재료의 `id`를 보내지 않는다. 응답에 서버가 발급한 id가 들어온다.
- 식사를 수정할 때 기존 음식·재료를 어떻게 식별하는지는 7절의 협의 항목이다.
- 식사 안의 재료(`meal_food_ingredients`)는 사용자가 입력한 이름을 그대로 저장한 기록이다. 추천용 재료 카탈로그와는 별개이며
  서로 참조하지 않는다.

### 식후 리뷰
- 리뷰 결과가 음식과 재료 객체 안으로 들어간다. 별도의 `food_results`, `ingredient_results`는 없어진다.
  - 음식과 재료는 각각 `outcome`(`EatingOutcome` 값 또는 `null`)과 난이도 사유 목록을 가진다. **`outcome`이 `null`이면 아직 리뷰하지 않은 것이다.**
  - 응답의 `food_snapshot`은 사라진다. 음식 정보는 음식 객체가 직접 갖는다.
- 난이도 사유는 `{category, subcategory, value}` 객체의 목록에서 **문자열 목록**으로 바뀐다. 필드 이름은 7절에서 정한다.

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
- `safe_foods`는 `status` 없이 항목 목록만 보낸다. 빈 목록이 "없음"이다. 항목의 순서는 보존되지 않는다.

### `RestrictionType` 값 (20개)

| category | 값 |
|---|---|
| `ALLERGY` | `ALLERGY.NONE` `ALLERGY.PEANUTS` `ALLERGY.TREE_NUTS` `ALLERGY.MILK_DAIRY` `ALLERGY.EGGS` `ALLERGY.SOY` `ALLERGY.WHEAT` `ALLERGY.FISH` `ALLERGY.SHELLFISH` `ALLERGY.SESAME` |
| `VEGETARIAN` | `VEGETARIAN.DAIRY` `VEGETARIAN.EGGS` `VEGETARIAN.SEAFOOD` `VEGETARIAN.POULTRY` `VEGETARIAN.RED_MEAT` `VEGETARIAN.LEGUMES_SOY` `VEGETARIAN.NUTS_SEEDS` |
| `DIETARY_APPROACH` | `DIETARY_APPROACH.GLUTEN_FREE` `DIETARY_APPROACH.CASEIN_FREE` `DIETARY_APPROACH.LACTOSE_FREE` |

기존 클라이언트의 제한 id와 달라진다. 이전의 알러지 `lupin` `coconut` `buckwheat` `kiwi` `strawberry`와 식이 제한 `low-fructose`
`no-pork` `no-beef`는 선택지에서 없어진다. 나머지는 위 값으로 옮긴다 (예: `peanut` → `ALLERGY.PEANUTS`, `gluten-free` →
`DIETARY_APPROACH.GLUTEN_FREE`).

## 5. 추천 API

- 추천 응답에서 `meal_id`, `ingredient_id`, `food_snapshot`이 사라지고 `food_id`는 `origin_food_id`가 된다(근거가 된 음식).
- `ingredients`(문자열 목록), `cooking_method`(2절의 값), `causes`(식후 리뷰에서 참고한 특성을 서술한 문장)가 추가된다.
  `what_to_try`, `why_this_may_help`, `serving_tip`은 그대로다.
- `status`에 `TRIED`가 추가된다. 추천을 시도한 식사가 기록되면 `TRIED`다.
- 추천은 음식 단위로만 만든다. 생성 요청의 대상에서 `ingredient_id`가 사라진다.
- `dismiss_reasons`는 2절의 새 값을 쓴다.
- 추천을 시도한 기록과 평가(`feedback`)는 추천 시도 항목(`food_recommendation_tries`)으로 관리하며 값은 2절을 따른다.

## 6. 변경이 없는 API

- 로그인, 회원가입, 토큰 재발급, 이름 변경, 이메일 변경(요청과 확인), 계정 삭제의 요청과 응답은 그대로다.
  이메일 변경은 서버 내부 저장 구조만 바뀐다.

## 7. 협의가 필요한 항목

| 항목 | 내용 |
|---|---|
| 식사 수정 시 음식·재료 식별 | id가 서버 발급이라 수정 요청에서 기존 항목을 가리키는 방법이 필요하다. 음식을 지우고 다시 만들면 그 음식에서 나온 추천도 함께 삭제된다. |
| 난이도 사유 필드 이름 | 서버 저장 컬럼은 `difficulty_reasons`다. 요청·응답의 필드 이름은 정하지 않았다. |
| 추천 목록 조회 필터 | 목록 조회의 `status` 쿼리 값(`saved`, `all`)을 대문자로 맞춘다. `ALL`은 enum 값이 아니라 조회용 값이다. |
| 재료 카탈로그 응답 | `ingredients`의 이름이 `korean_name`, `english_name`으로 나뉜다. 응답의 이름 필드를 어떻게 줄지 정하지 않았다. |
