# Meal Checkin · After Meal Review · Suggestion

설계 초안 · 공통 스키마 · Meal Checkin · After Meal Review · Suggestion

## 공통 스키마

### 값 타입

| 타입 | JSON / DB |
|---|---|
| `Id` | 양의 Long 10진수 문자열 / `BIGINT` |
| `IngredientId` | 양의 Long의 10진수 문자열 / `BIGINT`; 모든 유저에게 ingredient의 id는 같은 값을 쓴다 |
| `Date` | `YYYY-MM-DD` / `DATE` |
| `Timestamp` | 시간대 포함 ISO 8601 / `TIMESTAMPTZ` |
| `MealType` | `breakfast`, `lunch`, `dinner`, `snack` |
| `MealLocation` | `home`, `restaurant`, `school`, `others` |
| `CookingMethod` | `raw`, `boiled`, `steamed`, `pan_fried`, `stir_fried`, `baked_roasted`, `mashed_blended`, `other` |
| `Outcome` | `eaten`, `tasted`, `untouched`, `unclear` |
| `DifficultyCategory` | `texture`, `tasteType`, `tasteIntensity`, `smell`, `color`, `shape`, `visibility`, `temperature`, `notSure`, `pieceSize`, `arrangement` |
| `SuggestionStatus` | `pending`, `saved`, `dismissed` |

### Ingredient
```json
{
    "id": "212",
    "name": "감자"
}
```
| 필드 | 타입 |
|---|---|
|`id`| `IngredientId`, DB 전체에서 고유 |
| `name` | 공백 제외 비어 있지 않은 문자열 |

### IngredientInput

```json
{ "id": null, "name": "감자" }
```

| 필드 | 타입 / 설명 |
|---|---|
| `id` | 문자열 또는 `null`; 유효한 `IngredientId`가 아니거나 이름과 맞지 않으면 이름으로 다시 찾음 |
| `name` | 공백 제외 비어 있지 않은 문자열; 재료 확인의 기준 |

### Difficulty

```json
{
  "category": "texture",
  "subcategory": "hardness",
  "value": "hard"
}
```

| 필드 | 타입 |
|---|---|
| `category` | `DifficultyCategory` |
| `subcategory` | 세부 분류 코드 또는 `null` |
| `value` | 분류별 선택 코드; 전체 허용 조합은 After Meal Review 작성 시 정의, 이외인 경우엔 사용자가 직접 입력한 것으로 간주|

### FoodItem

```json
{
  "id": "1",
  "meal_id": "1",
  "name": "당근 감자볶음",
  "cooking_method": "stir_fried",
  "serving_note": "작게 잘라 제공",
  "acceptance": 1
}
```

| 필드 | 타입 |
|---|---|
| `id` | `Id`; 식사 안에서 고유한 음식 ID |
| `meal_id` | `Id`; 소속 식사 ID |
| `name` | 공백 제외 비어 있지 않은 문자열 |
| `cooking_method` | `CookingMethod` 또는 `null` |
| `serving_note` | 문자열 또는 `null` |
| `acceptance` | 정수 `0`~`3` 또는 `null` |

DB 기본 키는 `(meal_id, id)`이다. 음식의 소유자는 소속 `Meal.user_id`로 확인한다.

### MealFoodIngredient

```json
{
  "meal_id": "1",
  "food_id": "1",
  "ingredient_id": "182"
}
```

| 필드 | 타입 |
|---|---|
| `meal_id` | `Id`; 재료를 사용한 식사 ID |
| `food_id` | `Id`; 재료를 사용한 음식 ID |
| `ingredient_id` | `IngredientId`; 공통 `Ingredient.id` 참조 |

DB 기본 키는 `(meal_id, food_id, ingredient_id)`이다. 음식의 재료 이름은 `Ingredient.name`에서 읽는다.

### Meal

```json
{
  "id": "1",
  "user_id": "1",
  "meal_date": "2026-10-20",
  "meal_type": "breakfast",
  "setting": "home",
  "before_photo_uri": "this_is_uri",
  "after_photo_uri": null,
  "saved_at": "2026-10-20T17:42:48.650Z"
}
```

| 필드 | 타입 / 설명 |
|---|---|
| `id` | `Id`; 식사 ID |
| `user_id` | `Id`; 식사를 소유한 사용자 ID |
| `meal_date` | `Date`; 식사를 한 날짜 |
| `meal_type` | `MealType`; 아침·점심·저녁·간식 구분 |
| `setting` | `MealLocation`; 식사 장소 |
| `before_photo_uri` | 문자열 또는 `null`; 식사 전 사진의 URI, 사진이 없으면 `null` |
| `after_photo_uri` | 문자열 또는 `null`; 식사 후 사진의 URI, 사진이 없으면 `null` |
| `saved_at` | `Timestamp`; 식사 저장 시각 |

### FoodItemDetail

`FoodItem`의 모든 필드와 `ingredients: Ingredient[]`로 구성한 조회 응답이다. `ingredients`는 `MealFoodIngredient`와 `Ingredient`를 조회해 채운다. 재료가 없으면 `[]`이다.

### MealDetail

`Meal`의 모든 필드에 `foods: FoodItemDetail[]`, `review: { food_results: ReviewFoodResult[], ingredient_results: ReviewIngredientResult[] } | null`, `suggestion_links`를 더한 조회 응답이다.


### FoodSnapshot

```json
{
  "name": "당근 감자볶음",
  "ingredients": [
    { "id": "182", "name": "당근" },
    { "id": "212", "name": "감자" }
  ],
  "cooking_method": "stir_fried",
  "serving_note": "작게 잘라 제공",
  "acceptance": 1
}
```

`FoodSnapshot`은 저장 당시 음식 내용과 재료 ID·이름을 보존한다. 음식·식사·사용자 ID는 스냅샷을 소유한 객체의 필드에서 확인한다.

### ReviewFoodResult

