<!-- AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung -->
<!-- Changed: Astra 정책 검토의 경계 사례와 확인 범위 기록 -->

# 재료 선정 검토 사례

목차: [기준 사례](#기준-사례) · [검토 범위](#검토-범위)

레시피로 배합한 음식은 소스·육수·빵·면이라는 이유로 재료에 포함하지 않는다.
브랜드 제외와 레시피 음식 제외는 모든 포함 종류보다 우선한다.
아래 사례는 재실행 결과를 확인하는 기준이며, Gemini의 실제 판정 결과가 아니다.

## 기준 사례

| 원본 ID | USDA 원문 | 기대 판정 | 근거 |
|---|---|---|---|
| 172200 | Cheese sauce, prepared from recipe | EXCLUDE | 레시피로 만든 복합 음식 |
| 172883 | Soup, stock, beef, home-prepared | EXCLUDE | 집에서 배합한 육수 |
| 174927 | Bread, white, prepared from recipe, made with low fat (2%) milk | EXCLUDE | 레시피로 만든 빵 |
| 168901 | Pasta, homemade, made with egg, cooked | EXCLUDE | 수제 복합 면 |
| 172454 | Hummus, home prepared | EXCLUDE | 집에서 배합한 음식 |
| 174068 | Dip, salsa con queso, cheese and salsa- medium | UNKNOWN | 허용 조리 재료인지 불명확한 딥 |
| 174289 | Hummus, commercial | UNKNOWN | 시판이라는 사실만으로 허용 종류를 확정하지 않음 |
| 171834 | Dip, FRITO'S, bean, original flavor | EXCLUDE | 브랜드 제품 |

단일 원물의 단순 가열과 브랜드 없는 케첩·마요네즈·간장 제품은 제외 사례와 구별한다.
최종 기준은 [판정 정책](policy.md#소스와-드레싱)을 따른다.

## 검토 범위

2026-11-11의 GPT-6 Astra 검토는 정책·선정 프롬프트와 위 원본의 경계를 다룬다.
전체 데이터나 제한 판정 결과에 대한 검토 완료를 의미하지 않는다.
원문은 USDA SR Legacy 2018의 `food.csv`에서 원본 ID로 확인한다.

근거: 레시피 치즈 소스 제외는 사용자 요구사항이다. Astra 검토에서 같은 경계가
수제 육수·레시피 빵·수제 면에도 적용되며 기존 포함 규칙과 충돌함을 확인했다.
정책 버전 2는 복합 레시피 제외를 모든 포함 규칙보다 우선한다.
기존 `high` 실행의 응답은 정책 버전 2를 검증한 결과로 사용하지 않는다.
