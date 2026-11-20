<!-- AI-generated with GPT-6, 2026-11-20, reviewed by Haechan Jung -->
<!-- Changed: 재료 파일의 서버 반영과 통합 CLI 사용 안내 -->

# 영어 재료 데이터

목차: [결과 파일](#결과-파일) · [서버 적용](#서버-적용) · [데이터 확인](#데이터-확인)

추천용 공용 재료와 제한 판정을 JSONL 두 파일로 관리한다.
서버는 `server/assets/`의 복사본을 DB에 적재해 추천에 사용한다.
파일 수정 후에는 배포 CD로 DB에 반영한다.

## 결과 파일

| 원본 파일 | 필드 |
|---|---|
| `result/ingredients.jsonl` | `id`, `english_name`, `korean_name: null` |
| `result/ingredients_restrictions.jsonl` | `ingredient_id`, `restriction_type`, `degree` |

제한 값과 판정 행이 없는 경우의 의미는 [공통 제한 규칙](../../docs/food-ingredient-restriction-ids.md)을 따른다.

## 서버 적용

서버 설치와 DB 연결 설정은 [서버 README](../../server/README.md#설치와-실행)를 따른다.
원본을 갱신했다면 저장소 루트에서 검증한 뒤 서버에 사용할 두 파일을 복사한다.

```bash
python3 -m data.ingredient_db check
cp data/ingredient_db/result/ingredients.jsonl \
  data/ingredient_db/result/ingredients_restrictions.jsonl server/assets/
```

원본과 복사본을 함께 커밋하는 규칙은 [루트 AGENTS](../../AGENTS.md#재료-카탈로그-파일-관리)를 따른다.
빌드는 커밋된 assets를 그대로 사용한다. `main`에 반영되면 CD가 새 서버의 기동을 확인한 뒤
`apply`와 `verify`를 실행한다. 배포 순서와 실패 처리는 [배포 문서](../../server/docs/deploy.md#22-배포-main-머지)에 있다.

수동 적용 명령은 `server/`에서 실행한다. 기본 입력은 `server/assets/`의 두 파일이다.

| 작업 | 명령 |
|---|---|
| 파일 검사 — DB에 접속하지 않음 | `uv run python -m scripts.ingredient_catalog.cli check` |
| 최초 적재 또는 파일 변경 시 교체 | `uv run python -m scripts.ingredient_catalog.cli apply` |
| DB와 파일이 같은지 확인 | `uv run python -m scripts.ingredient_catalog.cli verify` |
| 파일 변경 여부와 관계없이 전체 교체 | `uv run python -m scripts.ingredient_catalog.cli replace` |

적용 후에는 `verify`로 결과를 확인한다. `apply`·`replace`로 교체할 때는 기존 공용 재료와 제한 판정을
모두 교체하며, 사용자 식사 기록과 저장된 추천은 유지한다.
대상 DB를 확인하고 실행하며, 운영 DB 작업은 [서버 작업 규칙](../../server/AGENTS.md#db에-영향을-주는-작업은-반드시-사용자-확인)을 따른다.

## 데이터 확인

- 재료 선정·이름 통합·제한 판정·검토 기준: [policy.md](docs/policy.md)
- 최종 집계와 검토 범위: [검토 결과](review/README.md), [집계·파일 해시](review/summary.json)
- 원본 대응과 판정 근거: [전체 기록](review/catalog.json)

저장소 루트에서 `python3 -m data.ingredient_db.viewer`를 실행하면
[읽기 전용 검토 화면](http://127.0.0.1:8765/)에서 재료와 판정 근거를 검색할 수 있다.
생성 도구의 명령과 옵션은 `python3 -m data.ingredient_db --help`로 확인한다.

출처는 USDA FoodData Central의 [SR Legacy 2018](https://fdc.nal.usda.gov/download-datasets/)이며,
원본 데이터는 [CC0](https://fdc.nal.usda.gov/api-guide/#bkmk-9)로 공개된다.