```json
{
  "meal_id": "1",
  "food_id": "1",
  "food_snapshot": {
    "name": "당근 감자볶음",
    "ingredients": [
      { "id": "182", "name": "당근" },
      { "id": "212", "name": "감자" }
    ],
    "cooking_method": "stir_fried",
    "serving_note": "작게 잘라 제공",
    "acceptance": 1
  },
  "outcome": null,
  "difficulties": []
}
```

| 필드 | 타입 / 설명 |
|---|---|
| `meal_id` | `Id`; 평가한 식사 ID |
| `food_id` | `Id`; 평가한 음식 ID |
| `food_snapshot` | `FoodSnapshot`; Review 저장 당시 음식과 재료의 복사본 |
| `outcome` | `Outcome` 또는 `null`; 음식 자체를 평가하지 않았다면 `null` |
| `difficulties` | `Difficulty[]`; 없으면 `[]` |

DB의 기본 키는 `(meal_id, food_id)`이다. Review 저장 시 식사에 속한 음식마다 한 행을 만든다.

### ReviewIngredientResult

```json
{
  "meal_id": "1",
  "food_id": "1",
  "ingredient_id": "182",
  "outcome": "untouched",
  "difficulties": [
    {
      "category": "texture",
      "subcategory": "hardness",
      "value": "hard"
    }
  ]
}
```

| 필드 | 타입 / 설명 |
|---|---|
| `meal_id` | `Id`; 평가한 식사 ID |
| `food_id` | `Id`; 재료가 속한 음식 ID |
| `ingredient_id` | `IngredientId`; 평가한 공통 재료 ID |
| `outcome` | `Outcome` 또는 `null` |
| `difficulties` | `Difficulty[]`; 없으면 `[]` |

DB의 기본 키는 `(meal_id, food_id, ingredient_id)`이다. 평가한 재료에만 행을 만든다. `ingredient_id`는 부모 `ReviewFoodResult.food_snapshot.ingredients`에 포함되어야 한다.

### Suggestion

```json
{
    "id": "301",
    "user_id": "1",
    "meal_id": "1",
    "food_id": "1",
    "ingredient_id": "182",
    "food_snapshot": {
        "name": "당근 감자볶음",
        "ingredients": [{ "id": "182", "name": "당근" }],
        "cooking_method": "stir_fried",
        "serving_note": "작게 잘라 제공",
        "acceptance": 1
    },
    "what_to_try": "당근을 더 부드럽게 익혀 제공",
    "why_this_may_help": "부드러운 식감부터 시도할 수 있습니다.",
    "serving_tip": "소량씩 제공",
    "status": "pending",
    "dismiss_reasons": [],
    "saved_at": null,
    "created_at": "2026-10-20T17:42:48.650Z"
}
```

| 필드 | 타입 / 설명 |
|---|---|
| `id` | `Id`; 추천 ID |
| `user_id` | `Id`; 추천을 소유한 사용자 ID |
| `meal_id` | `Id`; 추천의 원본 식사 ID |
| `food_id` | `Id`; 추천의 원본 음식 ID |
| `ingredient_id` | `IngredientId` 또는 `null`; `null`이면 음식 전체가 추천 대상 |
| `food_snapshot` | `FoodSnapshot`; 추천 생성 당시 원본 음식의 정보 |
| `what_to_try` | 비어 있지 않은 문자열; 다음 식사에서 시도할 내용 |
| `why_this_may_help` | 비어 있지 않은 문자열; 추천 이유 |
| `serving_tip` | 문자열 또는 `null`; 음식을 제공할 때의 팁 |
| `status` | `SuggestionStatus`; 추천의 현재 상태 |
| `dismiss_reasons` | 제외 이유 코드 배열; 제외하지 않았다면 `[]` |
| `saved_at` | `Timestamp` 또는 `null`; 저장한 추천의 저장 시각, 그 외에는 `null` |
| `created_at` | `Timestamp`; 추천 생성 시각 |

Food는 수정 가능, Meal 정보는 수정 불가능. 따라서 Food Snapshot만을 저장하고, Meal Snapshot은 저장하지 않는다.

### SuggestionMealLink (`suggestion_meal_links`)

추천을 실제 식사에 연결한 기록이다. 추천 원본 식사(`suggestions.meal_id`)와 연결된 식사(`meal_id`)는 다르다.

```json
{
  "id": "401",
  "suggestion_id": "301",
  "meal_id": "2",
  "food_id": "1",
  "ingredient_id": "182",
  "feedback": null,
  "created_at": "2026-10-21T12:00:00+09:00",
  "updated_at": "2026-10-21T12:00:00+09:00"
}
```

| 컬럼 | DB 타입 | 설명 |
|---|---|---|
| `id` | `BIGINT` | 연결 ID |
| `suggestion_id` | `BIGINT` | 연결한 추천 ID |
| `meal_id` | `BIGINT` | 추천을 적용한 식사 ID |
| `food_id` | `BIGINT` | 적용 대상 식사에 속한 음식 ID |
| `ingredient_id` | `BIGINT NULL` | 특정 재료에 적용했다면 그 재료 ID; 음식 전체이면 `NULL` |
| `feedback` | `TEXT NULL` | 적용 후 평가: `helpful`, `not_helpful`, `not_sure`; 미응답은 `NULL` |
| `created_at` | `TIMESTAMPTZ` | 연결한 시각; 서버가 생성 |
| `updated_at` | `TIMESTAMPTZ` | 연결 또는 평가를 마지막으로 바꾼 시각; 서버가 생성 |

기본 키는 `id`, 중복 방지 키는 `(suggestion_id, meal_id)`이다. `suggestion_id`는 `suggestions.id`, `(meal_id, food_id)`는 `meal_foods(meal_id, id)`를 참조한다. 연결의 소유자는 `Suggestion.user_id`와 적용 대상 `Meal.user_id`로 확인하며 두 값은 같아야 한다. `ingredient_id`가 있으면 해당 음식의 재료여야 한다.



### ProfileChoice

