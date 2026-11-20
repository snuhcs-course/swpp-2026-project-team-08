<!-- AI-generated with GPT-6, 2026-11-20, reviewed by Haechan Jung -->
<!-- Changed: 현재 재료 선정 정책의 검토 사례와 확인 범위 -->

# 재료 선정 검토 사례

목차: [기준 사례](#기준-사례) · [확인 범위](#확인-범위)

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
| 174068 | Dip, salsa con queso, cheese and salsa- medium | INCLUDE | 브랜드·레시피 음식에 해당하지 않는 조미용 딥 |
| 174289 | Hummus, commercial | INCLUDE | 음식에 넣는 일반 조미 재료인 후무스 |
| 171834 | Dip, FRITO'S, bean, original flavor | EXCLUDE | 브랜드 제품 |

단일 원물의 단순 가열과 브랜드 없는 케첩·마요네즈·간장 제품은 제외 사례와 구별한다.
최종 기준은 [판정 정책](policy.md#소스와-드레싱)을 따른다.

## 확인 범위

위 사례는 재료 포함 여부를 확인하는 기준이며, 전체 데이터나 제한 판정의 검증을 대신하지 않는다.
원문은 USDA SR Legacy 2018의 `food.csv`에서 원본 ID로 확인한다.
확정된 이름·포함 여부와 판단 근거는 [원본별 검토 결정](../review/regrouping-decisions.json)을 따른다.
