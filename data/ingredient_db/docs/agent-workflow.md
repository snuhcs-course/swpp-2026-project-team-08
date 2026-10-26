<!-- AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung -->
# 에이전트 실행 안내

[처음으로](../README.md) · [분류 기준](classification-policy.md) · [테스트 설명](../tests/test.md)

## 목차

1. 각 단계에서 하는 일
2. 새로 실행하기
3. 중단된 실행 이어 하기
4. 에이전트 지시문

## 핵심 요약

1. A와 B는 같은 RDA 행과 같은 기준을 보고 각각 판단한다.
2. 코드는 누락·중복·응답 형식을 검사하고, A/B 차이를 별도 목록으로 만든다.
3. 최종 포함 여부와 이름은 A/B 합의와 AI 검토 결정으로 구성한다. DB 적재는 별도 명령이다.

## 각 단계에서 하는 일

경로는 `data/ingredient_db/` 기준이다.

| 단계 | 하는 일 | 담당 파일 | 결과 |
|---|---|---|---|
| 1. 작업 나누기 | 원본을 식품군별 최대 60행씩 나누고 원본·정책 해시 기록 | `code/run_agents.py prepare` | `build/<실행명>/tasks/`, `manifest.json` |
| 2. 지시 전달 | 아래 지시문 + 정책 전문 + 작업 원본을 합침 | `code/agent_prompt.py`의 `build_prompt` | API에 보낼 프롬프트 |
| 3. A/B 판단 | Gemini 호출 후 행 누락·중복·필수 필드 검사 | `code/run_agents.py run`, `code/call_gemini_agent.py` | `submissions/a/`, `submissions/b/` |
| 4. 두 답 비교 | 포함 여부와 한영 이름을 비교하고 반복되는 질문 묶기 | `code/run_agents.py reconcile` | `reconciled/`의 JSON 3개 |
| 5. AI 검토 | 원본과 A/B 이유를 보고 포함·제외·이름·병합 결정 | 검토 모델 | `reviews/sol-review.json` |
| 6. 결과 생성 | 합의 행과 검토 결정을 통합 | `code/build_ingredient_draft.py --review` | 최종 후보 JSON |

### 비교 결과를 읽는 법

- `reconciliation.json`: 원본 3,366행과 A/B 답 전체.
- `human-review.json`: 불일치·보류 원본 행. 영어만 다른 항목은 별도 표시한다.
- `candidate-groups.json`: A/B가 모두 포함으로 판단하고 한영 이름도 같은 후보. **승인된 목록은 아니다.**
- `review-groups.json`: 같은 식품군에서 A/B 결정과 한영 후보가 같은 검토 행을 묶은 질문 목록. 각 원본과 판단 이유를 그대로 보존한다.
- A/B가 동의한 이름이 여러 행에 반복되어도 필수 검토 대상으로 추가하지 않는다. 빈 이름의 보류 행은 원본 이름까지 같아야 함께 묶는다. 묶음 전체가 한 재료라는 뜻은 아니며 원본별 예외를 기록할 수 있다.
- A/B는 같은 모델을 사용하므로 공통 오류가 있을 수 있다. 일치한 포함·제외 항목도 표본 검토한다.

`code/build_ingredient_draft.py`는 `--review` 지정 시 A/B 비교 결과와 AI 검토 결정을 통합한다. `--review`가 없으면 A 응답만 한국어 이름별로 묶은 미검토 초안을 만든다.

## 새로 실행하기

저장소 루트에서 실행한다. 키는 `data/ingredient_db/.env`의 `GEMINI_API_KEY`에 넣는다. 같은 이름의 셸 환경변수가 있으면 셸 값이 우선한다.

### 1. 입력 나누기

```bash
python3 -m data.ingredient_db.code.run_agents prepare --out data/ingredient_db/build/rda-run
```

### 2. A와 B 실행

```bash
python3 -m data.ingredient_db.code.run_agents run \
  --manifest data/ingredient_db/build/rda-run/manifest.json \
  --instructions data/ingredient_db/docs/agent-workflow.md \
  --passes a b \
  --agent-command 'python3 -m data.ingredient_db.code.call_gemini_agent --task {task} --output {output} --instructions {instructions} --policy data/ingredient_db/docs/classification-policy.md --pass {pass}'
```

### 3. 두 답 비교

```bash
python3 -m data.ingredient_db.code.run_agents reconcile \
  --manifest data/ingredient_db/build/rda-run/manifest.json \
  --out data/ingredient_db/build/rda-run/reconciled \
  --review-out data/ingredient_db/build/rda-run/review
```

`--review-out`을 지정하면 질문별 Markdown 검토표도 만든다. 기존 검토 메모를 보호하기 위해 이미 있는 폴더는 덮어쓰지 않는다. 재생성할 때는 새 폴더를 지정한다.

## AI가 대신 검토한 결과로 시험용 데이터 만들기

Sol 검토 파일은 `reviewer_model`, `decisions`를 기록한다. `decisions`에는 검토 대상 원본 코드마다 포함 여부, 한영 이름, 판단 이유가 하나씩 있어야 한다. 합의된 나머지 행은 기존 A/B 결정을 유지한다. 같은 한국어 이름의 영어 표기를 통일할 때는 `name_overrides`에 선택과 이유를 명시한다.