```json
{
  "code": "egg",
  "custom_name": null
}
```

| 필드 | 타입 / 설명 |
|---|---|
| `code` | 선택지 코드 또는 `null`; 직접 입력한 항목이면 `null` |
| `custom_name` | 공백 제외 비어 있지 않은 문자열 또는 `null`; 선택지 코드를 사용하면 `null` |

`code`와 `custom_name` 중 하나만 값을 갖는다. 화면 표시 문구 대신 선택지 코드를 저장한다.

### SafeFood

```json
{
  "id": "501",
  "name": "감자",
  "preparation": "푹 삶기",
  "presentation_note": "작게 잘라 제공"
}
```

| 필드 | 타입 / 설명 |
|---|---|
| `id` | `Id`; 서버가 발급한 안심 음식 ID |
| `name` | 공백 제외 비어 있지 않은 문자열 |
| `preparation` | 공백 제외 비어 있지 않은 문자열; 익숙하게 제공하는 조리 방식 |
| `presentation_note` | 문자열 또는 `null`; 제공 형태에 관한 메모 |

`SafeFood`는 사용자 프로필에 속한 음식이며 공통 `Ingredient`나 식사별 `FoodItem`과는 별개이다.

### UserProfile

```json
{
  "user_id": "1",
  "child_name": "아이 이름",
  "age_group": "4-5",
  "safety": {
    "allergies": {
      "status": "specified",
      "items": [{ "code": "egg", "custom_name": null }]
    },
    "restrictions": {
      "status": "none",
      "items": []
    }
  },
  "food_preferences": {
    "family_foods": [{ "code": "eggs", "custom_name": null }],
    "dietary_approaches": [],
    "difficult_textures": [],
    "smell_sensitivity": "sometimes",
    "difficult_tastes": [],
    "presentation_preferences": [],
    "preferred_temperature": "warm",
    "new_food_response": "plate"
  },
  "safe_foods": {
    "status": "listed",
    "items": [
      {
        "id": "501",
        "name": "감자",
        "preparation": "푹 삶기",
        "presentation_note": "작게 잘라 제공"
      }
    ]
  },
  "updated_at": "2026-10-21T12:00:00+09:00"
}
```

| 필드 | 타입 / 설명 |
|---|---|
| `user_id` | `Id`; 프로필의 기본 키이자 소유 사용자 ID. 사용자당 프로필은 하나이다 |
| `child_name` | 공백 제외 비어 있지 않은 문자열 |
| `age_group` | 연령대 코드: `under-2`, `2-3`, `4-5`, `6-8`, `9-12`, `13-plus` |
| `safety.allergies` | `{ status, items: ProfileChoice[] }`; `status`는 `unknown`, `none_known`, `specified` 중 하나. `specified`일 때만 `items`가 비어 있지 않음 |
| `safety.restrictions` | `{ status, items: ProfileChoice[] }`; `status`는 `none`, `specified` 중 하나. `specified`일 때만 `items`가 비어 있지 않음 |
| `food_preferences.family_foods` | `ProfileChoice[]`; 가족 식단에 포함할 식품군, 1개 이상 |
| `food_preferences.dietary_approaches` | `ProfileChoice[]`; 적용할 식이 방식, 없으면 `[]` |
| `food_preferences.difficult_textures` | `ProfileChoice[]`; 어려워하는 식감, 없으면 `[]` |
| `food_preferences.smell_sensitivity` | `yes`, `sometimes`, `no`, `unsure` 또는 `null` |
| `food_preferences.difficult_tastes` | `ProfileChoice[]`; 어려워하는 맛, 없으면 `[]` |
| `food_preferences.presentation_preferences` | `ProfileChoice[]`; 음식 제공 형태의 선호, 없으면 `[]` |
| `food_preferences.preferred_temperature` | `none`, `warm`, `cool`, `room`, `depends` 또는 `null` |
| `food_preferences.new_food_response` | `tastes`, `plate`, `nearby`, `removed`, `varies`, `unsure` 또는 `null` |
| `safe_foods.status` | `none` 또는 `listed`; `none`이면 `items`는 `[]`, `listed`이면 1개 이상 |
| `safe_foods.items` | `SafeFood[]`; 안심 음식 목록 |
| `updated_at` | `Timestamp`; 서버가 기록한 마지막 수정 시각 |

배열의 `items`에는 `none` 같은 선택지 코드를 넣지 않는다. 보호자 이름·이메일·비밀번호는 사용자 계정에 속하며 프로필에 복사하지 않는다. 작성 단계와 입력 중인 값은 완료된 프로필에 포함하지 않는다.

### UserConsent

```json
{
  "id": "601",
  "user_id": "1",
  "kind": "photo_analysis",
  "granted": true,
  "document_version": "2026-10-21",
  "recorded_at": "2026-10-21T12:00:00+09:00"
}
```

| 필드 | 타입 / 설명 |
|---|---|
| `id` | `Id`; 서버가 발급한 동의 기록 ID |
| `user_id` | `Id`; 동의한 사용자 ID |
| `kind` | `account_privacy`, `photo_analysis`, `ai_training` 중 하나 |
| `granted` | 불리언; 동의 여부 |
| `document_version` | 공백 제외 비어 있지 않은 문자열; 동의 문서의 버전 |
| `recorded_at` | `Timestamp`; 서버가 기록한 선택 시각 |

동의 선택을 바꾸면 새 `UserConsent` 기록을 추가한다. 현재 선택은 `(user_id, kind)`별로 가장 최근 기록에서 확인한다.

## API 목록

### Meal Checkin

| API | 요청 | 성공 응답 | 인증 |
|---|---|---|---|
| `GET /api/v1/ingredients` | 본문 없음 | `200`, `Ingredient[]` | Bearer 토큰 |
| `POST /api/v1/ingredients/resolve` | `IngredientInput` | `200`, `Ingredient` | Bearer 토큰 |
| `GET /api/v1/suggestions` | 본문 없음 | `200`, `SuggestionResponse[]` | Bearer 토큰; 해당 user 접근 권한 |
| `PUT /api/v1/meals` | `MealWriteRequest` | `200`, `MealWriteResponse` | Bearer 토큰; 해당 user 접근 권한 |

