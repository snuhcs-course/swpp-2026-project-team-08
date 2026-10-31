<!-- AI-generated with Claude Sonnet 5.5, 2026-10-30, reviewed by Jaemin Kim -->
<!-- Changed: DB 스키마 전면 개편 계획서 -->

# DB 스키마 전면 개편 계획

> 이 문서는 여러 대화(세션)에 걸쳐 진행되는 개편 작업의 단일 기준이다.
> 새 세션은 이 문서를 먼저 읽고, 3절의 진행 상태에서 이어간다.

## 1. 원칙

### 1.1 역할 분담과 범위

- 스키마(ORM 모델 + Alembic 마이그레이션)를 먼저 확정하고 구현한다.
- 이 문서의 작업 범위는 **ORM 모델과 마이그레이션까지**다.
- 서비스, 라우터, 테스트 등 모델을 사용하는 코드의 수정은 각 담당자가 확정된 스키마에 맞춰 진행한다.
- 스키마 작업 중 앱 코드는 깨진 상태가 되므로, 장기 통합 브랜치 `refactor/db-migration-1030`에서 작업한다.
  스키마 PR과 팀원의 코드 수정 PR은 모두 이 브랜치로 머지하고, 전체가 끝나 테스트·린트가 통과하면
  이 브랜치를 `main`에 머지한다 ([GIT_WORKFLOW.md](../GIT_WORKFLOW.md)).

### 1.2 진행 방식

- 계획(2절)을 모두 확정한 뒤에 실행한다. 실행 중 설계 판단이 필요하면 멈추고 4절(결정 기록)에 먼저 기록한다.
- 마이그레이션은 **테이블 묶음 단위**로 나눈다. PK/FK로 연결된 테이블은 같은 마이그레이션에 넣는다.
- 묶음은 FK 의존 순서(부모 → 자식)로 진행한다.
- 모든 묶음을 끝낸 뒤 팀원에게 한꺼번에 넘긴다.

### 1.3 테이블 규칙

- 모든 테이블에 `created_at`, `updated_at`을 둔다 (`DateTime(timezone=True)`, `default=now_kst`, `updated_at`은 `onupdate=now_kst`).
- 모든 `ForeignKey`는 `onupdate="CASCADE", ondelete="CASCADE"`를 지정한다.
- 정수 PK는 기존 방식을 따른다: `BigInteger().with_variant(Integer, "sqlite")` + `Identity()`.
- ORM 코드의 주석과 docstring은 한국어로 쓴다.

### 1.4 마이그레이션 규칙

- 파일명은 `YYYYMMDD_HHMM_<이름>.py`, revision id는 `00NN_<이름>`이며, 최신 revision 뒤에 이어 붙인다
  (현재 최신: `0017_meal_ingredients`, 다음은 `0018`).
- 컬럼을 삭제하거나 구조를 바꾸는 경우, 기존 데이터를 새 구조로 이관한 뒤 삭제한다.
  이관할 수 없는 데이터는 폐기하며, 그 사실을 해당 묶음의 "이관 규칙"에 적는다.
- `downgrade()`를 반드시 작성한다. 폐기한 데이터는 복구되지 않는다는 점을 명시한다.
- SQLite 호환을 위해 컬럼 변경은 batch 모드를 사용한다.
- 묶음마다 다음 세 가지만 검증한다: `upgrade`, `downgrade`, 빈 DB에서 `upgrade head`.
- `alembic upgrade`/`downgrade`는 DB를 바꾸므로 실행 전에 매번 사용자에게 확인받는다
  ([server/AGENTS.md](../server/AGENTS.md)). 마이그레이션 파일 생성과 `upgrade head --sql` 출력은 확인 없이 할 수 있다.

### 1.5 인수인계 규칙

- 묶음마다 "깨지는 지점"을 기록한다: 삭제/이름 변경/타입 변경된 컬럼·테이블·관계, 새로 생긴 모델,
  그리고 이를 사용하던 파일과 함수. 팀원이 코드를 고칠 때의 체크리스트로 쓴다.
- `swpp-2026-project-team-08.wiki/Design-Documentation.md`의 스키마 표는 모든 묶음이 끝난 뒤 한 번에 갱신한다.
- 이 문서는 작업용 계획서이므로 개편이 끝나면 삭제한다 ([AGENTS.md](../AGENTS.md)).
  삭제 전에 계속 필요한 결정과 규칙은 `server/docs/architecture.md` 등 정식 문서로 옮긴다.

## 2. 묶음별 계획

묶음 번호는 진행 순서(FK 의존 순서)다. 아래 묶음 외의 테이블은 변경 내용이 확정되면 추가한다.

### 2.1 User: 이메일 변경 시도 분리

**대상 테이블:** `users`(컬럼 삭제), `user_email_change_attempts`(신규)

**마이그레이션:** 파일 `20261030_1000_user_email_change_attempts.py`,
revision `0018_user_email_change_attempts`, down_revision `0017_meal_ingredients`

#### 목표 스키마

`users`: `pending_email`, `email_change_code_hash`, `email_change_expires_at` 삭제. 나머지 컬럼은 그대로다.

`user_email_change_attempts` (모델 `UserEmailChangeAttempt`, 파일 `app/models/user_email_change_attempt.py`)

| 컬럼 | 타입 | 제약 |
|---|---|---|
| `user_id` | BigInteger (sqlite는 Integer) | PK, FK → `users.id` (`onupdate="CASCADE", ondelete="CASCADE"`) |
| `new_email` | String(255) | NOT NULL |
| `code_hash` | String(255) | NOT NULL |
| `expires_at` | DateTime(timezone=True) | NOT NULL |
| `created_at` | DateTime(timezone=True) | NOT NULL, `default=now_kst` |
| `updated_at` | DateTime(timezone=True) | NOT NULL, `default=now_kst`, `onupdate=now_kst` |

- 사용자당 진행 중인 시도는 하나다. `user_id`가 PK이므로 새 요청은 기존 행을 덮어쓰고(upsert), 확인에 성공하면 행을 삭제한다.
- `user_id`는 자동 증가하지 않으므로 `Identity()`를 쓰지 않는다.
- `new_email`은 유니크가 아니다. 여러 사용자가 같은 주소로 변경을 요청할 수 있고, 중복은 확인 시점에 `users.email`로 검사한다.
- 새 모델은 `app/models/__init__.py`에 등록한다.

#### 컬럼 매핑

| 기존 (`users`) | 신규 (`user_email_change_attempts`) |
|---|---|
| `pending_email` | `new_email` |
| `email_change_code_hash` | `code_hash` |
| `email_change_expires_at` | `expires_at` |
| `id` | `user_id` |

#### 이관 규칙

- upgrade: 세 컬럼이 모두 NOT NULL이고 `expires_at`이 마이그레이션 실행 시각보다 뒤인 행만 새 테이블로 옮긴다.
  `code_hash`는 해시 그대로 복사한다. `created_at`, `updated_at`은 실행 시각으로 채운다. 그 외(만료됐거나 일부만 채워진 행)는 폐기한다.
  이관 뒤 `users`의 세 컬럼을 삭제한다.
