<!-- AI-generated with Claude Sonnet 5.5, 2026-10-26, reviewed by Jaemin Kim -->

# 추천 로직

식사 후 리뷰에서 부모가 고른 음식(또는 음식 속 재료)마다, 다음 식사에서 아이와 시도해 볼 작은 한 걸음을 LLM으로 만든다.
이 문서는 그 추천이 **어떤 데이터로, 어떤 순서로, 어떤 규칙으로** 만들어지는지 설명한다. 추천 로직을 바꾸는 작업을 하기 전에
먼저 읽어야 한다. 구조적인 설명(워크플로 코드 배치, 상태와 컨텍스트 등)은 [`server/docs/architecture.md`](../server/docs/architecture.md) §2.5에 있다.

## 1. 개요

추천 하나는 세 부분으로 이루어진다.

| 필드 | 내용 |
|---|---|
| `what_to_try` | 아이에게 시도해 볼 작은 한 걸음 |
| `why_this_may_help` | 이 시도가 도움이 될 수 있는 이유 |
| `serving_tip` | 음식을 내놓을 때의 팁 |

추천의 핵심 아이디어는 **대상(음식 또는 재료)의 특징 일부를, 아이가 이미 잘 먹는 음식(safe foods) 쪽으로 살짝만 바꾸는 것**이다.
조리법, 질감, 온도, 모양, 곁들임 같은 특징을 한 번에 많이 바꾸지 않는다.

추천에 쓰는 재료는 **아이가 쓸 수 있는 재료로 제한**한다. 아이의 알러지 · 식이 제한에 걸리는 재료는 쓰지 않는다.

## 2. 추천 단계

한 번의 추천 요청(`POST /meals/{meal_id}/suggestions`)은 다음 순서로 처리된다.

| 단계 | 하는 일 | 코드 |
|---|---|---|
| 1. 대상 확인 | 요청한 target이 이 사용자의 리뷰한 음식 · 재료인지 확인한다. 아니면 요청을 거절한다. | `features/suggestions/service.py` |
| 2. 아이 정보 조회 | 잘 먹는 음식(`safe_foods`), 프로필의 알러지 · 식이 제한과 선호, 지난 식사에서 손도 대지 않은 음식 · 재료를 읽는다. | `features/suggestions/queries.py` |
| 3. 입력 만들기 | target마다 그 음식(또는 재료)의 특징과 리뷰 결과(먹은 정도, 어려웠던 점)를 모아 입력으로 만든다. | `features/suggestions/inputs.py` |
| 4. 추천 요청 | 대상, 아이 정보, **쓸 수 있는 재료 목록**을 프롬프트에 담아 LLM에게 추천을 쓰게 한다. 이 목록 밖의 재료는 쓰지 말라고 지시한다. | `features/suggestions/workflow/` |
| 5. 검증 | LLM이 돌려준 추천을 요청과 아이의 제한에 비춰 검증한다. 문제가 있으면 문제를 알려 주고 다시 쓰게 한다 (처음 포함 최대 3번). | `features/suggestions/validation.py` |
| 6. 반환 | 검증을 통과한 추천을 `pending` 상태로 저장하고 반환한다. 끝까지 통과하지 못하면 저장하지 않고 실패로 응답한다. | `features/suggestions/service.py` |

## 3. 사용하는 데이터

### 3.1 추천 대상 (target)

요청의 `targets`는 (`food_id`, `ingredient_id`) 쌍의 목록이다. `ingredient_id`가 없으면 음식 전체가, 있으면 그 음식 속 재료 하나가 대상이다.
대상마다 다음 정보를 프롬프트에 싣는다.

| 대상 | 싣는 정보 |
|---|---|
| 음식 | 이름, 재료 이름 목록, 조리법, 담은 방식 메모, 먹은 결과, 어려웠던 점 |
| 재료 | 재료 이름, 들어 있던 음식 이름, 그 재료의 먹은 결과, 어려웠던 점 |

먹은 결과는 `eaten` · `tasted` · `untouched` · `unclear` 중 하나이고, 어려웠던 점은 식사 리뷰에서 기록한 (분류, 세부 분류, 값)의 목록이다
(예: 질감 - 단단함). 음식 정보는 리뷰를 저장할 때 만들어 둔 **스냅샷**(`food_snapshot`)에서 읽는다.

### 3.2 아이 정보

