<!-- AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung -->
<!-- Changed: 영어 재료 데이터 생성과 적용 계약 정의 -->

# 영어 재료 데이터

목차: [결과](#결과) · [화면에서 확인](#화면에서-확인) · [생성](#생성) · [검증](#검증) · [서버 적용](#서버-적용)

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

## 화면에서 확인

```bash
python3 -m data.ingredient_db.viewer
```

[로컬 검토 화면](http://127.0.0.1:8765/)에서 영어 이름·ID로 검색하고 제한 종류와 판정으로 걸러 본다.
재료를 선택하면 19개 최종 판정, 원래 A·B·C 응답, 검토 보류 이유와 USDA 원문을 확인한다.
선정·이름 통합 보류 원본도 별도 목록에서 확인한다. JSONL 두 파일과 검토 요약을 내려받을 수 있다.
화면은 읽기 전용이며 로컬 컴퓨터에서만 접속한다. 포트 변경은 `--port 8766`처럼 지정한다.

## 생성

Python 3.12 이상을 사용한다. 명령은 저장소 루트에서 실행한다.
`GEMINI_API_KEY` 환경변수 또는 이 폴더의 `.env`로 키를 제공한다. 환경변수가 우선한다.
키와 원시 응답을 커밋하지 않는다. 모델 기본값은 `gemini-3.5-flash-lite`다.
추론 수준은 API 기본값을 사용하며 `thinkingConfig`를 보내지 않는다.
실행 기록과 응답 캐시는 이 선택을 `thinking_level: "default"`로 기록한다.
서버가 실제로 선택한 추론 수준을 의미하지는 않는다.
기존 실행의 응답은 자동으로 다른 정책의 응답으로 간주하지 않는다.
`select --reuse-selection <기존 작업 폴더>`는 기존 선정 표를 명시적으로 가져온다.
같은 원본인지 검사하며, 이전 모델·정책·추론 설정·응답 해시와 표를 `selection_reuse`에 보존한다.
에이전트별로 표가 없는 원본만 새로 요청한다. 기존 표는 새 정책 준수 검토 대상이다.

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
요청당 기본 크기는 `select` 원본 100행, `judge` 재료 20개이며 `--batch-size`로 지정한다.
중단된 단계는 같은 명령으로 재개하며 검증된 응답은 재사용한다.
원본·정책·모델이 달라지면 다른 작업 폴더를 사용한다.

기존 응답을 보존하며 이어갈 때는 새 작업 폴더를 사용한다. 원본 ZIP은 기존 다운로드를 사용한다.

```bash
python3 -m data.ingredient_db prepare --work-dir data/ingredient_db/work-continued --archive <원본-ZIP>
python3 -m data.ingredient_db select --work-dir data/ingredient_db/work-continued --reuse-selection data/ingredient_db/work
python3 -m data.ingredient_db judge --work-dir data/ingredient_db/work-continued
```

가져온 표의 스냅샷은 이후 재개에도 유지된다. `select` 재개에는 `--reuse-selection`을 생략할 수 있다.
Grouping 전에 검토할 때는 `select --selection-audit <검토-JSON>`을 사용한다.
검토 파일은 선정 표 해시·정책 해시·검토자·범위·원본별 지적을 담는다.
일반 검토 지적은 보류한다. 사용자가 확정을 위임한 검토는 `mode: "adjudication"`과
`authorization`에 위임 내용을 기록하고 포함·제외를 적용한다. 포함에는 영어 이름도 기록한다.
Gemini의 세 표와 이전 검토는 그대로 보존하며, 검토 결정을 다수결 표로 세지 않는다.
검토 스냅샷은 이후 재개에도 적용하고, 검토 전 Grouping 캐시와 구분한다.
정책을 수정한 검토 확정 실행은 새 폴더에서 시작한다. `--reuse-selection`에는 가장 최근
작업 폴더를 지정한다. 이어받은 표의 이전 출처도 함께 보존하며 완료한 선정 호출은 반복하지 않는다.
포함을 확정한 원본의 판단 근거는 Grouping 입력에도 전달한다.
사용자가 Grouping 결과의 수정을 위임하면 `grouping_decisions`에 원래 목록 해시·수정 전후·
이유·위임 내용을 기록한다. 원래 세 표를 보존하며 수정 목록은 원본 구성원을 빠짐없이 유지한다.
수정된 이름순으로 ID를 다시 부여하고, 제한 판정은 이 목록을 새 작업 폴더에 고정한 뒤 시작한다.
제한 검토에서 근거가 부족한 쌍은 `restriction_decisions`에 원래 값·보류 이유·표 해시를 기록한다.
원래 표와 다수결은 보존한다. 검토로 보류한 값은 `UNKNOWN`이며 최종 관계 행에 넣지 않는다.
이 검토는 새로운 `NEVER` 판정을 만들지 않는다. 최종 집계는 검토 보류를 반영한다.

전송 응답은 선정의 `i/d/n/r`, 제한의 `i/t/d/r` 키와 짧은 근거를 사용하며 검토 기록은 원래 필드명으로 저장한다.

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
실제 판정의 근거와 불일치는 `review/`에서 확인한다.
최종 출력 전 [Astra 검토 기준](docs/policy.md#astra-검토)에 따라 경계 사례를 검토한다.
[선정 검토 사례](docs/selection-review.md)는 새 실행의 정책 준수 확인에 사용한다.
CLI 검사는 파일의 완전성과 재현성을 확인하며, Astra 검토 완료를 자동으로 확인하지 않는다. AI 판정을 사람 승인으로 표시하지 않는다.
코드·문서의 AI 이력 리뷰어는 데이터 각 행의 사실 확인자를 뜻하지 않는다.

## 서버 적용

재료 데이터는 `JSONL 두 파일 → 적재기 → DB → 추천 조회` 순서로 사용한다.
적재기는 `result/`의 두 파일을 읽어 공용 재료와 제한 판정을 DB에 저장한다.
추천 요청은 DB에서 아이의 제한에 맞는 영어 재료명을 조회한다. 서버 시작이나 추천 요청마다
JSONL을 다시 읽지 않으므로 파일 수정만으로 서비스의 재료 목록이 바뀌지 않는다.
파일 검사는 DB에 쓰지 않는다.

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