- downgrade: 세 컬럼을 nullable로 다시 만들고, 만료되지 않은 시도를 되돌려 복사한 뒤 새 테이블을 삭제한다. 만료된 시도는 복구되지 않는다.

#### 깨지는 지점

- `User.pending_email`, `User.email_change_code_hash`, `User.email_change_expires_at` 삭제
  - `app/features/auth/service.py`의 `request_email_change`, `confirm_email_change`: `UserEmailChangeAttempt`의 upsert, 조회, 삭제로 바꾼다. 요청/확인의 동작과 에러는 그대로다.
- `app/features/auth/queries.py`의 `delete_user_owned_rows`: 계정 삭제 시 테이블을 직접 열거해 지우므로 `UserEmailChangeAttempt` 삭제를 추가한다.
- `tests/unit/test_remove_exposure_migration.py`: head를 `0017_meal_ingredients`로 고정하는 단언을 새 head로 바꾼다. 이후 묶음마다 같은 단언을 갱신한다.
- 영향 없음: `auth/router.py`의 DTO와 엔드포인트(응답 모양 불변), `tests/integration/test_auth.py`의 이메일 변경 테스트(동작 불변이라 그대로 통과해야 한다).
- 과거 마이그레이션(`20261018_2100_user_email_change.py`, `20261021_1000_bigint_user_ids.py`)은 수정하지 않는다.

### 2.2 Meal, MealFood: StrEnum 전환과 모델 이름 변경

**대상 테이블:** `meals`, `meal_foods`

**마이그레이션:** 파일 `20261030_1100_meal_enums.py`, revision `0019_meal_enums`, down_revision `0018_user_email_change_attempts`

#### 목표 스키마

- 새 파일 `app/models/meal_enums.py`에 `MealType`, `MealSetting`, `MealCookingMethod`(StrEnum)을 정의한다.
  `MealCookingMethod`는 기존 `FoodPreparation`(`app/models/food_enums.py`)의 이름을 바꾼 것이며 `food_enums.py`는 삭제한다.
  값은 현재 허용 값을 그대로 쓰고, 멤버 이름만 대문자다.

  | enum | 멤버 = 값 |
  |---|---|
  | `MealType` | `BREAKFAST="breakfast"`, `LUNCH="lunch"`, `DINNER="dinner"`, `SNACK="snack"` |
  | `MealSetting` | `HOME="home"`, `RESTAURANT="restaurant"`, `SCHOOL="school"`, `OTHERS="others"` |
  | `MealCookingMethod` | `RAW_UNHEATED="raw"`, `BOILED="boiled"`, `STEAMED="steamed"`, `PAN_FRIED="pan_fried"`, `STIR_FRIED="stir_fried"`, `BAKED_ROASTED="baked_roasted"`, `MASHED_BLENDED="mashed_blended"`, `OTHER="other"` |

- `meals.meal_type`, `meals.setting`: 네이티브 enum 없이 `VARCHAR(20) NOT NULL`로 저장한다. ORM 매핑은
  [architecture.md §2.2](../server/docs/architecture.md)의 `Enum(..., native_enum=False, create_constraint=False)` 규칙을 따른다.
- `meal_foods.cooking_method`: 같은 규칙으로 `VARCHAR(30) NULL`에 `MealCookingMethod`를 저장한다.
- `CheckConstraint` `ck_meals_meal_type`, `ck_meals_setting`, `ck_meal_foods_cooking_method` 삭제. 허용 값은 enum이 검증한다.
- 모델 파일 `app/models/food_item.py`를 `app/models/meal_food.py`로 옮기고 클래스 `FoodItem`을 `MealFood`로 바꾼다.
  테이블 이름(`meal_foods`)은 그대로다.
- `Meal.id`는 이미 `Identity()` 자동 증가이므로 바꾸지 않는다.
- 값 규칙인 `ck_meals_id_positive`도 삭제한다 (4절). `meal_foods`의 나머지 `CHECK`는 2.3에서 테이블을 재생성하며 사라진다.

#### 이관 규칙

- 컬럼 타입(`VARCHAR(20)`, `VARCHAR(30)`)과 저장 값이 그대로이므로 데이터 이관은 없다.
- upgrade: `ck_meals_meal_type`, `ck_meals_setting`, `ck_meals_id_positive`, `ck_meal_foods_cooking_method`를 삭제한다.
  downgrade: 네 `CHECK` 제약을 다시 만든다. 허용 값 밖의 행이 있으면 downgrade가 실패한다.
- 모델 파일 이동, 클래스 이름 변경, enum 이름 변경은 DB에 영향이 없다.

#### 깨지는 지점

- `Meal.meal_type`, `Meal.setting`의 파이썬 타입이 `str`에서 `MealType`, `MealSetting`으로 바뀐다.
  - `app/features/meals/dto.py`: `Literal`로 정의한 `MealType`, `MealSetting`을 `app/models/meal_enums.py`의 enum으로 교체한다. JSON 값은 그대로다.
  - `app/features/meals/data.py`: `meal_type: str`, `setting: str` 필드 타입.
  - `app/features/meals/service.py`(272~273행), `present.py`(24~25행): enum 값을 주고받는 부분.
- `FoodPreparation`이 `MealCookingMethod`로 바뀌고 `app/models/food_enums.py`가 사라진다.
  `app/features/meals/dto.py`의 import(8행)와 타입(35, 123, 152행)을 `app/models/meal_enums.py`의 `MealCookingMethod`로 교체한다.
- `MealFood.cooking_method`의 파이썬 타입이 `str | None`에서 `MealCookingMethod | None`으로 바뀐다.
- `app/models/food_item.py` 경로가 사라지고 클래스 `FoodItem`이 `MealFood`로 바뀐다.
  - 경로를 직접 import하는 곳: `app/models/__init__.py`(16행), `app/models/meal.py`(23행, `TYPE_CHECKING` import).
    `meal.py`의 `foods` 관계 타입 문자열(`"FoodItem"`)도 바꾼다.
  - 클래스명을 쓰는 곳: `app/features/meals/queries.py`, `app/features/meals/service.py`, `app/features/auth/queries.py`
    (`delete_user_owned_rows`).
  - `tests/`에서는 `FoodItem`을 쓰지 않는다.
- API JSON 값은 그대로이므로 클라이언트 수정은 없다.
- 잘못된 `meal_type`, `setting`, `cooking_method` 요청이 422로 거절되는 기존 검증은 그대로 통과해야 한다.

### 2.3 MealFood, MealFoodIngredient: 식사 기록 재료 구조 재편

**대상 테이블:** `meal_foods`, `meal_food_ingredients`(재생성),
`suggestion_meal_links`, `meal_ingredients`, `review_food_results`, `review_ingredient_results`(삭제), `meals`, `suggestions`(행 삭제)

**마이그레이션:** 파일 `20261030_1200_meal_food_restructure.py`,
revision `0020_meal_food_restructure`, down_revision `0019_meal_enums`

#### 재료 두 계열의 경계

재료를 다루는 테이블은 목적이 완전히 다른 두 계열이며 서로 참조하지 않는다.

