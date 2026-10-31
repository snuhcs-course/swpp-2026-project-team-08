<!-- AI-generated with GPT-6, 2026-10-31, reviewed by Haechan Jung -->

# coverage.py 커버리지

목차: [실행과 보고서](#실행과-보고서) · [측정 설정](#측정-설정) · [지표 읽기](#지표-읽기)

## 실행과 보고서

coverage.py는 테스트가 앱 코드를 얼마나 실행했는지 측정한다. 테스트 구성과 작성 기준은 [test.md](test.md)를 따른다.
아래 명령은 모두 `server/`에서 실행한다.

전체 테스트를 한 번 실행하고 계층별 커버리지와 테스트 실행 결과를 남긴다.
보고서는 Git에 저장하지 않는다. 잠금 파일에 고정한 의존성을 설치한 뒤 실행한다.

```sh
uv sync --frozen
uv run python scripts/coverage_report.py
```

`uv run pytest`는 테스트만 실행한다. 커버리지 스크립트는 `tests/` 전체를 한 번 측정한다.

### 측정 순서

1. [실행 스크립트](../scripts/coverage_report.py)가 coverage.py를 켜고 pytest로 전체 테스트를 실행한다.
2. coverage.py가 실행된 줄과 분기 이동을 기록하고, 측정 대상 코드와 비교해 실행 비율을 계산한다.
   제외 범위를 뺀 측정 대상 중 테스트가 불러오지 않은 파일도 미실행으로 포함한다.
3. 스크립트가 결과를 계층별로 합산해 `layers.html`을 만들고, 테스트 출력은 `tests.log`에 저장한다.


### 보고서 위치

| 위치 (`server/` 기준) | 내용 |
|---|---|
| `coverage/layers.html` | 계층별 Lines·Branches, 전체 합계, 테스트 결과 요약, 실행 날짜·커밋·버전·명령 |
| `coverage/tests.log` | 테스트별 실행 결과와 오류·건너뜀 사유를 담은 전체 로그 |

## 측정 설정

설정 파일은 [pyproject.toml](../pyproject.toml)의 `tool.coverage` 항목이다.
실행 스크립트가 `server/`에서 coverage.py를 호출하면 이 설정을 읽는다.
개발 의존성은 `coverage>=7.17.0`이며 설치 버전은 `uv.lock`으로 고정한다.

| 설정 | 현재 값 | 의미 |
|---|---|---|
| `run.branch` | `true` | 줄과 분기 이동을 함께 측정한다. |
| `run.source` | `["app"]` | `app/`을 측정하며 불러오지 않은 대상 파일도 커버리지 계산에 포함한다. |
| `run.omit` | 아래 파일 제외 표의 네 경로 | 해당 파일을 측정과 보고서 집계에서 제외한다. |
| `run.relative_files` | `true` | 측정 데이터의 파일 경로를 상대 경로로 저장한다. |
| `report.include_namespace_packages` | `true` | 미실행 파일을 찾을 때 `__init__.py` 없는 폴더도 포함한다. |
| `report.precision` | `2` | 기본 보고서의 퍼센트를 소수 둘째 자리까지 표시한다. |
| `report.show_missing` | `true` | 텍스트 보고서를 출력할 때 미실행 위치를 표시한다. |
| `report.exclude_lines` | `[]` | 기본 줄 제외 규칙을 빈 목록으로 대체한다. `pragma: no cover`로 줄을 제외하지 않는다. |
| `--data-file` | 임시 폴더의 `.coverage` | 실행 기록을 임시 저장하고 보고서 생성 후 삭제한다. |
| `json -o` | `-` | JSON을 파일 대신 표준 출력으로 전달한다. 스크립트가 메모리에서 집계한다. |

참고: `app/을 측정하며 불러오지 않은 대상 파일도 커버리지 계산에 포함한다.`라는 말은 명시적으로 제외한 파일들에는 해당되지 않습니다.

### 제외 범위

| 종류 | 범위·처리 |
|---|---|
| 측정 대상 밖의 파일 | `tests/`, `scripts/`, `migrations/`, 외부 패키지 등 `app/` 밖의 코드 |
| 파일 제외 | 아래 네 파일을 제외한다. 그 밖의 DTO·모델·실행 코드는 포함한다. |
| 줄 제외 | 빈 줄·주석·docstring은 실행 가능한 문장 줄로 세지 않는다. 별도의 줄 제외 정규식은 적용하지 않는다. |
| 분기 예외 | coverage.py가 인식하는 구조상 불필요한 분기와 기본 부분 분기 규칙은 적용한다. `exclude_lines`와 별개다. |

| 제외 파일 (`server/` 기준) | 내용 |
|---|---|
| `app/features/onboarding/consent_version.py` | 동의 문서 버전 상수 |
| `app/models/food_enums.py` | 음식 조리 방식 열거값 |
| `app/features/meals/input_dto.py` | 별도 검증·변환 함수가 없는 입력 dataclass |
| `app/features/suggestions/mock_profile.py` | 고정 제한 조건 데이터 |

위 파일들을 커버리지 계산에 포함하지 않으나, 이는 테스트하지 않겠다는 뜻은 아니다. 필요한 경우 테스트하여야 한다.

## 지표 읽기

각 지표는 `한 번 이상 실행한 항목 수 / 측정 대상 항목 수 × 100`으로 계산한다.

| 지표 | 의미 |
|---|---|
| Lines | 실행 가능한 Python 문장 줄 중 실행된 줄의 비율. 파일의 물리적 줄 수와 다르다. |
| Branches | 한 줄에서 여러 다음 줄로 갈 수 있는 분기에서, 측정 대상 목적지 중 실제 이동한 목적지의 비율 |

계층별 HTML은 Lines와 Branches를 각각 표시한다. 별도의 Functions 비율은 집계하지 않는다.

| 계층 | 책임 | 파일 기준 (`app/` 기준) |
|---|---|---|
| HTTP API | 앱 초기화, 라우팅, HTTP 오류 응답, 요청 의존성 | `main.py`, `api/*.py`, `features/*/router.py`, `features/*/dependencies.py` |
| Schemas and serialization | 요청·응답 형식과 검증, 서비스 입력 데이터, 응답 변환 | `features/*/dto.py`, `features/*/*_dto.py`, `features/*/serialization.py` |
| Services and rules | 유스케이스 실행, 업무 판단·검증 | `features/*/service.py`, `features/*/validation.py` |
| Recommendation workflow | 추천 생성 진입점, 그래프·노드·도구·LLM 연결과 워크플로 전용 상태·스키마·프롬프트 | `features/*/generator.py`, `features/*/workflow/*.py` |
| Database and persistence | DB 모델, 세션·트랜잭션, 조회·저장 보조 함수 | `models/*.py`, `core/database.py`, `features/*/queries.py` |
| Core and security | 설정, 공통 오류·시각, 암호·토큰, 인증 코드·동의 버전, 패키지 초기화 | `core/{config,errors,timezone}.py`, `features/*/{security,codes,consent_version}.py`, `__init__.py`, `core/__init__.py`, `features/__init__.py`, `features/*/__init__.py` |
| Others | 기타 | 기존 계층의 파일 패턴에 일치하지 않는 모든 측정 대상 파일 |

### 측정 범위

계층 분류는 `run.omit`으로 제외한 네 파일을 뺀 뒤 적용한다.
`meals/input_dto.py`, `models/food_enums.py`, `onboarding/consent_version.py`는 계층 패턴에 맞더라도 집계하지 않는다.
`suggestions/mock_profile.py`도 Others와 전체 합계에서 제외한다.
`suggestions/ingredients.py`와 `meals/ingredient_queries.py`는 Others에 포함한다.
기존 계층에 속하지 않는 새 파일도 자동으로 Others에 포함하고 전체 커버리지에 합산한다.
HTML 보고서의 `Files in Others`에 해당 파일의 전체 목록을 `server/` 기준 경로로 표시한다.
워크플로 전용 스키마·상태·프롬프트는 Recommendation workflow에 포함한다.

스크립트의 `LAYER_PATTERNS`에 정의한 공통 파일명·폴더 패턴으로 분류하고, 일치하는 패턴이 없으면 Others에 배정한다.
둘 이상의 계층에 일치하면 중복 집계를 막기 위해 보고서 생성이 실패한다.

근거: [coverage.py 작동 방식](https://coverage.readthedocs.io/en/latest/howitworks.html),
[분기 측정](https://coverage.readthedocs.io/en/latest/branch.html),
[측정 설정](https://coverage.readthedocs.io/en/latest/config.html),
[FastAPI 앱 구성](https://fastapi.tiangolo.com/tutorial/bigger-applications/),
[공식 Full Stack 템플릿](https://github.com/fastapi/full-stack-fastapi-template/tree/master/backend/app).