| 정보 | 출처 | 쓰이는 곳 |
|---|---|---|
| 잘 먹는 음식 (이름, 조리 · 준비 방식, 담는 방식) | `SafeFood` | 프롬프트 |
| 알러지 · 식이 제한 | 프로필 선택 항목(`UserProfileChoice`)의 `allergy` · `restriction` | 코드 검증 + 프롬프트 |
| 힘들어하는 질감 · 맛, 선호하는 담음새 | 프로필 선택 항목의 `difficult_texture` · `difficult_taste` · `presentation_preference` | 프롬프트 |
| 나이대, 냄새 민감도, 선호하는 온도, 새 음식에 대한 반응 | 프로필(`UserProfile`) | 프롬프트 |
| 최근 손도 대지 않은 음식 · 재료 | 지난 식사 리뷰 결과 중 먹은 결과가 `untouched`인 것 | 프롬프트 |

- 손도 대지 않은 음식 · 재료는 이 사용자의 식사만, 최근 식사부터 각각 최대 10개(`queries.MAX_REFUSED`)를 읽고, 같은 이름은 한 번만 싣는다.
- 프로필이 없으면 빈 값으로 채운다.
- 온보딩 기능의 `service.py`를 부르지 않고 모델을 직접 조회한다. 다른 기능의 `service.py`를 호출하면 안 된다.
  (출처: [`server/AGENTS.md`](../server/AGENTS.md)의 "하지 말 것", [`server/docs/architecture.md`](../server/docs/architecture.md) §2.5)

## 4. 재료 제한 규칙

### 4.1 제한 id

알러지와 식이 제한은 `RestrictionId`(20개)로 나타낸다. 이 id는 클라이언트 프로필의 id와 **같아야** 한다.
목록과 변경 규칙은 [`food-ingredient-restriction-ids.md`](food-ingredient-restriction-ids.md)에 있다.

프로필의 `allergy` · `restriction` 선택 항목 중 값이 `RestrictionId`인 것은 아이의 제한 집합(`ChildRestrictions`)에 들어가 **코드로 검증**한다.
직접 입력한 이름이거나 `RestrictionId`에 없는 값은 프롬프트의 제한 정보 항목으로만 전달한다.

### 4.2 재료 카탈로그

카탈로그의 재료마다 한국어 · 영어 이름과, 그 재료가 걸리는 제한 id의 목록이 있다. 예를 들어 우유는 `milk` · `lactose-free` · `casein-free`에 걸린다.
이름은 공백과 대소문자를 정규화한 뒤 이름 전체가 일치하는 경우에만 같은 재료로 본다. 현재 카탈로그는 `features/suggestions/mock_ingredients.json`이고,
`ingredients.py`의 `load_catalog`가 읽는다. 다른 출처로 바꿀 때는 `load_catalog`만 바꾼다.

### 4.3 두 겹의 확인

| 겹 | 하는 일 | 코드 |
|---|---|---|
| 프롬프트의 재료 목록 | 카탈로그에서 아이의 제한 id와 겹치지 않는 재료만 골라 프롬프트에 싣고, 이 목록 밖의 재료는 쓰지 말라고 지시한다. | `ingredients.usable_ingredient_names` |
| 결과 검증 | LLM이 `used_ingredients`에 적은 재료가 카탈로그에 있고 아이의 제한에 걸리지 않는지 순수 함수로 다시 확인한다. | `validation.find_problems` |

프롬프트는 첫 시도를 안전하게 만들기 위한 것이고, 안전을 보장하는 것은 검증이다. 검증이 찾는 문제는 다음과 같다.

| 문제 | 뜻 |
|---|---|
| `missing_food` · `unexpected_food` · `duplicate_food` | 결과의 `food_id`가 대상과 맞지 않는다 (빠졌거나, 요청하지 않았거나, 중복). |
| `blank_field` | 세 필드 중 비어 있는 것이 있다. |
| `empty_ingredients` | `used_ingredients`가 비어 있다. |
| `unknown_ingredient` | 카탈로그에 없는 재료를 썼다. |
| `restricted_ingredient` | 아이의 제한에 걸리는 재료를 썼다 (걸린 제한 id를 함께 담는다). |

검증은 문제를 예외로 던지지 않고 목록으로 반환한다. 문제에는 자연어 문구가 없고, 재시도 지시문은 `workflow/prompts.py`가 만든다.

## 5. 프롬프트

프롬프트는 `workflow/prompts.py`에 모여 있다. 지시문은 한국어이고, 추천 세 필드는 영어로 한두 문장씩 쓰게 한다.