- **`Ingredient`(`ingredients`): 추천용 공용 카탈로그.** 음식 추천 때 식이 제한을 지킨 재료 화이트리스트를 LLM에게
  주기 위해 존재한다. 식사 기록과 관계가 없고, 식사 저장·수정은 이 테이블을 읽거나 쓰지 않는다.
- **`MealFoodIngredient`(`meal_food_ingredients`): 사용자 입력 기록.** 사용자가 식사(`Meal`) 안의 음식(`MealFood`)에
  들어갔다고 기록한 재료를 입력한 그대로 저장한다. 카탈로그를 참조하지 않으며, 같은 이름도 음식마다 별도 행이다.
  이름 기준 중복 제거나 유니크 제약이 없다.
- 두 계열 사이에는 FK도 이름 매칭도 없다.
- `server/docs/architecture.md`의 "재료 저장 경계" 절은 현재 `MealIngredient`를 설명한다. 이 묶음을 구현할 때 위 구조로 고친다.

#### 목표 스키마

공통: 모든 `id`는 `BigInteger().with_variant(Integer, "sqlite")` + `Identity()`로 **서버가 자동 증가시키며**, 클라이언트는 id를 보내지 않고
서버가 응답으로 돌려준다. 모든 FK는 `onupdate="CASCADE", ondelete="CASCADE"`다. 재생성하는 테이블에는 `CheckConstraint`를 두지 않는다
(값 규칙은 애플리케이션이 검증한다. [architecture.md §2.2](../server/docs/architecture.md)).

새 enum `EatingOutcome`을 `app/models/meal_enums.py`에 정의한다. 값은 현행을 유지한다.

| enum | 멤버 = 값 |
|---|---|
| `EatingOutcome` | `EATEN="eaten"`, `TASTED="tasted"`, `UNTOUCHED="untouched"`, `UNCLEAR="unclear"` |

새 enum `DifficultyReason`을 `app/models/difficulty_enums.py`에 정의한다. 음식이나 재료를 먹기 어려웠던 이유이며, 값의 기준은 PRD의
"Reason Category and Mapped Values"다.

- 평탄한 `StrEnum` 하나이고, 값은 category를 점(`.`)으로 구분한 경로 문자열이다. `TEXTURE`는 하위 category가 하나 더 있다.
  - 형식: `<CATEGORY>.<VALUE>`, `TEXTURE.<SUBCATEGORY>.<VALUE>`, `NOT_SURE`(값 없는 category)
  - 멤버 이름은 점 대신 `_`를 쓴다. 예: `TEXTURE_HARDNESS_HARD = "TEXTURE.HARDNESS.HARD"`, `COLOR_OTHER = "COLOR.OTHER"`
- category와 하위 category는 값을 `.`으로 나눠 얻는다. 별도 매핑 표를 두지 않는다.
- `meal_foods`와 `meal_food_ingredients`의 `difficulty_reasons`는 이 값의 JSON 목록이다. 입력 순서를 유지하고 중복은 불가다.
  DB 제약 없이 DTO가 `list[DifficultyReason]`으로 검증한다.
- `outcome`처럼 값이 서버와 클라이언트에서 같아야 하므로 값 목록을 바꾸면 양쪽을 같은 변경에서 고친다.

| category | 값 (총 77개) |
|---|---|
| `SMELL` (13) | `FRUIT` `HERB` `MUSHROOM` `TOASTED` `VANILLA` `DAIRY` `MEATY` `SULFUR` `SEA` `FERMENTED` `SPICE` `MINT` `SMOKE` |
| `TASTE` (5) | `SWEET` `SALTY` `SOUR` `BITTER` `SAVORY` |
| `ARRANGEMENT` (4) | `EVEN` `UNEVEN` `CLUSTERED` `OTHER` |
| `PIECE_SIZE` (3) | `FINE` `SMALL` `LARGE` |
| `TEMPERATURE` (4) | `HOT` `WARM` `COOL` `ROOM` |
| `COLOR` (6) | `RED` `YELLOW` `GREEN` `BROWN` `WHITE` `OTHER` |
| `NOT_SURE` (1) | 값 없이 `NOT_SURE` 하나 |
| `TEXTURE` (41) | 아래 표 |

`TEXTURE`의 하위 category와 값 (PRD의 Texture 표):

| 하위 category | 값 |
|---|---|
| `HARDNESS` | `SOFT` `FIRM` `HARD` |
| `BREAKING` | `CRUMBLY` `CRUNCHY` `BRITTLE` |
| `CHEWING` | `TENDER` `CHEWY` `TOUGH` |
| `STICKINESS` | `NON_STICKY` `STICKY` `GUMMY` |
| `SPRINGINESS` | `SPRINGY` `RUBBERY` |
| `THICKNESS` | `FLUID` `THIN` `THICK` `VISCOUS` |
| `MOISTURE` | `DRY` `MOIST` `JUICY` `WET` |
| `OILINESS` | `NON_FATTY` `OILY` `GREASY` |
| `GRAININESS` | `GRAINY` `GRITTY` `SANDY` `MEALY` `POWDERY` |
| `DENSITY` | `DENSE` `AIRY` |
| `SURFACE` | `SMOOTH` `ROUGH` `BUMPY` `CRUSTY` `FUZZY` |
| `STRUCTURE` | `FIBROUS` `FLESHY` `LAYERED` `SPONGY` |

- 값 이름(`VANILLA`, `SULFUR` 등)은 PRD에 영문 라벨이 없는 항목이 있어 기존 클라이언트의 값 이름(`vanilla`, `sulfur`)을 대문자로 옮긴 것이다.

`meal_foods` (모델 `MealFood`, `app/models/meal_food.py`)

| 컬럼 | 타입 | 제약 |
|---|---|---|
| `id` | BigInteger | PK, `Identity()` |
| `meal_id` | BigInteger | NOT NULL, FK → `meals.id`, index |
| `name` | String | NOT NULL |
| `cooking_method` | VARCHAR(30) | NULL, `MealCookingMethod` (2.2) |
| `serving_note` | Text | NULL |
| `acceptance` | SmallInteger | NULL (변경 없음) |
| `outcome` | VARCHAR(20) | NULL, `EatingOutcome`. NULL이면 미리뷰 |
| `difficulty_reasons` | JSON (Postgres는 JSONB) | NOT NULL, 기본값 `[]` (`server_default '[]'`) |
| `created_at`, `updated_at` | DateTime(timezone=True) | NOT NULL |

`meal_food_ingredients` (모델 `MealFoodIngredient`, `app/models/meal_food_ingredient.py`)

| 컬럼 | 타입 | 제약 |
|---|---|---|
| `id` | BigInteger | PK, `Identity()` |
| `meal_food_id` | BigInteger | NOT NULL, FK → `meal_foods.id`, index |
| `name` | String | NOT NULL. 사용자가 입력한 이름 |
| `outcome` | VARCHAR(20) | NULL, `EatingOutcome`. NULL이면 미리뷰 |
| `difficulty_reasons` | JSON (Postgres는 JSONB) | NOT NULL, 기본값 `[]` |
| `created_at`, `updated_at` | DateTime(timezone=True) | NOT NULL |