```bash
python3 -m data.ingredient_db.code.build_ingredient_draft \
  --manifest data/ingredient_db/build/gemini-full/manifest.json \
  --review data/ingredient_db/reviews/sol-review.json \
  --out data/ingredient_db/build/reviewed-candidates.json
```

검토 코드가 빠지거나 중복되면 생성을 중단한다. 미완성(`partial:true`) 결정 파일은 거부한다. 결과에는 AI 검토 범위·기존 합의 범위·결정 파일 해시를 따로 남긴다. 영어 이름 충돌이 남은 묶음은 `unresolved_name_groups`로 보존하고 사용 목록에서 제외한다. 이 데이터는 사용 시험용이며 사람 승인으로 표시하지 않는다.

최종 사용 데이터는 `ingredients-reviewed.json`이다. 이름 충돌 결정은 이 파일의 `name_conflict_resolution`에 있으며, 후보 생성 결과에는 검토 모델의 원본 코드별 결정을 별도로 반영한다. 최종 파일을 직접 수정할 때는 대표 이름·원본 코드·이유를 `name_conflict_resolution.decisions`에 기록하며, 원본 코드의 누락·중복과 제한 관계의 재료 이름 일치를 확인한다. 후보 생성 명령은 최종 사용 파일을 덮어쓰지 않는다. 실행 입력·응답은 Git 제외 대상인 `build/`에 있으므로 과거 실행의 정확한 재현에는 해당 실행 폴더가 필요하다.

## 중단된 실행 이어 하기

같은 `run` 명령을 다시 실행하면 검증된 제출물은 건너뛴다. `--passes b`로 B만 실행할 수도 있다. 화면의 `completed`는 **이번 실행에서 새로 마친 작업 수**다.

`--policy`에는 해당 `manifest.json`의 `policy_path` 파일을 사용한다. 기존 `gemini-full` 실행은 `build/gemini-full/classification-policy-used.md` 사본을 사용했다. 현재 문서를 수정해도 그 실행의 기준이 바뀌지는 않는다. 기준이나 지시를 바꿔 재판단하려면 새 실행 폴더를 만든다.

API 일시 오류·시간 초과와 잘못된 응답은 제한된 횟수만 재시도한다. 계속 실패하면 종료하며, 앞서 저장된 정상 결과는 남는다. 자세한 사례는 [테스트 설명](../tests/test.md)을 참고한다.

## 에이전트 지시문

각 에이전트에는 아래 지시, `docs/classification-policy.md` 전문, 해당 `tasks/task-NNN.json`을 제공한다. 정책의 A/E/U 번호는 판단을 설명하는 기준이며 출력 필드가 아니다.

> RDA 원본의 각 행이 조리할 때 선택하는 재료인지 판단해 `INCLUDE`, `EXCLUDE`, `UNRESOLVED` 중 하나만 기록하라. 재료의 종류 번호나 대표 분류는 기록하지 말라. 원본 코드와 행을 모두 유지하라. 완성 요리·간식·음료는 제외하고, 원물과 조리용 가공 재료는 포함하라. 경계 사례는 함께 제공된 정책 문서를 참고하되, 제품 종류·원료·부위·가공·배합 등 결정에 필요한 사실이 원문에 없으면 `UNRESOLVED`로 둬라. `INCLUDE`일 때 사용자에게 보일 짧고 정확한 한국어·영어 이름을 써라. 재료의 대표 이름은 사용자가 장보기와 조리에서 선택하는 단위로 정하라. 품종·산지·등급·도정 상태·겉껍질 유무·단순 가열 상태는 별도 재료를 선택해야 할 이유가 없다면 하나의 이름으로 합쳐라. 원본의 학명이 달라도 그 차이만으로 재료를 분리하지 말고, 학명은 원본 기록에 보존하라. 반면 원료·먹는 부위·가공 형태·명시된 배합이 달라 사용자가 별도로 선택해야 하면 이름을 나눠라. 예를 들어 겉귀리와 쌀귀리의 원물은 모두 `귀리 / Oats`로 정리하고, 오트밀은 가공 형태가 달라 별도 재료로 둔다. 합쳐도 되는지 원문만으로 판단할 수 없으면 `UNRESOLVED`로 기록하라. 다른 작업 파일에 있는 행을 추측해 대표 코드를 지정하지 말라. `EXCLUDE`·`UNRESOLVED`는 두 이름을 비워라. 모든 행에 구체적인 이유와 원본 근거를 남겨라. 확인하지 못한 사실을 없는 것으로 간주하지 말라. 다른 에이전트의 답이나 이전 분류표는 보지 말라. 응답은 지정된 JSON 형식만 출력하라.

`INCLUDE`일 때만 한영 이름을 쓴다. `EXCLUDE`·`UNRESOLVED`의 이름은 비운다. 모든 행은 원본 코드, 결정, 두 이름, 이유, 근거를 반환한다. 대표 이름과 원본 코드 묶음은 검토 결정으로 정하고 DB ID는 적재 시 관리한다.