#### `GET /api/v1/ingredients`

- 응답
  - 모든 사용자가 공유하는 재료 목록 `Ingredient[]`. ID 오름차순으로 반환한다.

#### `POST /api/v1/ingredients/resolve`

- 요청
  - 공통 스키마의 `IngredientInput`.
- 응답
  - 입력 이름과 일치하는 `Ingredient`. ID가 없거나 존재하지 않거나 이름과 맞지 않아도 이름으로 찾는다. 이름 앞뒤 및 연속 공백과 영문 대소문자는 비교할 때 정리한다.
- 오류
  - 이름에 해당하는 재료가 없으면 `404 INGREDIENT_NOT_FOUND`.

#### `GET /api/v1/suggestions`
저장된 추천들을 모두 반환한다. 결과는 created_at 내림차순이다. 
- 쿼리 파라미터: 
    - after_meal_date
        - Date || null
        - 추천 생성일이 이것보다 뒤인 추천들만 반환

- 응답
    - `SuggestionResponse[]`: 공통 스키마의 `Suggestion[]`

#### `PUT /api/v1/meals`
- 요청
  - `MealWriteRequest`:

    ```json
    {
      "meal_date": "2026-10-20",
      "meal_type": "lunch",
      "setting": "home",
      "before_photo_uri": null,
      "foods": [
        {
          "id": "1",
          "name": "당근 감자볶음",
          "ingredients": [
            { "id": "182", "name": "당근" },
            { "id": null, "name": "감자" }
          ],
          "cooking_method": "stir_fried",
          "serving_note": "작게 잘라 제공",
          "acceptance": 1
        }
      ],
      "suggestion_links": [
        {
          "suggestion_id": "301",
          "food_id": "1",
          "ingredient_id": null
        }
      ]
    }
    ```
- 응답
  - `MealWriteResponse`: 공통 스키마의 `Meal`

서버는 `foods[].ingredients`의 각 항목을 공통 재료 DB에서 이름으로 확인하고, 확정된 ID로 `MealFoodIngredient`를 저장한다. 이름에 해당하는 재료가 없으면 `404 INGREDIENT_NOT_FOUND`이다.

### After Meal Review

| API | 요청 | 성공 응답 | 인증 |
|---|---|---|---|
| `GET /api/v1/meals/{meal_id}` | 본문 없음 | `200`, `MealDetail` | Bearer 토큰; 해당 식사 접근 권한 |
| `PUT /api/v1/meals/{meal_id}/review` | `MealReviewWriteRequest` | `200`, `MealReviewResponse` | Bearer 토큰; 해당 식사 접근 권한 |

#### `GET /api/v1/meals/{meal_id}`

- 경로 파라미터
  - `meal_id`: 조회할 식사의 `Id`
- 응답
  - 공통 스키마의 `MealDetail`. 음식과 재료, Review 결과, 식사에 연결된 추천을 포함한다. Review를 저장하기 전에는 `review`가 `null`이다.

#### `PUT /api/v1/meals/{meal_id}/review`

- 경로 파라미터
  - `meal_id`: 평가할 식사의 `Id`
- 요청
  - `MealReviewWriteRequest`:

    ```json
    {
      "after_photo_uri": "this_is_after_photo_uri",
      "food_results": [
        {
          "food_id": "1",
          "outcome": null,
          "difficulties": [],
          "ingredient_outcomes": [
            {
              "ingredient_id": "182",
              "outcome": "untouched",
              "difficulties": [
                {
                  "category": "texture",
                  "subcategory": "hardness",
                  "value": "hard"
                }
              ]
            }
          ]
        }
      ]
    }
    ```
  - 요청에는 `meal_id`, `food_snapshot`을 넣지 않는다. 서버가 경로의 식사와 저장된 음식·재료에서 확인하고, 평가를 저장할 때 `FoodSnapshot`을 만든다.
- 응답
  - `MealReviewResponse`: 갱신된 `meal`은 공통 스키마의 `Meal`, `food_results`는 `ReviewFoodResult[]`, `ingredient_results`는 `ReviewIngredientResult[]`이다.

    ```json
    {
      "meal": {
        "id": "1",
        "user_id": "1",
        "meal_date": "2026-10-20",
        "meal_type": "lunch",
        "setting": "home",
        "before_photo_uri": null,
        "after_photo_uri": "this_is_after_photo_uri",
        "saved_at": "2026-10-20T17:42:48.650Z"
      },
      "food_results": [
        {
          "meal_id": "1",
          "food_id": "1",
          "food_snapshot": {
            "name": "당근 감자볶음",
            "ingredients": [
              { "id": "182", "name": "당근" },
              { "id": "212", "name": "감자" }
            ],
            "cooking_method": "stir_fried",
            "serving_note": "작게 잘라 제공",
            "acceptance": 1
          },
          "outcome": null,
          "difficulties": []
        }
      ],
      "ingredient_results": [
        {
          "meal_id": "1",
          "food_id": "1",
          "ingredient_id": "182",
          "outcome": "untouched",
          "difficulties": [
            {
              "category": "texture",
              "subcategory": "hardness",
              "value": "hard"
            }
          ]
        }
      ]
    }
    ```


### Suggestion