- `suggestion_meal_links`는 이 묶음에서 삭제만 한다. 같은 역할의 새 테이블 `food_recommendation_tries`는 2.7에서 만든다.
- 삭제하는 모델: `MealIngredient`(`meal_ingredient.py`), `ReviewFoodResult`(`review_food_result.py`),
  `ReviewIngredientResult`(`review_ingredient_result.py`).
- 사라지는 컬럼: `food_snapshot`(음식 정보는 `meal_foods` 자체가 갖는다), `normalized_name`, 복합 PK를 이루던 `food_id`·`ingredient_id`.
- `difficulties`는 `difficulty_reasons`로 이름을 바꿔 두 테이블에 둔다.

#### 이관 규칙

- **기존 데이터는 이관하지 않고 버린다.** 구조가 크게 달라 옛 id를 새 id로 옮기지 않는다.
- upgrade 순서: `suggestion_meal_links`, `review_ingredient_results`, `review_food_results`, `meal_food_ingredients`,
  `meal_ingredients`, `meal_foods`를 삭제하기 전에 `suggestions`와 `meals`의 행을 삭제한다. 그 뒤 `meal_foods`,
  `meal_food_ingredients`를 새 구조로 만든다.
- 삭제되는 데이터: 모든 식사, 음식, 재료, 식후 리뷰, 추천, 추천 연결. `users`, 프로필, 동의, `ingredients`는 유지한다.
- downgrade: 옛 구조의 테이블을 빈 상태로 다시 만든다. 삭제된 데이터는 복구되지 않는다.
- 운영 DB에 적용하기 전에 삭제 범위를 팀이 확인한다.

#### 깨지는 지점

- 삭제되는 모델 `ReviewFoodResult`, `ReviewIngredientResult`, `MealIngredient`와 구조가 바뀌는 `MealFood`(복합 PK `(meal_id, id)` →
  단일 PK `id`), `MealFoodIngredient`(복합 PK → 단일 PK `id`와 `meal_food_id`, `name`, `outcome`, `difficulty_reasons`),
  `SuggestionMealLink`(삭제되고 2.7의 `FoodRecommendationTry`로 대체)를 쓰는 서버 코드:
  - `app/models/__init__.py`, `app/features/auth/queries.py`(`delete_user_owned_rows`의 삭제 목록)
  - `app/features/meals/`의 `data.py`, `dto.py`, `ingredients.py`, `present.py`, `queries.py`, `router.py`, `service.py`
- **API가 바뀐다.**
  - 음식과 재료의 id는 서버가 발급하고 응답으로 돌려준다. 요청의 `FoodWriteRequest.id`, `IngredientInput.id`를 없애고,
    식사를 수정할 때 기존 음식·재료를 식별하는 방법은 meals 담당이 정한다.
  - 식후 리뷰의 `food_results`·`ingredient_results` 구조는 `MealFood`·`MealFoodIngredient`의 `outcome`, `difficulty_reasons`로 대체된다.
    `food_snapshot` 응답 필드는 사라진다. 요청·응답의 `difficulties` 필드 이름은 이 문서에서 정하지 않는다.
  - 난이도 사유의 형식이 `{category, subcategory, value}` 객체 목록에서 `DifficultyReason` 문자열 목록으로 바뀐다.
    서버의 `Difficulty` DTO(`meals/dto.py`)는 삭제하고 `list[DifficultyReason]`으로 대체한다. 클라이언트의 `Difficulty` 타입,
    `difficultyOptions`, `textureQuestions`와 `reviewDto.ts`의 변환도 새 값에 맞춘다.
  - 클라이언트에서 `difficulties`, `food_snapshot`, `food_id`, `ingredient_id`를 쓰는 파일: `client/src/data/api/mealLogApi.ts`,
    `mealReviewApi.ts`, `data/dto/mealDto.ts`, `reviewDto.ts`, `suggestionDto.ts`, `data/storage/afterMealReviewStorage.ts`,
    `features/after-meal-review/`, `features/meal-log/rules.ts`, `rules/recommendationSafety.ts`, `types/afterMealReview.ts`,
    `types/reviewRecord.ts`, `util/strings.ts`.
- `suggestions` 테이블의 행은 삭제되고, 테이블 자체는 2.7에서 `food_recommendations`로 대체된다.
- 테스트: `tests/integration/test_api_contract_edges.py`, `test_auth.py`, `test_contract_api.py`, `test_meals_write.py`,
  `test_meal_ingredient_migration.py`(구조가 사라지므로 삭제 또는 재작성), `tests/unit/test_remove_exposure_migration.py`(head 단언).
- 문서: `server/docs/architecture.md`의 "재료 저장 경계" 절.

### 2.4 UserConsent: `kind`를 StrEnum으로

**대상 테이블:** `user_consents`

**마이그레이션:** 파일 `20261030_1300_consent_kind_enum.py`, revision `0021_consent_kind_enum`,
down_revision `0020_meal_food_restructure`

#### 목표 스키마

- 새 파일 `app/models/user_consent_enums.py`에 `UserConsentKind`(StrEnum)를 정의한다. 값은 현행을 유지하고 멤버 이름만 대문자다.

  | enum | 멤버 = 값 |
  |---|---|
  | `UserConsentKind` | `ACCOUNT_PRIVACY="account_privacy"`, `PHOTO_ANALYSIS="photo_analysis"`, `AI_TRAINING="ai_training"` |

- `user_consents.kind`: 길이 없는 `String`에서 `VARCHAR(30) NOT NULL`로 바꾸고, 네이티브 enum 없이 `UserConsentKind`를 저장한다.
  ORM 매핑은 [architecture.md §2.2](../server/docs/architecture.md)의 규칙을 따른다.
- `CheckConstraint` `ck_user_consents_kind` 삭제. 허용 값은 enum이 검증한다.
- 인덱스 `ix_user_consents_user_kind`(`user_id`, `kind`)는 유지한다. 값 규칙인 `ck_user_consents_version`도 삭제한다 (4절).

#### 이관 규칙

- 저장 값이 그대로이므로 데이터 이관은 없다.
- upgrade: `ck_user_consents_kind`, `ck_user_consents_version`을 삭제하고 `kind`의 타입을 `VARCHAR(30)`으로 바꾼다.
- downgrade: `kind`의 타입을 길이 없는 `VARCHAR`로 되돌리고 두 `CHECK` 제약을 다시 만든다. 허용 값 밖의 행이 있으면 실패한다.

#### 깨지는 지점

- `UserConsent.kind`의 파이썬 타입이 `str`에서 `UserConsentKind`로 바뀐다.
  - `app/features/onboarding/dto.py`: `Literal`로 정의한 `ConsentKind`(9행)를 `app/models/user_consent_enums.py`의 `UserConsentKind`로 교체하고,
    133행·173행의 필드 타입과 145~150행의 문자열 비교를 enum에 맞춘다. JSON 값은 그대로다.
  - `app/features/onboarding/service.py`: 96~98행(`latest: dict[str, UserConsent]`), 151~161행의 `kind` 사용부.
- API JSON 값은 그대로이므로 클라이언트 수정은 없다.
- 잘못된 `kind` 요청이 422로 거절되는 기존 검증은 그대로 통과해야 한다.

### 2.5 UserProfile: 제한 목록 컬럼화와 안전 음식 이름 변경

