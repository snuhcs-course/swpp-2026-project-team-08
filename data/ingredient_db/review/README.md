<!-- AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung -->
<!-- Changed: 최종 데이터 집계와 검토 결정·검증 근거 안내 -->

# 재료 데이터 검토 결과

목차: [결과](#결과) · [검토 결정](#검토-결정) · [검증](#검증)

최종 목록은 영어 재료 1,168개와 제한 관계 21,806개다.
근거가 부족하거나 값과 이유가 충돌하는 346쌍은 원래 표를 보존하고 별도 검토로 보류한다.
다수결 보류 40쌍을 더한 386쌍은 관계 행을 만들지 않는다.

## 결과

| 항목 | 수 |
|---|---:|
| USDA 원본 | 7,793 |
| 최종 재료에 대응하는 원본 | 4,835 |
| 제외 원본 | 2,957 |
| 이름·형태 보류 원본 | 1 |
| 재료별 제한 판정 | 22,192 |
| 독립 판정 표 | 66,576 |
| 새 제한 성공 요청 | 141 |
| 이전 제한 응답을 재사용한 재료 | 234 |

최종 파일은 [재료](../result/ingredients.jsonl)와 [제한 관계](../result/ingredients_restrictions.jsonl)다.
[집계·파일 해시](summary.json)를 먼저 보고, 필요한 쌍만 [전체 판정 기록](catalog.json)에서 확인한다.
다수결의 2:1 불일치는 773쌍, 세 판단이 모두 다른 경우는 10쌍이다.
이 수는 검토 보류 수와 별개이며 서로 겹칠 수 있다.

## 검토 결정

- [선정 기록](selection-review.md)은 원본 선정과 Grouping 입력을 구별한다.
- [전체 Grouping 검토](regrouping.md)는 기본 재료군의 과도한 통합·이름 중복을 정리한다.
  팬케이크 건조 믹스 6개는 `Pancake mix`로 합친다. 원문이 건조 바나나와 바나나 가루를
  함께 나타내는 `173945`는 임의로 한 형태를 선택하지 않고 보류한다.
- [제한 결정](restriction-decisions.json)은 95개 재료의 346쌍을 `UNKNOWN`으로 보류한다.
  [대조 근거](restriction-evidence.json)는 해당 원문·세 표·이유와 검토 범위를 담는다.

주요 보류는 판정값·함유 근거의 반전, 첨가용액·육수·기름의 원료 미상,
복합 소스의 배합 부재 단정, 전통 레시피를 모든 제품의 필수 성분으로 본 판단이다.
정책상 견과·씨앗 제한에서 제외하는 땅콩에 해당 제한을 적용한 경우도 보류한다.
새로운 `NEVER` 판정은 추가하지 않는다. 알 수 없는 배합은 실제 함유의 증거로 취급하지 않는다.

근거: [FDA 글루텐프리 표시 기준](https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/questions-and-answers-gluten-free-food-labeling-final-rule)은
글루텐을 제거한 밀 유래 원료를 구별한다.
[Health Canada 정제유 설명](https://www.canada.ca/en/health-canada/services/food-nutrition/food-labelling/allergen-labelling/position-highly-refined-oils-derived-food-allergen-sources.html)은
원료 유래와 정제 후 단백질 잔류를 구별한다.
[FDA 알레르겐 표시 FAQ](https://www.fda.gov/food/food-allergensgluten-free-guidance-documents-regulatory-information/frequently-asked-questions-food-allergen-labeling-guidance-industry)는
코코넛을 주요 알레르겐 표시 목록에서 제외한다. 표시 의무 면제만으로 이 자료의 `NEVER`를 확정하지 않는다.

검토 범위는 전체 판정의 구조·근거 문구 검색과 위험 후보의 원문 대조다.
모든 판정의 독립적 사실 확인이나 개별 제품의 알레르기 안전 보증은 아니다.
단순 교차접촉·사료·원물에 대한 가상의 첨가는 보류 근거로 삼지 않는다.
기존 선정·Grouping·제한 표와 성공 요청 캐시는 수정하지 않는다.
이름과 전체 원본 집합이 같은 재료만 이전 제한 응답을 재사용하며, 이전 정책·ID·근거도 보존한다.

## 검증

파이프라인 테스트 98개와 서버 테스트 348개, Ruff·포맷·공백 검사를 적용한다.
JSONL 재현 검사와 적재기의 `--check`는 ID·영어 이름 중복, 고아 관계, enum,
19개 판정의 완전성과 검토 보류 행 누락을 확인한다.
서버 테스트는 영어 추천, 반복 교체, 실패 복구, 기존 목록 제거와 사용자 기록 보존을 포함한다.
실제 DB 교체와 배포는 수행하지 않는다. 적용 절차는 [서버 적용](../README.md#서버-적용)에 둔다.