| API | 요청 | 성공 응답 | 인증 |
|---|---|---|---|
| `GET /api/v1/meals/{meal_id}` | 위에서 정의됨 | 위에서 정의됨 | 위에서 정의됨 |
| `GET /api/v1/meals/{meal_id}/suggestions?status=all` | 본문 없음 | `200`, `Suggestion[]` | Bearer 토큰; 해당 식사 접근 권한 |
| `POST /api/v1/meals/{meal_id}/suggestions` | `SuggestionGenerateRequest` | `201`, `Suggestion[]` | Bearer 토큰; 해당 식사 접근 권한 |
| `PUT /api/v1/suggestions/{suggestion_id}/decision` | `SuggestionDecisionRequest` | `200`, `Suggestion` | Bearer 토큰; 해당 추천 접근 권한 |
| `DELETE /api/v1/suggestions/{suggestion_id}/decision` | 본문 없음 | `200`, `Suggestion` | Bearer 토큰; 해당 추천 접근 권한 |

#### `GET /api/v1/meals/{meal_id}/suggestions?status=all`

- 경로 파라미터
  - `meal_id`: 추천의 원본 식사 `Id`.
- 쿼리 파라미터
  - `status=all`: 해당 식사에서 생성한 `pending`, `saved`, `dismissed` 추천을 모두 조회한다. `status`를 생략하면 `saved` 추천만 조회한다.
- 응답
  - 공통 스키마의 `Suggestion[]`. 추천이 없으면 `[]`이며, `created_at` 내림차순으로 반환한다.

#### `POST /api/v1/meals/{meal_id}/suggestions`

- 경로 파라미터
  - `meal_id`: 추천의 원본 식사 `Id`. 이 식사의 Review가 저장되어 있어야 한다.
- 요청
  - `SuggestionGenerateRequest`:

    ```json
    {
      "targets": [
        { "food_id": "1", "ingredient_id": null },
        { "food_id": "1", "ingredient_id": "182" }
      ]
    }
    ```

  - `targets`: 추천을 생성할 음식 또는 재료의 목록. 비어 있을 수 없고, `(food_id, ingredient_id)` 조합은 중복될 수 없다.
  - `food_id`: 해당 식사의 Review에 포함된 음식 `Id`.
  - `ingredient_id`: 해당 음식에서 평가한 재료의 `IngredientId`. 음식 전체를 대상으로 하면 `null`.
- 응답
  - `Suggestion[]`: 선택한 대상마다 공통 스키마의 `Suggestion` 한 개를 생성해 반환한다. 새 추천은 `status = pending`, `dismiss_reasons = []`, `saved_at = null`이다.

#### `PUT /api/v1/suggestions/{suggestion_id}/decision`

- 경로 파라미터
  - `suggestion_id`: 저장하거나 제외할 추천의 `Id`.
- 요청
  - `SuggestionDecisionRequest`:

    ```json
    {
      "status": "dismissed",
      "dismiss_reasons": ["too_much_preparation"]
    }
    ```

  - `status`: `saved` 또는 `dismissed`.
  - `dismiss_reasons`: `saved`이면 `[]`, `dismissed`이면 중복 없는 이유 코드 1개 이상.
  - 이유 코드: `restriction_conflict`, `disliked_food_or_form`, `food_preferences`, `too_much_preparation`, `ingredient_unavailable`, `already_tried`.
- 응답
  - 공통 스키마의 `Suggestion`. 서버가 `status`와 `dismiss_reasons`를 갱신한다. `saved`이면 `saved_at`에 저장 시각을 기록하고, `dismissed`이면 `saved_at`을 `null`로 둔다.

#### `DELETE /api/v1/suggestions/{suggestion_id}/decision`

- 경로 파라미터
  - `suggestion_id`: 저장 또는 제외 결정을 취소할 추천의 `Id`.
- 요청
  - 본문 없음.
- 응답
  - 공통 스키마의 `Suggestion`. `status = pending`, `dismiss_reasons = []`, `saved_at = null`로 반환한다.

### Meal History

| API | 요청 | 성공 응답 | 인증 |
|---|---|---|---|
| `GET /api/v1/meals` | 본문 없음 | `200`, `MealDetail[]` | Bearer 토큰; 해당 user 접근 권한 |
| `GET /api/v1/meals/{meal_id}` | 위에서 정의됨 | 위에서 정의됨 | 위에서 정의됨 |
| `DELETE /api/v1/meals/{meal_id}` | 본문 없음 | `204`, 본문 없음 | Bearer 토큰; 해당 식사 접근 권한 |

#### `GET /api/v1/meals`

- 요청
  - 본문 없음.
- 응답
  - 로그인한 사용자의 모든 식사를 공통 스키마의 `MealDetail[]`로 반환한다. 식사가 없으면 `[]`이다.
  - `meal_date` 내림차순으로 정렬하고, 날짜가 같으면 `id` 내림차순으로 정렬한다.
  - 클라이언트는 `review === null`로 평가하지 않은 식사를 거르고, `foods[].name`과 `foods[].ingredients[].name`으로 음식·재료를 검색한다. 음식·재료에 연결된 추천은 `suggestion_links`에서 확인한다.

#### `DELETE /api/v1/meals/{meal_id}`

- 경로 파라미터
  - `meal_id`: 삭제할 식사의 `Id`.
- 요청
  - 본문 없음.
- 응답
  - `204 No Content`. 응답 본문은 없다.
  - 식사와 그 음식·재료 연결, Review 결과, 이 식사에 적용한 추천 연결을 함께 삭제한다. 이 식사에서 생성한 `Suggestion`은 유지한다.
  - 식사가 없거나 접근 권한이 없으면 `404 MEAL_NOT_FOUND`를 반환한다.

### 회원가입 · 온보딩

| API | 요청 | 성공 응답 | 인증 |
|---|---|---|---|
| `POST /api/v1/auth/signup` | `SignUpRequest` | `201`, `UserResponse` | 불필요 |
| `POST /api/v1/auth/login` | `LoginRequest` | `200`, `TokenResponse` | 불필요 |
| `POST /api/v1/auth/refresh` | `RefreshRequest` | `200`, `TokenResponse` | 요청 본문의 refresh token |
| `GET /api/v1/auth/me` | 본문 없음 | `200`, `UserResponse` | Bearer 토큰 |
| `GET /api/v1/onboarding` | 본문 없음 | `200`, `OnboardingResponse` | Bearer 토큰; 본인 데이터 |
| `PUT /api/v1/onboarding` | `OnboardingWriteRequest` | `200`, `OnboardingResponse` | Bearer 토큰; 본인 데이터 |