**대상 테이블:** `user_profiles`(컬럼 변경, 행 삭제), `user_profile_safe_foods`(신규),
`user_profile_choices`, `safe_foods`(삭제)

**마이그레이션:** 파일 `20261030_1400_user_profile_restrictions.py`,
revision `0022_user_profile_restrictions`, down_revision `0021_consent_kind_enum`

#### 목표 스키마

새 파일 `app/models/user_profile_enums.py`에 선택지 enum 세 개를 정의한다. 새로 만드는 값이므로 멤버 이름과 값이 같은 대문자 문자열이다.

| enum | 멤버 = 값 |
|---|---|
| `AllergyRestriction` | `NONE` `PEANUTS` `TREE_NUTS` `MILK_DAIRY` `EGGS` `SOY` `WHEAT` `FISH` `SHELLFISH` `SESAME` |
| `VegetarianRestriction` | `DAIRY` `EGGS` `SEAFOOD` `POULTRY` `RED_MEAT` `LEGUMES_SOY` `NUTS_SEEDS` |
| `DietaryApproach` | `GLUTEN_FREE` `CASEIN_FREE` `LACTOSE_FREE` |

`user_profiles` (모델 `UserProfile`)

| 컬럼 | 타입 | 제약 |
|---|---|---|
| `user_id` | BigInteger | PK, FK → `users.id` (변경 없음) |
| `child_name` | String | NOT NULL (변경 없음) |
| `age_group` | String | NOT NULL (변경 없음) |
| `allergy_restrictions` | JSON (Postgres는 JSONB) | NOT NULL, 기본값 없음 |
| `vegetarian_restrictions` | JSON (Postgres는 JSONB) | NOT NULL, 기본값 `[]` |
| `dietary_approaches` | JSON (Postgres는 JSONB) | NOT NULL, 기본값 `[]` |
| `created_at`, `updated_at` | DateTime(timezone=True) | NOT NULL (변경 없음) |

- 세 컬럼은 문자열 목록이며 입력 순서를 유지한다. 컬럼 타입은 enum이 아니므로 DTO와 서비스가 원소를 검증한다.
  - `allergy_restrictions`: `AllergyRestriction` 값만, 1개 이상. `NONE`은 다른 값과 함께 쓸 수 없다. 중복 불가.
    알러지를 모르는 상태는 없으며 입력은 필수다. 온보딩 임시저장은 클라이언트에만 있고 서버에는 완성된 프로필만 저장하므로
    이 컬럼은 NULL을 허용하지 않는다.
  - `vegetarian_restrictions`: `VegetarianRestriction` 값만, 중복 불가. 빈 목록은 해당 없음이다.
  - `dietary_approaches`: `DietaryApproach` 값만, 중복 불가. 빈 목록은 해당 없음이다.
- 삭제하는 컬럼: `allergy_status`, `restriction_status`, `safe_food_status`.
- 삭제하는 `CheckConstraint`: `ck_user_profiles_age_group`, `ck_user_profiles_child_name`과 삭제한 컬럼의 제약 전부.
- **인덱스는 두지 않는다.** 프로필은 항상 PK(`user_id`)로 조회하고 목록 컬럼으로 사용자 간 검색을 하지 않는다.
  사용자 간 검색이 필요해지면 그때 JSONB GIN 인덱스를 추가한다.

`user_profile_safe_foods` (모델 `UserProfileSafeFood`, 파일 `app/models/user_profile_safe_food.py`)

| 컬럼 | 타입 | 제약 |
|---|---|---|
| `id` | BigInteger | PK, `Identity()` |
| `user_id` | BigInteger | NOT NULL, FK → `user_profiles.user_id`, index |
| `name` | String | NOT NULL |
| `preparation` | String | NOT NULL |
| `presentation_note` | String | NULL |
| `created_at`, `updated_at` | DateTime(timezone=True) | NOT NULL |

- 순서는 저장하지 않는다. 목록은 `id` 순서로 읽는다. `user_id` 조회를 위해 FK 컬럼에 인덱스를 둔다.
- 기존 `safe_foods`의 `position` 컬럼과 UNIQUE(`user_id`, `position`), `CheckConstraint`(`position >= 0`, 빈 문자열 금지)는 만들지 않는다.
  값 규칙은 앱이 검증한다.
- 삭제하는 모델: `SafeFood`(`safe_food.py`), `UserProfileChoice`(`user_profile_choice.py`).

#### 이관 규칙

- **기존 데이터는 이관하지 않고 버린다.**
- upgrade 순서: `user_profile_choices`와 `safe_foods`를 삭제하고, `user_profiles`의 모든 행을 삭제한 뒤, 컬럼을 바꾸고
  (상태 컬럼 3개와 `CHECK` 삭제, 목록 컬럼 3개 추가), `user_profile_safe_foods`를 만든다.
- 삭제되는 데이터: 모든 아이 프로필(선택한 알러지·제한·선호 음식 포함)과 안전 음식. `users`, `user_consents`, 식사·추천 기록은 유지한다.
  프로필이 사라지므로 모든 사용자가 프로필을 다시 입력해야 한다.
- downgrade: 옛 구조(`safe_foods`, `user_profile_choices`, 상태 컬럼)를 빈 상태로 되돌린다. `user_profiles`의 행은 삭제되며 복구되지 않는다.

#### 깨지는 지점

- 모델이 바뀐다: `UserProfile`(상태 컬럼 3개 삭제, 목록 컬럼 3개 추가), `UserProfileChoice` 삭제(알러지·제한·`family_food` 모두),
  `SafeFood` → `UserProfileSafeFood`(`position` 삭제).
  - `app/models/__init__.py`
  - `app/features/auth/queries.py`(43~45행, `delete_user_owned_rows`): `SafeFood`, `UserProfileChoice` 삭제 코드를 `UserProfileSafeFood`로 바꾼다.
  - `app/features/onboarding/dto.py`, `service.py`, `router.py`
- **온보딩 API가 바뀐다.**
  - `safety.allergies`·`safety.restrictions`(`status` + `items`)가 `allergy_restrictions`, `vegetarian_restrictions`,
    `dietary_approaches` 목록(enum 값)으로 바뀐다. 사용자 직접 입력(`custom_name`)은 더 받지 않는다.
  - `food_preferences.family_foods`(선호 음식)는 삭제된다.
  - `safe_foods`는 `status` 없이 항목 목록만 남고, 항목의 순서는 보존하지 않는다.
  - 클라이언트: `client/src/util/strings.ts`, `client/src/types/profile.ts`, `client/src/features/onboarding/`와 온보딩 DTO를 쓰는 파일.
- 제한 id 어휘가 바뀐다: `RestrictionId`를 쓰는 `app/features/suggestions/ingredients.py`, `mock_profile.py`, `workflow/state.py`,
  `mock_ingredients.json`, `docs/food-ingredient-restriction-ids.md`. 기존 알러지 `lupin` `coconut` `buckwheat` `kiwi` `strawberry`와
  식이 제한 `low-fructose` `no-pork` `no-beef`는 새 enum에 없다. 추천이 새 enum을 어떻게 쓸지는 suggestions 묶음에서 정한다.