### 5.1 시스템 프롬프트

모델에게 다음을 지시한다.

- 대상의 특징 일부(조리법, 질감, 온도, 모양, 곁들임 등)를 아이가 잘 먹는 음식 쪽으로 **살짝만** 바꾼다.
- 쓰는 재료는 '쓸 수 있는 재료' 목록에 있는 것만 쓰고, `used_ingredients`에는 목록의 이름을 그대로 적는다.
- 아이의 제한 정보에 적힌 알러지와 식이 제한을 지킨다.
- 먹기를 강요하지 않는 부드러운 표현을 쓴다.
- `food_id`는 대상 목록의 id를 그대로 쓰고, 대상마다 추천을 하나씩 쓴다.

### 5.2 사용자 메시지

다음 절로 나누어 담는다.

1. 제안 대상 (대상별 특징과 리뷰 결과)
2. 아이가 잘 먹는 음식
3. 최근 손도 대지 않은 음식 · 재료
4. 아이의 제한 정보 (프로필 선호와 직접 입력한 제한)
5. 쓸 수 있는 재료 (이 밖의 재료는 쓰지 않는다)

대상의 `id`는 DB id가 아니라 요청에서의 순번(`"0"`, `"1"`…)이다. 같은 음식이 음식 전체와 그 속 재료로 함께 요청될 수 있어서 항상 유일한 값을 쓴다.

### 5.3 재시도 메시지

검증에서 문제가 나오면, 직전 대화 뒤에 문제를 한 줄씩 적은 메시지를 덧붙여 전체 추천을 다시 쓰게 한다. 예를 들어 제한에 걸린 재료는 재료 이름과 걸린 제한 id를 알려 주고 다른 재료로 바꾸게 한다.

## 6. 실패 처리와 바꾸는 방법

### 6.1 실패 처리

- 추천은 처음 포함 최대 3번(`workflow/nodes.MAX_ATTEMPTS`) 쓴다. 3번째에도 검증을 통과하지 못하면 `GenerationRejectedError`를 던지고 **저장하지 않는다**.
- 전체 생성에는 60초 타임아웃이 있다. 타임아웃, 모델 호출 실패, 검증 거절은 모두 `GENERATION_FAILED`(HTTP 502)로 응답한다.
- 검증을 통과하지 못한 LLM 결과를 저장하거나 응답에 싣지 않아야 한다.

### 6.2 바꾸는 방법

| 바꾸려는 것 | 고칠 곳 |
|---|---|
| 추천 문구의 방향 · 말투, 지시 사항 | `workflow/prompts.py` |
| 프롬프트에 싣는 정보 추가 · 삭제 | 정보를 읽는 `queries.py` · `inputs.py`, 값 모양인 `workflow/state.py`, 문장으로 바꾸는 `workflow/prompts.py` |
| 재료 카탈로그 출처 | `ingredients.py`의 `load_catalog` (제한 id를 바꾸면 클라이언트와 함께, 위 4.1 문서 규칙대로) |
| 새로운 검증 규칙 | `validation.py`에 문제 종류를 더하고, `workflow/state.py`의 `ValidationProblem.kind`와 `workflow/prompts.py`의 `describe_problem`에 같은 종류를 더한다 |
| 재시도 횟수 · 타임아웃 | `workflow/nodes.py`의 `MAX_ATTEMPTS`, `service.py`의 `asyncio.timeout` |
| 사용하는 모델 | 환경변수 `SUGGESTION_MODEL` (`docs/deploy.md` §3.1) |

추천 로직을 바꾸면 이 문서도 같은 변경에서 함께 고쳐야 한다.

## 7. 기타 질문

아직 답이 정해지지 않은 질문을 모아 둔다. 답이 정해지면 위의 해당 절에 반영하고 여기서 지운다.

- **food와 ingredient를 정규화하지 않을 것이라면 `food_id`와 `ingredient_id`가 무슨 의미가 있는가?**
  추천은 요청한 target을 (`food_id`, `ingredient_id`)로 식별하고 리뷰 기록에서 정보를 읽지만, 프롬프트에는 이름만 실린다
  (`FoodInput.id`는 DB id가 아니라 요청 안의 순번이다). 음식 · 재료를 같은 것끼리 묶어 두지 않는다면 이 id들이 추천 로직에서
  어떤 역할을 하는지, 그리고 지난 식사 기록을 이름 문자열로만 모으는 지금 방식(3.2)으로 충분한지 정해야 한다.
