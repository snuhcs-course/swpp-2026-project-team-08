# Meal Logging

## Goal

보호자가 식사를 빠르게 기록할 수 있다.

## User Flow

1. 사용자가 Add Meal을 선택한다.
2. 식사 사진을 선택한다.
3. 인식된 음식 목록을 확인한다.
4. 잘못된 음식 정보를 수정한다.
5. 저장한다.

## Requirements

### R1 — Create meal

사용자는 새로운 Meal을 생성할 수 있어야 한다.

### R2 — Add food

Meal에는 하나 이상의 FoodItem을 추가할 수 있다.

### R3 — Edit recognition result

자동으로 인식된 FoodItem은 저장 전에 수정할 수 있다.

## Edge Cases

- 이미지 인식 실패
- 네트워크 없음
- 음식이 인식되지 않음
- 사용자가 중간에 화면을 종료함

## Acceptance Criteria

Given 사용자가 식사 사진을 선택했고
When 음식 인식이 완료되면
Then 인식된 FoodItem 목록이 표시된다.

Given 인식이 실패했고
When 결과 화면이 표시되면
Then 사용자가 수동으로 FoodItem을 추가할 수 있다.