- 테스트: `tests/integration/test_onboarding.py`, `test_onboarding_recovery.py`, `tests/fixtures/onboarding.py`,
  `tests/unit/test_remove_exposure_migration.py`(head 단언).

### 2.6 Ingredient: 이름 컬럼과 제한 판정

**대상 테이블:** `ingredients`(컬럼 변경), `ingredient_restrictions`(신규)

**마이그레이션:** 파일 `20261030_1500_ingredient_restrictions.py`, revision `0023_ingredient_restrictions`,
down_revision `0022_user_profile_restrictions`

`ingredients`는 추천용 공용 카탈로그이고 식사 기록의 재료(`meal_food_ingredients`)와 참조하지 않는다 (2.3).
`ingredient_restrictions`는 이 카탈로그의 재료가 아이의 제한에 걸리는지를 저장한다.

#### 목표 스키마

새 파일 `app/models/ingredient_enums.py`에 enum 두 개를 정의한다.

`RestrictionType`: 프로필의 제한 값을 category와 함께 점으로 구분한 경로 문자열이다 (19개). 멤버 이름은 점 대신 `_`를 쓴다.
알러지와 채식의 `EGGS`처럼 값이 겹치는 경우를 category로 구분한다. 프로필 값에서 `f"{category}.{값}"`으로 만든다.

| category | 값 |
|---|---|
| `ALLERGY` (9) | `PEANUTS` `TREE_NUTS` `MILK_DAIRY` `EGGS` `SOY` `WHEAT` `FISH` `SHELLFISH` `SESAME` (`NONE`은 제외) |
| `VEGETARIAN` (7) | `DAIRY` `EGGS` `SEAFOOD` `POULTRY` `RED_MEAT` `LEGUMES_SOY` `NUTS_SEEDS` |
| `DIETARY_APPROACH` (3) | `GLUTEN_FREE` `CASEIN_FREE` `LACTOSE_FREE` |

예: `ALLERGY_EGGS = "ALLERGY.EGGS"`, `VEGETARIAN_EGGS = "VEGETARIAN.EGGS"`, `DIETARY_APPROACH_GLUTEN_FREE = "DIETARY_APPROACH.GLUTEN_FREE"`

`RestrictionDegree`: 재료가 제한에 걸리는 정도. 순서가 있는 척도다. 섭취량이나 증상의 심각도가 아니다.

| 멤버 = 값 | 뜻 |
|---|---|
| `NEVER="NEVER"` | 제한에 걸리지 않음 |
| `DEPENDS_ON_PRODUCT="DEPENDS_ON_PRODUCT"` | 제품 배합에 따라 걸릴 수 있음 |
| `ALWAYS="ALWAYS"` | 제한에 항상 걸림 |

`ingredients` (모델 `Ingredient`)

| 컬럼 | 타입 | 제약 |
|---|---|---|
| `id` | BigInteger | PK, `Identity()` (서버 자동 증가). 기존 최대 id 다음부터 시작 |
| `korean_name` | String | NULL 허용, UNIQUE. 기존 `name`의 이름 변경 |
| `english_name` | String | NULL 허용. 유니크가 아님 (영어 이름이 겹치는 재료가 있다) |
| `created_at`, `updated_at` | DateTime(timezone=True) | NOT NULL |

- `CHECK (korean_name IS NOT NULL OR english_name IS NOT NULL)`: 두 이름 중 하나는 반드시 있다. 이름: `ck_ingredients_name_present`.
- 삭제하는 제약: `ck_ingredients_id_positive`, `ck_ingredients_name`. 유니크 제약 `uq_ingredients_name`은 `uq_ingredients_korean_name`으로 바꾼다.

`ingredient_restrictions` (모델 `IngredientRestriction`)

| 컬럼 | 타입 | 제약 |
|---|---|---|
| `id` | BigInteger | PK, `Identity()` |
| `ingredient_id` | BigInteger | NOT NULL, FK → `ingredients.id` |
| `restriction_type` | VARCHAR(40) | NOT NULL. `RestrictionType` |
| `degree` | VARCHAR(20) | NOT NULL. `RestrictionDegree` |
| `created_at`, `updated_at` | DateTime(timezone=True) | NOT NULL |

- UNIQUE(`ingredient_id`, `restriction_type`), 이름 `uq_ingredient_restrictions_pair`.
- 인덱스 (`restriction_type`, `degree`): 제한별 조회용.

#### 저장 규칙과 추천 후보

- 판정이 끝난 쌍은 `NEVER`도 포함해 모두 저장한다. **행이 없으면 아직 판정하지 않은 것**이다. 판정이 없는 쌍은 안전하게 취급해
  그 제한을 가진 아이의 후보에서 제외한다.
- 추천 후보는 아이의 제한마다 `degree = NEVER`인 행이 있는 재료다. 제한이 없는 아이는 전체 재료가 후보다.
  아이의 제한은 프로필에서 만든다: `allergy_restrictions`(`NONE` 제외), `vegetarian_restrictions`, `dietary_approaches`.
  알러지와 식이 제한에 `NEVER`만 허용할지의 정책은 suggestions 묶음에서 정한다.

#### 이관 규칙

- `ingredients`의 기존 행과 id는 유지한다. `korean_name`에는 기존 `name`이 들어가고 `english_name`은 NULL이다.
- `ingredient_restrictions`는 빈 상태로 만든다. 판정 데이터의 적재는 이 문서의 범위 밖이다 (`team_project/ingredient_data`의 담당).
- `ingredients.id`는 현재 최대 id + 1부터 자동 증가하도록 시퀀스를 맞춘다.
- downgrade: `ingredient_restrictions`를 삭제하고 `ingredients`를 이전 구조로 되돌린다(`id` 자동 증가 해제, `korean_name` → `name`,
  삭제한 `CHECK` 복원). `english_name`은 삭제되며 복구되지 않는다.

#### 깨지는 지점

- `Ingredient.name`이 `korean_name`으로 바뀌고 NULL을 허용한다: `app/features/ingredients/`의 `service.py`, `queries.py`, `router.py`.
  API 응답의 이름 필드를 바꿀지는 ingredients 담당이 정한다.
- 새 모델 `IngredientRestriction`은 `app/models/__init__.py`에 등록한다.
- 제한 id 어휘가 바뀐다(`RestrictionId` → `RestrictionType`): `app/features/suggestions/ingredients.py`, `mock_profile.py`,
  `workflow/state.py`, `mock_ingredients.json`, `docs/food-ingredient-restriction-ids.md`와 관련 테스트.
  카탈로그를 JSON에서 DB로 옮기고 후보를 조회하는 코드는 suggestions 묶음에서 정한다.
- `feat/ingredient-db` 브랜치(`restrictions`, `ingredient_restrictions` 테이블, `eng_name` 컬럼, `0015_ingredient_restrictions`)와 겹친다.
  머지할 때 그 마이그레이션은 이 설계로 대체한다. 담당자와의 조율은 별도로 한다.
- `tests/unit/test_remove_exposure_migration.py`: head 단언.

### 2.7 FoodRecommendation: 추천 재편

**대상 테이블:** `food_recommendations`, `food_recommendation_tries`(신규), `suggestions`(삭제)