#### `POST /api/v1/auth/signup`

- 요청
  - `SignUpRequest`:

    ```json
    {
      "email": "parent@example.com",
      "password": "example-password",
      "full_name": "보호자 이름"
    }
    ```

  - `email`: 유효한 이메일 주소. 중복 가입할 수 없다.
  - `password`: 8~128자. 응답에 포함하지 않는다.
  - `full_name`: 공백 제외 비어 있지 않은 문자열, 최대 100자.
- 응답
  - `UserResponse`: `{ id: Id, email: string, full_name: string, created_at: Timestamp }`. 계정만 생성하며 프로필과 동의 기록은 아직 만들지 않는다.

#### `POST /api/v1/auth/login`

- 요청
  - `LoginRequest`:

    ```json
    {
      "email": "parent@example.com",
      "password": "example-password"
    }
    ```

- 응답
  - `TokenResponse`: `{ access_token: string, refresh_token: string, token_type: "bearer" }`. 이후 인증이 필요한 API에는 access token을 Bearer 토큰으로 보낸다.

#### `POST /api/v1/auth/refresh`

- 요청
  - `RefreshRequest`: `{ refresh_token: string }`.
- 응답
  - 로그인 응답과 같은 `TokenResponse`. 만료되거나 올바르지 않은 refresh token은 `401 INVALID_REFRESH_TOKEN`을 반환한다.

#### `GET /api/v1/auth/me`

- 요청
  - 본문 없음.
- 응답
  - 회원가입 응답과 같은 `UserResponse`.

#### `GET /api/v1/onboarding`

- 요청
  - 본문 없음.
- 응답
  - `OnboardingResponse`: `{ profile: UserProfile | null, consents: UserConsent[] }`.
  - 온보딩을 완료하지 않았다면 `profile`은 `null`이다. `consents`는 동의 종류별 가장 최근 기록만 포함하며, 기록이 없으면 `[]`이다.

#### `PUT /api/v1/onboarding`

- 요청
  - `OnboardingWriteRequest`:

    ```json
    {
      "profile": {
        "child_name": "아이 이름",
        "age_group": "4-5",
        "safety": {
          "allergies": {
            "status": "specified",
            "items": [{ "code": "egg", "custom_name": null }]
          },
          "restrictions": { "status": "none", "items": [] }
        },
        "food_preferences": {
          "family_foods": [{ "code": "eggs", "custom_name": null }],
          "dietary_approaches": [],
          "difficult_textures": [],
          "smell_sensitivity": "sometimes",
          "difficult_tastes": [],
          "presentation_preferences": [],
          "preferred_temperature": "warm",
          "new_food_response": "plate"
        },
        "safe_foods": {
          "status": "listed",
          "items": [
            {
              "name": "감자",
              "preparation": "푹 삶기",
              "presentation_note": "작게 잘라 제공"
            }
          ]
        }
      },
      "consents": [
        { "kind": "account_privacy", "granted": true },
        { "kind": "photo_analysis", "granted": true },
        { "kind": "ai_training", "granted": false }
      ]
    }
    ```

  - `profile`: 공통 스키마의 `UserProfile`에서 서버가 채우는 `user_id`, `updated_at`을 제외한 값. 새 안심 음식은 `id`를 보내지 않고, 기존 안심 음식을 유지하거나 수정할 때는 서버가 발급한 `id`를 보낸다.
  - `consents`: 세 종류의 동의 선택을 각각 한 번씩 보낸다. `account_privacy`와 `photo_analysis`는 `true`여야 하며 `ai_training`은 선택값을 보낸다. `document_version`과 기록 시각은 서버가 채운다.
  - 서버는 Bearer 토큰의 사용자 ID로 프로필과 동의를 한 번에 저장한다. 기존 프로필이 있으면 요청 내용으로 교체한다. 각 동의의 최신 기록과 선택값·문서 버전이 같으면 기록을 다시 추가하지 않는다.
- 응답
  - `GET /api/v1/onboarding`과 같은 `OnboardingResponse`. `profile`에는 서버가 채운 `user_id`, `updated_at`, 안심 음식 ID가 포함된다.


## DB Tables

`Id`·`IngredientId`는 DB에서 `BIGINT`로 저장한다. JSON에서는 양의 10진수 문자열로 주고받는다. `FoodItemDetail`과 `MealDetail`의 배열은 아래 관계 테이블을 조회해 구성한다.

### `ingredients` — 모든 사용자가 공유하는 재료

| 필드 | DB 타입 | 제약 조건 |
|---|---|---|
| `id` | `BIGINT` | PK; 양수 |
| `name` | `TEXT` | `NOT NULL`; 공백 제외 비어 있지 않음; UNIQUE |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`; 서버 생성 |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`; 서버 생성·갱신 |

초기 목업 재료는 당근(`182`), 감자(`212`), 달걀(`213`), 쌀(`214`), 닭고기(`215`), 두부(`216`), 사과(`217`), 브로콜리(`218`)이다.

### `meals` — 식사

| 필드 | DB 타입 | 제약 조건 |
|---|---|---|
| `id` | `BIGINT` | PK; 양수 |
| `user_id` | `BIGINT` | `NOT NULL`; 양수; 식사 소유자 |
| `meal_date` | `DATE` | `NOT NULL` |
| `meal_type` | `TEXT` | `NOT NULL`; `breakfast`, `lunch`, `dinner`, `snack` 중 하나 |
| `setting` | `TEXT` | `NOT NULL`; `home`, `restaurant`, `school`, `others` 중 하나 |
| `before_photo_uri` | `TEXT` | `NULL` 허용 |
| `after_photo_uri` | `TEXT` | `NULL` 허용 |
| `saved_at` | `TIMESTAMPTZ` | `NOT NULL` |

