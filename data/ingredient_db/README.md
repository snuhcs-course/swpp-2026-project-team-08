<!-- AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung -->
<!-- Changed: 영어 재료 데이터 생성과 적용 계약 정의 -->

# 영어 재료 데이터

목차: [결과](#결과) · [생성](#생성) · [검증](#검증) · [서버 적용](#서버-적용)

USDA SR Legacy 2018의 일반 식품을 영어 조리 재료로 정리한다.
Gemini A·B·C의 다수결로 재료와 19개 제한을 판정한다.
서버에 전달하는 결과는 `result/`의 JSONL 두 개다.

## 결과

| 파일 | 필드 |
|---|---|
| `result/ingredients.jsonl` | `id`, `english_name`, `korean_name: null` |
| `result/ingredients_restrictions.jsonl` | `ingredient_id`, `restriction_type`, `degree` |

제한 값과 행이 없는 경우의 의미는 [공통 제한 규칙](../../docs/food-ingredient-restriction-ids.md)을 따른다.
선정·이름 통합·판정의 기대 동작은 [정책](docs/policy.md)에 둔다.
재료 ID는 이름순으로 부여하며 USDA의 원본 ID와 구별한다.
원본 대응·세 판정·보류·파일 해시는 `review/`에 보존한다.
`work/`는 다운로드와 재개용 원시 응답이며 Git에 넣지 않는다.

리뷰는 [집계와 불일치 예시](review/summary.json)를 먼저 읽고, 필요한 항목만
[원본과 판정 근거](review/catalog.json)에서 확인한다. 집계에는 원본의 포함·제외·보류 수,
제한별 판정 수, 2:1·삼자 불일치 수와 예시가 있다.
`catalog.json`은 모든 원본과 세 판정, 이름·구성원 합의를 담아 API 없이 결과를 재생성한다.

원본은 [USDA 공식 배포](https://fdc.nal.usda.gov/download-datasets/)의 SR Legacy 2018 CSV다.
[CC0](https://fdc.nal.usda.gov/api-guide/#bkmk-9)로 공개되며 출처는
U.S. Department of Agriculture, Agricultural Research Service, FoodData Central이다.
식품 원본 수와 정리된 재료 수는 다르다. 영양성분 자체를 서비스 DB에 적재하지 않는다.

## 생성

Python 3.12 이상을 사용한다. 명령은 저장소 루트에서 실행한다.
`GEMINI_API_KEY` 환경변수 또는 이 폴더의 `.env`로 키를 제공한다. 환경변수가 우선한다.
키와 원시 응답을 커밋하지 않는다. 모델 기본값은 `gemini-3.5-flash-lite`다.
복합 분류 규칙을 검토하도록 [thinking level](https://ai.google.dev/gemini-api/docs/thinking)을
`high`로 고정하며 실행 기록과 응답 캐시에도 이 설정을 포함한다.

```bash
python3 -m data.ingredient_db prepare
python3 -m data.ingredient_db select
python3 -m data.ingredient_db judge
python3 -m data.ingredient_db export
python3 -m data.ingredient_db check
```

`prepare`는 원본·정책·모델을 고정한다. `select`는 원본별 포함 여부와 이름·묶음을 정한다.
`judge`는 확정 재료마다 19개 제한을 판단한다. `export`는 검토 기록과 JSONL을 만든다.
`check`는 네트워크와 DB 없이 기록의 완전성과 결과를 검사한다.
요청당 기본 크기는 `select` 원본 40행, `judge` 재료 10개이며 `--batch-size`로 지정한다.
중단된 단계는 같은 명령으로 재개하며 검증된 응답은 재사용한다.
원본·정책·모델이 달라지면 다른 작업 폴더를 사용한다.

## 검증

```bash
python3 -m unittest discover -s data/ingredient_db/tests -p 'test_*.py'
cd server
uv run pytest
uv run ruff check . ../data/ingredient_db
uv run ruff format --check . ../data/ingredient_db
uv run python scripts/load_ingredients.py --check
```

자동 테스트는 가짜 모델로 다수결·재개·출력·적재를 검사한다.
실제 판정의 근거와 불일치는 `review/`에서 확인한다. AI 판정을 사람 승인으로 표시하지 않는다.
코드·문서의 AI 이력 리뷰어는 데이터 각 행의 사실 확인자를 뜻하지 않는다.

## 서버 적용

서버는 JSONL을 DB에 적재한 뒤 DB의 영어 재료명과 제한 판정으로 추천 목록을 만든다.
적재기 기본 경로는 이 폴더의 `result/`다. 파일 검사는 DB에 쓰지 않는다.

```bash
cd server
uv run python scripts/load_ingredients.py --check
# 아래 명령은 공용 재료와 제한 판정을 교체한다. 대상 DB 확인 후 별도로 실행한다.
uv run python scripts/load_ingredients.py --replace-catalog
```

교체는 한 트랜잭션에서 수행하며 실패하면 기존 목록을 유지한다.
사용자의 식사 기록과 저장된 추천은 별도 데이터로 보존한다.
영어 데이터 교체와 영어 조회 코드 배포는 같은 적용 시간에 진행한다.
기존 한국어 목록만 있는 DB에 영어 조회 코드를 먼저 배포하면 추천 후보가 비게 된다.
적용 순서는 추천 요청 중지 → 데이터 교체 → 영어 조회 코드 배포 → 추천 확인 → 요청 재개다.
운영 DB 실행과 배포는 [서버 작업 규칙](../../server/AGENTS.md)을 따른다.