**마이그레이션:** 파일 `20261030_1600_food_recommendations.py`, revision `0024_food_recommendations`,
down_revision `0023_ingredient_restrictions`

#### 목표 스키마

새 파일 `app/models/food_recommendation_enums.py`에 enum 세 개를 정의한다. 이미 값이 있는 집합은 값을 유지하고 멤버 이름만 대문자로 하며,
새로 만드는 집합은 멤버 이름과 값이 같은 대문자 문자열이다.

| enum | 멤버 = 값 |
|---|---|
| `FoodRecommendationStatus` | `PENDING="pending"`, `SAVED="saved"`, `DISMISSED="dismissed"`, `TRIED="tried"` |
| `FoodRecommendationDismissReason` | `RESTRICTION` `DISLIKE` `NOT_FIT` `TOO_MUCH_PREPARATION` `INGREDIENT_HARD_TO_GET` `ALREADY_TRIED` |
| `FoodRecommendationFeedback` | `HELPFUL="helpful"`, `NOT_HELPFUL="not_helpful"`, `NOT_SURE="not_sure"` |

- `TRIED`는 기존 상태 집합에 더하는 값이라 같은 enum 안에서 대소문자를 섞지 않도록 소문자 값 `"tried"`로 한다.
- 이전 `DismissReason`과의 대응(참고용, 데이터는 이관하지 않음): `restriction_conflict` → `RESTRICTION`, `disliked_food_or_form` → `DISLIKE`,
  `food_preferences` → `NOT_FIT`, `too_much_preparation` → `TOO_MUCH_PREPARATION`, `ingredient_unavailable` → `INGREDIENT_HARD_TO_GET`,
  `already_tried` → `ALREADY_TRIED`.

`food_recommendations` (모델 `FoodRecommendation`, 파일 `app/models/food_recommendation.py`)

| 컬럼 | 타입 | 제약 |
|---|---|---|
| `id` | BigInteger | PK, `Identity()` |
| `user_id` | BigInteger | NOT NULL, FK → `users.id`, index (변경 없음) |
| `origin_food_id` | BigInteger | NOT NULL, FK → `meal_foods.id`, index. 추천의 근거가 된 음식 (기존 `food_id`) |
| `what_to_try` | Text | NOT NULL (변경 없음) |
| `why_this_may_help` | Text | NOT NULL (변경 없음) |
| `serving_tip` | Text | NULL (변경 없음) |
| `ingredients` | JSON 문자열 목록 (Postgres는 JSONB) | NOT NULL. LLM이 반환한 문자열 목록을 그대로 저장한다 |
| `cooking_method` | VARCHAR(30) | NOT NULL. `MealCookingMethod` |
| `causes` | Text | NOT NULL. 식후 리뷰에서 참고한 특성(아이가 어려워한 원인)을 LLM이 서술한 문장 |
| `status` | VARCHAR(20) | NOT NULL, 기본값 `pending`. `FoodRecommendationStatus` |
| `dismiss_reasons` | JSON 목록 (Postgres는 JSONB) | NOT NULL, 기본값 `[]`. 원소는 `FoodRecommendationDismissReason` |
| `saved_at` | DateTime(timezone=True) | NULL (변경 없음) |
| `created_at`, `updated_at` | DateTime(timezone=True) | NOT NULL (`updated_at`은 새로 추가) |

- 삭제하는 컬럼: `meal_id`, `ingredient_id`, `food_snapshot`. 식사는 `origin_food_id`의 음식(`meal_foods.meal_id`)에서 얻는다.
- `ingredients`는 카탈로그(`ingredients` 테이블)를 참조하지 않는다. 추천 기록은 카탈로그가 바뀌어도 그대로 남는다.
- `causes`는 참고한 리뷰 특성을 서술한 문장이고, `why_this_may_help`는 그 시도가 도움이 될 이유를 서술한 문장이다.
- `status`가 `TRIED`인 추천은 `food_recommendation_tries`에 행이 있어야 한다. 두 정보는 중복이며 일관성은 서비스가 지킨다.
- 삭제하는 `CheckConstraint`: `ck_suggestions_id_positive`, `ck_suggestions_status`, `ck_suggestions_saved_at`,
  `ck_suggestions_what_to_try`, `ck_suggestions_why_this_may_help`. 값 규칙은 앱이 검증한다.

`food_recommendation_tries` (모델 `FoodRecommendationTry`, 파일 `app/models/food_recommendation_try.py`)

| 컬럼 | 타입 | 제약 |
|---|---|---|
| `id` | BigInteger | PK, `Identity()` |
| `food_recommendation_id` | BigInteger | NOT NULL, FK → `food_recommendations.id` |
| `food_id` | BigInteger | NOT NULL, FK → `meal_foods.id`. 추천을 시도한 식사의 음식 |
| `feedback` | VARCHAR(20) | NULL. `FoodRecommendationFeedback` |
| `created_at`, `updated_at` | DateTime(timezone=True) | NOT NULL |

- UNIQUE(`food_recommendation_id`, `food_id`), 이름 `uq_food_recommendation_tries_pair`.
- 삭제하는 모델: `UserSuggestion`(`user_suggestion.py`), `SuggestionMealLink`(`suggestion_meal_link.py`).

#### 이관 규칙

- 기존 데이터는 이관하지 않는다. 2.3이 `suggestions`의 행을 이미 삭제하고 `suggestion_meal_links`를 삭제하므로 새 테이블은 빈 상태다.
- upgrade: `suggestions`를 삭제하고 `food_recommendations`, `food_recommendation_tries`를 만든다.
- downgrade: 두 새 테이블을 삭제하고 옛 구조의 `suggestions`를 빈 상태로 다시 만든다. 데이터는 복구되지 않는다.

#### 깨지는 지점

- 모델 이름과 파일이 바뀐다: `UserSuggestion` → `FoodRecommendation`, `SuggestionMealLink` → `FoodRecommendationTry`.
  - `app/models/__init__.py`, `app/features/auth/queries.py`(`delete_user_owned_rows`)
  - `app/features/suggestions/`의 `dto.py`, `router.py`, `service.py`, `validation.py`, `workflow/prompts.py`, `workflow/schemas.py`, `workflow/state.py`
  - `app/features/meals/`의 `dto.py`, `present.py`, `queries.py`, `service.py`(추천 연결 처리)
- **API가 바뀐다.**
  - `SuggestionResponse`에서 `meal_id`, `ingredient_id`, `food_snapshot`이 사라지고 `food_id`는 `origin_food_id`가 된다.
    `ingredients`, `cooking_method`, `causes`가 추가되고 `status`에 `tried`가 더해진다.
  - `SuggestionTarget`의 `ingredient_id`가 사라져 추천은 음식 단위로만 만든다.
  - `dismiss_reasons`의 값이 새 `FoodRecommendationDismissReason`으로 바뀐다.
  - LLM 초안(`SuggestionDraft`)에 `cooking_method`와 `causes`가 추가되고, 기존 `used_ingredients`가 `ingredients`로 저장된다.
  - 클라이언트: `client/src/data/dto/suggestionDto.ts`, `types/suggestionRecord.ts`, `features/suggestions/`,
    `features/meal-checkin/hooks/useMealSuggestions.ts`, `rules/recommendationPresentation.ts`, `util/strings.ts`와 추천 응답을 쓰는 화면.
