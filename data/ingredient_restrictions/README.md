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

재료 **1,593개 × 제한 17개 = 27,081쌍**을 Gemini A/B로 분류한 뒤 GPT-6가 보류 항목을 추가 검토했다.

| 단계 | 결과 |
|---|---:|
| A/B 병합 직후 보류 | 4,271쌍 |
| 원물 확인·식품군·일반 사용 기준으로 추가 해결 | 1,615쌍 |
| 최종 판정 / 보류 | **24,425쌍 / 2,656쌍** |

무가염 원물, 무가당 동물성 재료, 잎채소·버섯·소량 향신료 등은 일반 조리 용도를 가정해 처리했다. 남은 보류는 **혼합·가공품 878쌍, 건조·농축·사용량 문제 232쌍, 자연 성분 차이 1,174쌍, 알레르겐·원료 확인 문제 372쌍**이다.

- **사용할 결과:** [relations-reviewed.json](relations-reviewed.json)
- **개별 수정 이유·가정·보류 사유:** [reviews/decisions.json](reviews/decisions.json)

AI 검토 초안이며 실제 함량 측정이나 식사 안전 판정은 아니다. 기존 A/B 합의 항목 전체를 재검토한 것은 아니다. 일반 식품군 판단은 [CDC](https://www.cdc.gov/salt/reduce-sodium-intake/)와 [Monash](https://www.monashfodmap.com/about-fodmap-and-ibs/frequently-asked-questions/)의 설명을 참고했다.

**DB·서버 LLM 연결은 아직이다.** 보류 관계를 DB에서 제외하려면 서버도 관계 누락을 사용 불가로 처리해야 한다.

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
요청당 재료 10개 × 최대 16제한, 동시 요청 2개다. 전체 A/B 기본 요청은 320회이며 재시도는 별도다.
run에 --dry-run을 붙이면 API 호출 없이 남은 요청 수를 확인한다.
정상 응답은 즉시 저장하고 재개 시 건너뛴다. 오류는 최대 5회 시도하며 계속 실패하면 중단한다.

이전 수치 추정 실행 폴더는 삭제했다. 현재 원본 실행은 build/name-full에 보존한다.
구형 실행 검증 코드는 이전 결과 확인용으로 남아 있다. 새 prepare는 NAME_BASED 작업을 만든다.

## 파일 역할
| 파일 | 역할 |
|---|---|
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
