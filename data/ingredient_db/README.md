<!-- AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung -->
# Ingredient DB 작업 안내

## 목차

1. 검토 결과와 사용 방법
2. 파일 위치와 역할
3. 실행·테스트할 때

## 핵심 요약

1. 실제 사용 시험에는 [ingredients-reviewed.json](ingredients-reviewed.json)의 `ingredients` 1,613개를 사용한다.
2. 원본 3,366행의 선정 상태는 포함 2,752행·제외 586행·보류 28행이다.
3. 재료마다 한국어 이름·영어 이름·RDA 원본 코드가 있으며, 검토 근거는 별도 JSON에 있다.

## 검토 결과와 사용 방법

[Sol 검토 기록](reviews/sol-review.json)은 원본 1,077행의 포함 여부·한영 이름·판단 이유를 담는다. 나머지 2,289행은 A/B 합의 대상이다. 검토 표기는 **GPT-6 Sol / AI 검토**다.

`ingredients-reviewed.json`의 `ingredients`는 `kor_name`, `eng_name`, `source_codes`를 제공한다. DB ID는 적재 시 관리한다. `ai_reviewed_source_codes`는 AI 검토 대상 원본 코드이며, `review`는 모델·검토 범위·결정 파일 해시다.

`name_conflict_resolution`은 한영 이름 충돌 19묶음(86행)에 대응하는 재료 20개의 이름과 원본 코드별 결정이다. 처리 상태 차이는 대표 이름으로 통합하며 새우류와 바닷가재류는 별도 재료다. `unresolved`는 판단 보류 28행의 코드와 이유다.

사용 중 검색되지 않거나 이름이 어색한 사례는 원본 코드와 함께 검토한다.

## 제한 관계 작업

[restrictions.json](restrictions.json)은 제한 ID 17개를 정의한다. 분류 기준은 [이름 기반 판정 기준](docs/restriction-policy.md)이다. [relations-reviewed.json](../ingredient_restrictions/relations-reviewed.json)은 27,421쌍 중 확정 판정 24,714쌍과 보류 2,707쌍을 담는다. 로컬 DB에는 확정 판정만 저장하며, 보류 쌍은 추천에서 허용되지 않는다.

## 파일 위치와 역할

| 위치 | 역할 |
|---|---|
| [restrictions.json](restrictions.json) | 제한 17개의 ID·이름·타입 |
| [docs/restriction-policy.md](docs/restriction-policy.md) | 판정 의미와 제한별 기준 |
| [ingredients-reviewed.json](ingredients-reviewed.json) | **사용 시험 진입점**. Sol 검토와 이름 충돌 해결을 반영한 1,613개 재료 |
| [reviews/sol-review.json](reviews/sol-review.json) | GPT-6 Sol의 코드별 재검토 결정과 이유 |
| [docs/classification-policy.md](docs/classification-policy.md) | 어떤 항목을 포함하고 어떤 이름으로 합칠지에 대한 기준 |
| [docs/agent-workflow.md](docs/agent-workflow.md) | 단계별 처리 내용, 담당 코드, 실행 명령과 실제 에이전트 지시 |
| [rda-source.json](rda-source.json) | RDA 10.4 원본 3,366행의 코드·이름·학명·식품군 |
| [code/run_agents.py](code/run_agents.py) | **실행 진입점**: 작업 나누기·A/B 실행·비교 |
| [code/call_gemini_agent.py](code/call_gemini_agent.py) | Gemini 키 읽기·API 호출·오류 재시도 |
| [code/agent_prompt.py](code/agent_prompt.py) | 정책·지시문·RDA 행을 Gemini 프롬프트로 구성 |
| [code/build_ingredient_draft.py](code/build_ingredient_draft.py) | Sol 검토 결정과 A/B 합의 행으로 시험용 JSON 생성 |
| [tests/test.md](tests/test.md) | 테스트의 입력·기대 동작·필요성 설명 |
| `tests/test_*.py` | 가짜 입력과 API 응답으로 실행하는 자동 테스트 |
| `build/` | 작업 입력·A/B 원문·비교 결과·실행 당시 정책. Git 제외 |
| `.env` | 개인 Gemini API 키. Git 제외 |

원본 출처: [농촌진흥청 국가표준식품성분 DB](https://koreanfood.rda.go.kr/kfi/notice/list). 원본 행은 `rda-source.json`에 보존하고 실행 당시 원본·정책 해시는 `build/<실행명>/manifest.json`에 기록한다.

## 실행·테스트할 때

새 작업과 중단 후 재개 명령은 [실행 안내](docs/agent-workflow.md)에 있다. 저장소 루트에서 테스트하려면:

```bash
python3 -m unittest discover -s data/ingredient_db/tests -p 'test_*.py' -v
```

테스트는 API를 실제로 호출하지 않는다. 재료 이름이나 판단의 사실 여부는 사람이 검토한다.

제한 관계 분류 실행은 별도 [ingredient_restrictions 워크플로](../ingredient_restrictions/README.md)에서 진행한다. 이 폴더의 재료 생성 실행과 작업·결과 폴더를 공유하지 않는다.
