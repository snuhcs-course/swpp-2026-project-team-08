<!-- AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung -->
<!-- Changed: 최종 데이터 집계와 검토 결정·검증 근거 안내 -->

# 재료 데이터 검토 결과

목차: [결과](#결과) · [검토 결정](#검토-결정) · [검증](#검증)

최종 목록은 영어 재료 2,408개와 제한 관계 44,582개다.
근거가 부족하거나 값과 이유가 충돌하는 1,034쌍은 원래 표를 보존하고 별도 검토로 보류한다.
기존 다수결 보류 136쌍을 더한 1,170쌍은 관계 행을 만들지 않는다.

## 결과

| 항목 | 수 |
|---|---:|
| USDA 원본 | 7,793 |
| 최종 재료에 대응하는 원본 | 3,207 |
| 제외 원본 | 2,942 |
| 선정·이름·구성원 보류 원본 | 1,644 |
| 재료별 제한 판정 | 45,752 |
| 독립 판정 표 | 137,256 |
| 성공 요청 | 363 |

최종 파일은 [재료](../result/ingredients.jsonl)와 [제한 관계](../result/ingredients_restrictions.jsonl)다.
[집계·파일 해시](summary.json)를 먼저 보고, 필요한 쌍만 [전체 판정 기록](catalog.json)에서 확인한다.
다수결의 2:1 불일치는 1,511쌍, 세 판단이 모두 다른 경우는 29쌍이다.
이 수는 검토 보류 수와 별개이며 서로 겹칠 수 있다.

## 검토 결정

- [선정 결정](selection-decisions.json)은 검토 대상 72개를 포함 49개·제외 23개로 정한다.
- [이름·묶음 결정](grouping-decisions.json)은 후보 9개의 명시 배합을 복원하고 소금 첨가 여부를 분리한다.
- [제한 결정](restriction-decisions.json)은 179개 재료의 1,034쌍을 `UNKNOWN`으로 보류한다.
  [대조 근거](restriction-evidence.json)는 원문·세 표·이유와 검토 범위를 담는다.

원문에 없는 전체 배합·정제 수준·단백질 잔류를 추정하지 않는다.
글루텐프리 표기만으로 밀 알레르기 판정을 확정하지 않는다.
판정값과 이유가 반대인 경우도 해당 쌍을 보류한다. 새로운 `NEVER` 판정을 추가하지 않는다.
복합 소스의 부재 근거 부족은 해당 원료가 실제 들어 있다는 뜻이 아니다.

근거: [FDA 글루텐프리 표시 기준](https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/questions-and-answers-gluten-free-food-labeling-final-rule)은
글루텐을 제거한 밀 유래 원료를 구별한다.
[Health Canada 정제유 설명](https://www.canada.ca/en/health-canada/services/food-nutrition/food-labelling/allergen-labelling/position-highly-refined-oils-derived-food-allergen-sources.html)은
원료 유래와 정제 후 단백질 잔류를 구별한다. 개별 USDA 식품의 공정 확인을 대신하지 않는다.

검토 범위는 전체 판정 검색과 위험 후보·표본의 원문 대조다. 모든 판정의 독립적 사실 확인이나
개별 제품의 알레르기 안전 보증은 아니다. 명칭 검색 후보 수를 확정 오류 수로 세지 않는다.
성공 응답 363개와 원래 선정·Grouping·제한 표는 수정하지 않는다.

## 검증

파이프라인 테스트 85개와 서버 테스트 348개를 통과한다.
JSONL 재현 검사와 적재기의 `--check`는 ID·영어 이름 중복, 고아 관계, enum,
19개 판정의 완전성 및 검토 보류 행 누락을 확인한다. Ruff·포맷·공백 검사를 적용한다.
서버 테스트는 영어 추천, 반복 교체, 실패 복구, 기존 목록 제거와 사용자 기록 보존을 포함한다.
실제 DB 교체와 배포는 수행하지 않는다. 적용 절차는 [서버 적용](../README.md#서버-적용)에 둔다.