식사 목록은 `user_id`로 조회한다. 음식과 Review 결과의 소유자는 `meal_id`가 가리키는 식사에서 확인한다.

### `meal_foods` — 식사에 기록한 음식

| 필드 | DB 타입 | 제약 조건 |
|---|---|---|
| `meal_id` | `BIGINT` | PK `(meal_id, id)`의 일부; `meals.id` 참조 |
| `id` | `BIGINT` | PK `(meal_id, id)`의 일부; 양수; 식사 안에서 고유 |
| `name` | `TEXT` | `NOT NULL`; 공백 제외 비어 있지 않음 |
| `cooking_method` | `TEXT` | `NULL` 허용; 값이 있으면 `CookingMethod`의 허용 코드 |
| `serving_note` | `TEXT` | `NULL` 허용 |
| `acceptance` | `SMALLINT` | `NULL` 허용; 값이 있으면 `0`~`3` |

음식의 소유자는 `meal_id`가 가리키는 식사에서 확인한다.

### `meal_food_ingredients` — 음식에 사용한 공통 재료

| 필드 | DB 타입 | 제약 조건 |
|---|---|---|
| `meal_id` | `BIGINT` | PK `(meal_id, food_id, ingredient_id)`의 일부 |
| `food_id` | `BIGINT` | PK의 일부; `(meal_id, food_id)`로 `meal_foods` 참조 |
| `ingredient_id` | `BIGINT` | PK의 일부; `ingredients.id` 참조 |

재료 이름은 `ingredients.name`에서 읽는다. 같은 재료는 한 음식에 한 번만 연결한다.

### `review_food_results` — 음식 평가

| 필드 | DB 타입 | 제약 조건 |
|---|---|---|
| `meal_id` | `BIGINT` | PK `(meal_id, food_id)`의 일부; `meals.id` 참조 |
| `food_id` | `BIGINT` | PK의 일부; Review 대상 음식 ID |
| `food_snapshot` | `JSONB` | `NOT NULL`; Review 저장 당시 `FoodSnapshot` |
| `outcome` | `TEXT` | `NULL` 허용; 값이 있으면 `Outcome`의 허용 코드 |
| `difficulties` | `JSONB` | `NOT NULL`; 기본값 `[]`; `Difficulty[]` 형태 |

Review 저장 시 해당 식사의 음식마다 한 행을 만든다. `food_id`는 저장 시 식사에 속한 음식이어야 하며, 이후 음식이 수정되어도 `food_snapshot`은 유지한다. 소유자는 `meal_id`가 가리키는 식사에서 확인한다.

### `review_ingredient_results` — 재료 평가

| 필드 | DB 타입 | 제약 조건 |
|---|---|---|
| `meal_id` | `BIGINT` | PK `(meal_id, food_id, ingredient_id)`의 일부 |
| `food_id` | `BIGINT` | PK의 일부; `(meal_id, food_id)`로 `review_food_results` 참조 |
| `ingredient_id` | `BIGINT` | PK의 일부; 부모 `food_snapshot.ingredients[].id`에 포함되어야 함 |
| `outcome` | `TEXT` | `NULL` 허용; 값이 있으면 `Outcome`의 허용 코드 |
| `difficulties` | `JSONB` | `NOT NULL`; 기본값 `[]`; `Difficulty[]` 형태 |

평가한 재료에만 행을 만든다. `ingredient_id`와 부모 스냅샷의 일치는 저장 시 검증한다.

### `suggestions` — 추천