- **`origin_food_id`와 `food_id`는 `meal_foods`를 CASCADE로 참조한다.** 음식이 삭제되면 그 음식에서 나온 추천과 시도 기록도 함께 삭제된다.
  식사를 수정할 때 음식을 지웠다가 다시 만들면 저장한 추천이 사라지므로, 식사 수정은 기존 음식을 id로 찾아 갱신해야 한다.
- 테스트: `tests/helpers/suggestions.py`, `tests/integration/test_api_contract_edges.py`, `test_auth.py`, `test_contract_api.py`,
  `test_meals_write.py`, `test_suggestion_workflow.py`, `tests/unit/test_suggestion_validation.py`, head 단언.

## 3. 진행 상태

(작성 예정)

## 4. 결정 기록

- 이메일 변경 시도는 사용자당 한 행(`user_id` PK)으로 둔다. 이력은 남기지 않는다.
- `Meal.id`는 이미 자동 증가(`Identity`)이므로 타입을 바꾸지 않는다 (Postgres `bigint` 유지).
- 값의 유효성은 DB `CHECK`가 아니라 애플리케이션 로직으로 검증한다. 이 규칙은 개편 뒤에도 유지하므로
  [server/docs/architecture.md §2.2](../server/docs/architecture.md)에 기록했다.
  이유는 `CHECK`보다 마이그레이션이 수월하고 검증 코드가 애플리케이션에 모이기 때문이다.
- `StrEnum`의 멤버 이름은 대문자로 하고, 값은 현행(소문자 등)을 유지한다. API · DB 값이 바뀌지 않으므로 데이터 이관과 클라이언트 수정이 없다.
- `ingredients`(추천용 카탈로그)와 `meal_food_ingredients`(사용자 입력 기록)는 서로 참조하지 않는 별개 계열이다.
- `MealFood.id`와 `MealFoodIngredient.id`는 서버 자동 증가이며 서버가 응답으로 돌려준다.
- 식후 리뷰 테이블은 `meal_foods`, `meal_food_ingredients`에 합친다. `outcome`이 NULL이면 미리뷰다. `food_snapshot`과
  `normalized_name`은 버리고, `difficulties`는 `difficulty_reasons`로 이름을 바꾼다.
- 2.3은 기존 데이터를 이관하지 않고 식사·추천 관련 데이터를 삭제한다.
- 값 규칙(허용 값, 양수, 빈 문자열 금지 등)의 `CheckConstraint`는 모두 삭제하고 앱이 검증한다. 테이블을 다루는 묶음마다 해당 제약을 삭제한다.
- 프로필의 제한은 `user_profiles`의 목록 컬럼(`allergy_restrictions`, `vegetarian_restrictions`, `dietary_approaches`)에 둔다.
  원소는 컬럼별 `StrEnum` 값만 허용한다. 알러지는 모르는 상태 없이 입력을 필수로 하고, 직접 입력(`custom_name`)과
  선호 음식(`family_foods`), 안전 음식 순서(`position`)는 없앤다. 온보딩 임시저장은 클라이언트에만 둔다.
- 2.5는 기존 프로필 데이터를 이관하지 않고 삭제한다.
- `difficulty_reasons`는 category를 점으로 구분한 경로 값(`TEXTURE.HARDNESS.HARD`)의 평탄한 `StrEnum` 목록이다.
  값의 기준은 PRD이며, category를 별도로 저장하지 않는다.
- 재료의 제한 판정(`ingredient_restrictions`)은 확정된 쌍을 `NEVER` 포함해 모두 저장하고, 행이 없으면 미판정으로 본다.
  행이 없는 쌍을 "해당 없음"으로 취급하면 판정되지 않은 재료가 조용히 통과하기 때문이다.
- 제한은 `RestrictionType` 경로 값(`ALLERGY.EGGS`, `VEGETARIAN.EGGS`)으로 저장한다. 알러지의 달걀과 채식의 달걀은 판정 기준이
  다를 수 있어 구분한다. 판정 정도 컬럼은 `degree`이며 `NEVER < DEPENDS_ON_PRODUCT < ALWAYS`의 순서가 있다.
- PRD 밖 제한 5개(`gluten-casein-free` `no-added-sugar` `low-fructose` `low-sodium` `ketogenic`)는 판정 데이터에서 제외한다.
- `Ingredient.id`는 서버 자동 증가이고, `korean_name`과 `english_name`은 둘 다 NULL을 허용하되 하나는 반드시 있어야 한다
  (`CHECK`). 컬럼의 NULL 여부를 정하는 구조 제약은 값 규칙이 아니므로 `CHECK`로 둔다.
- 추천(`UserSuggestion` → `FoodRecommendation`)은 음식 단위이고 `origin_food_id`로 근거 음식을 가리킨다. `food_snapshot`은 없앤다.
  `what_to_try`, `why_this_may_help`, `serving_tip`은 유지하고 `ingredients`, `cooking_method`, `causes`를 더한다.
  `cooking_method`는 NULL을 허용하지 않고, `ingredients`는 LLM이 반환한 문자열 목록을 그대로 저장한다.
- 이미 값이 있는 enum 집합은 현행 값을 유지하고 멤버 이름만 대문자로 한다. 새로 만드는 집합은 이름과 값을 같은 대문자로 한다.
- 추천의 `TRIED` 상태와 시도 기록(`food_recommendation_tries`)은 중복 정보이며 일관성은 서비스가 지킨다.

## 5. 후속 작업 (이번 범위 밖)

- 클라이언트에만 있고 PRD에 없는 난이도 항목을 삭제한다: `tasteIntensity`(`mild` `strong`), `shape`(`consistent` `varied`
  `notSure` `note`), `visibility`(`visible` `hidden` `mixed`), `tasteType`의 `other`. 서버의 `DifficultyReason`에는 포함하지 않았다.
  이 문서는 개편이 끝나면 삭제되므로, 삭제 전에 이슈로 옮긴다.
- 재료 판정 데이터(`team_project/ingredient_data`, 데이터 담당):
  - 채식 7개(`VEGETARIAN.*`)의 판정이 없다. 채식 제한을 가진 아이는 판정이 생기기 전까지 후보 재료가 없다.
  - 데이터의 제한 id를 `RestrictionType` 값으로 옮긴다 (예: `peanut` → `ALLERGY.PEANUTS`). 17개 중 12개만 쓰고
    PRD 밖 5개는 제외한다.
  - 조류 알의 `egg` 판정 기준이 일관되지 않다: 거위알·오리알 `ALWAYS`, 메추리알 보류, 청둥오리알 `DEPENDS_ON_PRODUCT`.
    청둥오리알은 제품 차이가 아니라 종 범위 문제라서 정책(`restriction-policy.md`)의 `DEPENDS_ON_PRODUCT` 정의와 맞지 않는다.
  - `english_name_conflict` 플래그가 모두 `false`인데 영어 이름이 겹치는 재료가 11종(26개) 있다.
  - 기존 mock 카탈로그의 이름(`간장`, `밀가루`)이 판정 데이터에 같은 이름으로 없다.
