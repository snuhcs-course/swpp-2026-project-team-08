<!-- AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung -->
# 재료 제한 분류

## 목차
1. 검토 결과 v1
2. 기준과 실행
3. 파일 역할
4. 서버 오류 자동 재개

## 핵심 요약
1. 이름과 원본 이름의 원료·가공 상태로 17개 제한을 분류한다.
2. 사용량·영양함량은 추정하지 않는다. 필요한 정보가 없으면 보류한다.
3. A/B 독립 판정 후 일치 여부를 병합한다. 복합 글루텐·카제인은 코드로 도출한다.

## 검토 결과 v1

대상은 **재료 1,613개 × 제한 17개 = 27,421쌍**이다.

| 판정 | 건수 | DB 저장 |
|---|---:|---|
| NEVER | 23,078 | 저장 |
| ALWAYS | 1,079 | 저장 |
| DEPENDS_ON_PRODUCT | 557 | 저장 |
| 보류 | 2,707 | 미저장 |

- **사용할 결과:** [relations-reviewed.json](relations-reviewed.json)
- **검토 근거·가정·보류 사유:** [reviews/decisions.json](reviews/decisions.json)

판정 출처는 Gemini A/B 독립 분류와 GPT-6의 보류 항목 검토다. 일부 판정은 무가염 원물·무가당 동물성 재료·잎채소·버섯·소량 향신료의 일반 조리 용도를 가정한다. AI 검토 결과는 실제 함량 측정이나 개별 식사의 안전성을 보증하지 않는다. 일반 식품군 판단의 참고 자료는 [CDC](https://www.cdc.gov/salt/reduce-sodium-intake/)와 [Monash](https://www.monashfodmap.com/about-fodmap-and-ibs/frequently-asked-questions/)다.

문어·미더덕의 저과당·케톤 4쌍은 정책 1.6 §4.1에 필요한 함량·섭취량 자료가 없어 보류 상태다. 각 보류 행의 `reason`은 확정할 수 없는 이유를 설명한다.

**DB·서버 연결:** `ingredients.name`은 한국어 이름, `eng_name`은 영어 이름이다. `restrictions`에는 고정 제한, `ingredient_restrictions`에는 확정 판정 24,714쌍을 저장한다. 보류 2,707쌍은 관계 행이 없다.

추천의 제한 목록은 `mock_profile.py`의 고정값이다. **그 제한 모두에 NEVER가 있는 재료만** DB 검색·최종 검증에서 허용하며 ALWAYS·제품별·행 없음은 제외한다. 실제 사용자 프로필·온보딩 제한값은 추천에 연결되어 있지 않다.

### 판정 방향

17개 제한 모두 `relation`은 **“제한에 걸리는가”**다. 이름이 긍정형이어도 식단 적합 여부를 저장한 값이 아니므로 반전하지 않는다.

| 예시 | 저장된 판정 | 추천 |
|---|---|---|
| 강력밀가루 × `gluten-free` | ALWAYS: 글루텐 제한에 걸림 | 제외 |
| 각설탕 × `no-added-sugar` / `ketogenic` | ALWAYS: 해당 식단의 제한에 걸림 | 제외 |
| 가는소금 × `gluten-free` | NEVER: 글루텐 제한에 걸리지 않음 | 해당 검사 통과 |

### 로컬 DB 반영

```bash
cd server
uv run alembic upgrade head
uv run python ../data/ingredient_restrictions/import_to_db.py              # 파일 검증만
uv run python ../data/ingredient_restrictions/import_to_db.py --apply-local # 로컬 DB 적재
```

서버의 `.env` DB 설정을 사용한다. 마이그레이션은 `0015_ingredient_restrictions`이며 데이터 적재와 별도다. 가져오기는 기존 한국어 이름의 ID를 보존하고 새 이름만 추가한다. 같은 데이터로 다시 실행해도 중복되지 않으며, 보류로 바뀐 쌍의 이전 판정은 제거한다. 기존 식사·사용자 데이터와 대상 밖 재료는 유지한다. 영어 이름이 겹치면 그 영어 별칭은 추천 검색에서 제외한다. 판정 근거는 `relations-reviewed.json`에 보존한다.

로컬 DB의 확정 판정 24,714쌍은 결과 파일과 일치하며 보류 2,707쌍은 미적재 상태다. 추천 테스트는 가짜 LLM을 사용해 NEVER 저장과 보류 거절을 검사한다.

### 운영 DB 반영

운영 이미지는 최종 재료·제한·판정 JSON과 적재 CLI를 포함한다. 배포 스크립트는 마이그레이션 → `python -m data.ingredient_restrictions.import_to_db --apply-production` → 컨테이너 교체 순서로 실행한다. 적재 실패 시 기존 컨테이너를 유지한다.

`--apply-production`은 `ENVIRONMENT=production`에서만 허용하며 서버 환경변수로 접속한다. 기본 실행은 파일 검증만 수행한다. 적재 범위는 재료 카탈로그와 해당 제한 관계이며 보류 쌍의 기존 관계는 제거한다. 운영 실행 절차는 [배포 가이드](../../server/docs/deploy.md)를 따른다.

## 기준과 실행
정책은 `../ingredient_db/docs/restriction-policy.md`의 1.6 버전이다.
모든 응답은 ingredient_key, restriction_id, relation, review_status, reason, evidence_ids만 사용한다.
상태는 DECIDED 또는 UNRESOLVED다. nutrition_estimate는 허용하지 않는다.
이름 기반 NEVER는 실제 식사의 섭취 허용량을 보장하지 않는다.

```bash
python3 -m data.ingredient_restrictions.run_workflow prepare --out data/ingredient_restrictions/build/new-run
python3 -m data.ingredient_restrictions.run_workflow run --run-dir data/ingredient_restrictions/build/new-run --batch-size 10 --workers 2
python3 -m data.ingredient_restrictions.run_workflow reconcile --run-dir data/ingredient_restrictions/build/new-run
```

키는 `data/ingredient_db/.env`의 GEMINI_API_KEY를 읽는다. 기본 모델은 gemini-3.5-flash-lite다.
요청당 재료 10개 × 최대 16제한, 동시 요청 2개다. 전체 1,613개 재료의 A/B 기본 요청은 324회이며 재시도는 별도다.
run에 --dry-run을 붙이면 API 호출 없이 남은 요청 수를 확인한다.
정상 응답은 즉시 저장하고 재개 시 건너뛴다. 오류는 최대 5회 시도하며 계속 실패하면 중단한다.

실행 원본은 build/name-full과 build/name-conflicts-20261024에 있다.
수치 기반 응답 검증 코드는 구형 결과 호환성 확인용이다. prepare는 NAME_BASED 작업을 만든다.

## 파일 역할
| 파일 | 역할 |
|---|---|
| import_to_db.py | 검토 파일 검증 및 로컬·운영 DB 적재 |
| run_workflow.py | 준비·실행·병합 CLI와 응답 검증 |
| batch_runner.py | 미완료 쌍 묶기·병렬 요청·응답 저장·재개 |
| prompt.md | 모델의 판단 지시 |
| tests/test_workflow.py | 검증·병합·재개 테스트 |
| tests/test.md | 테스트 사례 설명 |
| relations-reviewed.json | 최신 전체 AI 검토 결과 |
| reviews/decisions.json | 통합 수정 이력과 보류 이유 |
| run_background.py | 503 자동 재개와 완료 후 병합 |
| build/ | 입력 사본·응답·병합 결과, Git 제외 |

## 서버 오류 자동 재개

`python3 -m data.ingredient_restrictions.run_background --run-dir data/ingredient_restrictions/build/name-full`

run_background.py는 분류 후 병합을 실행한다. API 내부 재시도 후에도 HTTP 503이면 60초→120초→240초→최대 300초 간격으로 계속 재개한다. 저장된 쌍은 재호출하지 않는다. 503 이외의 오류는 중단한다.
진행 로그는 latest-attempt.log, 완료한 실행 기록은 run.log, 실행·대기·완료·실패 상태는 status.json에서 확인한다.