| 필드 | DB 타입 | 제약 조건 |
|---|---|---|
| `id` | `BIGINT` | PK; 양수 |
| `user_id` | `BIGINT` | `NOT NULL`; 양수 |
| `meal_id` | `BIGINT` | `NOT NULL`; 추천의 원본 식사 ID |
| `food_id` | `BIGINT` | `NOT NULL`; 원본 음식 ID |
| `ingredient_id` | `BIGINT` | `NULL` 허용; 값이 있으면 `food_snapshot.ingredients[].id`에 포함; `NULL`은 음식 전체 |
| `food_snapshot` | `JSONB` | `NOT NULL`; 추천 생성 당시 `FoodSnapshot` |
| `what_to_try` | `TEXT` | `NOT NULL`; 공백 제외 비어 있지 않음 |
| `why_this_may_help` | `TEXT` | `NOT NULL`; 공백 제외 비어 있지 않음 |
| `serving_tip` | `TEXT` | `NULL` 허용 |
| `status` | `TEXT` | `NOT NULL`; `pending`, `saved`, `dismissed` 중 하나 |
| `dismiss_reasons` | `JSONB` | `NOT NULL`; 기본값 `[]`; 제외 이유 코드 배열 |
| `saved_at` | `TIMESTAMPTZ` | `NULL` 허용; `status = saved`일 때만 값이 있음 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`; 서버 생성 |

추천을 생성할 때 `user_id`는 원본 식사의 `user_id`와 일치해야 한다. 원본 음식·재료는 저장 시 Review 결과와 대조하고, 이후에는 `food_snapshot`을 유지한다. 원본 식사를 삭제해도 추천의 소유자는 `user_id`로 확인한다.

### `suggestion_meal_links` — 추천을 적용한 식사·음식·재료

| 필드 | DB 타입 | 제약 조건 |
|---|---|---|
| `id` | `BIGINT` | PK; 양수 |
| `suggestion_id` | `BIGINT` | `NOT NULL`; `suggestions.id` 참조 |
| `meal_id` | `BIGINT` | `NOT NULL`; 적용한 식사 ID |
| `food_id` | `BIGINT` | `NOT NULL`; `(meal_id, food_id)`로 `meal_foods` 참조 |
| `ingredient_id` | `BIGINT` | `NULL` 허용; 값이 있으면 해당 음식의 재료 ID; `NULL`은 음식 전체 |
| `feedback` | `TEXT` | `NULL` 허용; 값이 있으면 `helpful`, `not_helpful`, `not_sure` 중 하나 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`; 서버 생성 |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`; 서버 생성·갱신 |

`(suggestion_id, meal_id)`에 UNIQUE를 둔다. 연결할 때 `suggestions.user_id`와 적용 대상 `meals.user_id`가 같아야 한다. `ingredient_id`가 있으면 `(meal_id, food_id, ingredient_id)`가 `meal_food_ingredients`에 있어야 한다.

### `users` — 보호자 계정

| 필드 | DB 타입 | 제약 조건 |
|---|---|---|
| `id` | `BIGINT` | PK; 양수; 서버 생성 |
| `email` | `TEXT` | `NOT NULL`; 유효한 이메일; 대소문자를 구분하지 않고 UNIQUE |
| `hashed_password` | `TEXT` | `NOT NULL`; 비밀번호 해시 |
| `full_name` | `TEXT` | `NOT NULL`; 공백 제외 비어 있지 않음; 최대 100자 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`; 서버 생성 |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`; 서버 생성·갱신 |

`UserResponse`에는 `id`, `email`, `full_name`, `created_at`만 포함한다. 비밀번호는 해시로만 저장하고 응답에 포함하지 않는다.

### `user_profiles` — 사용자당 하나의 아이 프로필

| 필드 | DB 타입 | 제약 조건 |
|---|---|---|
| `user_id` | `BIGINT` | PK; `users.id` 참조 |
| `child_name` | `TEXT` | `NOT NULL`; 공백 제외 비어 있지 않음 |
| `age_group` | `TEXT` | `NOT NULL`; `UserProfile.age_group`의 허용 코드 |
| `allergy_status` | `TEXT` | `NOT NULL`; `unknown`, `none_known`, `specified` 중 하나 |
| `restriction_status` | `TEXT` | `NOT NULL`; `none`, `specified` 중 하나 |
| `smell_sensitivity` | `TEXT` | `NULL` 허용; 값이 있으면 `UserProfile.food_preferences.smell_sensitivity`의 허용 코드 |
| `preferred_temperature` | `TEXT` | `NULL` 허용; 값이 있으면 `UserProfile.food_preferences.preferred_temperature`의 허용 코드 |
| `new_food_response` | `TEXT` | `NULL` 허용; 값이 있으면 `UserProfile.food_preferences.new_food_response`의 허용 코드 |
| `safe_food_status` | `TEXT` | `NOT NULL`; `none`, `listed` 중 하나 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`; 서버 생성 |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`; 서버 생성·갱신 |

`UserProfile.safety`의 상태값과 `food_preferences`의 단일 선택값, `safe_foods.status`를 이 테이블에서 읽는다. 나머지 선택 항목과 안심 음식은 아래 테이블에서 읽는다.

### `user_profile_choices` — 프로필의 복수 선택 항목

| 필드 | DB 타입 | 제약 조건 |
|---|---|---|
| `user_id` | `BIGINT` | PK `(user_id, category, position)`의 일부; `user_profiles.user_id` 참조 |
| `category` | `TEXT` | PK의 일부; `allergy`, `restriction`, `family_food`, `dietary_approach`, `difficult_texture`, `difficult_taste`, `presentation_preference` 중 하나 |
| `position` | `INTEGER` | PK의 일부; 0 이상; 배열에서의 순서 |
| `code` | `TEXT` | `NULL` 허용; 선택지 코드 |
| `custom_name` | `TEXT` | `NULL` 허용; 공백 제외 비어 있지 않은 직접 입력값 |

`code`와 `custom_name` 중 정확히 하나만 값을 갖는다. 같은 사용자·분류에서 같은 선택 항목은 중복 저장하지 않는다. `category`별 행을 `position` 순서로 모아 `UserProfile`의 `ProfileChoice[]` 필드를 구성한다. `allergy_status`와 `restriction_status`가 `specified`이면 해당 분류의 행이 1개 이상이어야 하며, 다른 상태이면 0개여야 한다. `family_food`는 1개 이상이어야 한다.

### `safe_foods` — 안심 음식

| 필드 | DB 타입 | 제약 조건 |
|---|---|---|
| `id` | `BIGINT` | PK; 양수; 서버 생성 |
| `user_id` | `BIGINT` | `NOT NULL`; `user_profiles.user_id` 참조 |
| `position` | `INTEGER` | `NOT NULL`; 0 이상; `(user_id, position)` UNIQUE |
| `name` | `TEXT` | `NOT NULL`; 공백 제외 비어 있지 않음 |
| `preparation` | `TEXT` | `NOT NULL`; 공백 제외 비어 있지 않음 |
| `presentation_note` | `TEXT` | `NULL` 허용 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`; 서버 생성 |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`; 서버 생성·갱신 |

`safe_food_status = listed`이면 해당 사용자의 안심 음식이 1개 이상이고, `none`이면 0개이다. `UserProfile.safe_foods.items`는 `position` 순서로 구성한다.

### `user_consents` — 사용자 동의 이력

| 필드 | DB 타입 | 제약 조건 |
|---|---|---|
| `id` | `BIGINT` | PK; 양수; 서버 생성 |
| `user_id` | `BIGINT` | `NOT NULL`; `users.id` 참조 |
| `kind` | `TEXT` | `NOT NULL`; `account_privacy`, `photo_analysis`, `ai_training` 중 하나 |
| `granted` | `BOOLEAN` | `NOT NULL` |
| `document_version` | `TEXT` | `NOT NULL`; 공백 제외 비어 있지 않음 |
| `recorded_at` | `TIMESTAMPTZ` | `NOT NULL`; 서버 생성 |

동의 변경 기록은 이전 행을 수정하지 않고 추가한다. `(user_id, kind)`별 최신 기록은 `recorded_at` 내림차순, 시간이 같으면 `id` 내림차순으로 결정한다. 최신 기록의 `granted`와 `document_version`이 제출값과 같으면 새 행을 추가하지 않는다.

