// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 홈 추천 대상과 표시 조건을 입력·기대값 표로 검증

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { mealResponse } = require('../../fixtures/server-meal.cjs');
const { suggestionResponse } = require('../../fixtures/server-suggestion.cjs');
const { toMealDetail } = require('../../../src/data/dto/mealDto.ts');
const { toSuggestion } = require('../../../src/data/dto/suggestionDto.ts');
const {
  getSuggestionTargetFoodIds, shouldShowSuggestionMeal,
} = require('../../../src/features/home/rules.ts');

// 결과 배열의 순서대로 음식 ID를 1, 2, 3, ...으로 지정한다.
function mealWithOutcomes(outcomes) {
  const response = mealResponse();
  return toMealDetail({
    ...response,
    foods: outcomes.map((outcome, index) => ({
      ...response.foods[0], id: String(index + 1), outcome,
    })),
  });
}

function suggestionsFrom(records) {
  const base = toSuggestion(suggestionResponse({ meal_id: '10' }));
  return records.map((record, index) => ({ ...base, id: String(31 + index), ...record }));
}

// getSuggestionTargetFoodIds 테스트 케이스
const targetCases = [
  { title: '식후 리뷰 없음: 대상 없음', outcomes: [null], targetIds: [] },
  { title: '음식 없음: 대상 없음', outcomes: [], targetIds: [] },
  { title: 'Eaten: 추천 대상', outcomes: ['EATEN'], targetIds: ['1'] },
  { title: 'Tasted: 추천 대상', outcomes: ['TASTED'], targetIds: ['1'] },
  { title: 'Untouched: 추천 대상', outcomes: ['UNTOUCHED'], targetIds: ['1'] },
  { title: 'Unclear: 추천 대상', outcomes: ['UNCLEAR'], targetIds: ['1'] },
  {
    title: '여러 결과가 섞인 식사: 미작성 음식만 제외',
    outcomes: ['EATEN', null, 'TASTED', 'UNTOUCHED', 'UNCLEAR'],
    targetIds: ['1', '3', '4', '5'],
  },
];

// shouldShowSuggestionMeal 테스트 케이스
const visibilityCases = [
  {
    title: '식후 리뷰 없음: 숨김',
    outcomes: [null], suggestions: [], visible: false,
  },
  {
    title: '식후 리뷰 없음 + 과거 미처리 추천: 숨김',
    outcomes: [null], suggestions: [{ foodId: '1', status: 'pending' }], visible: false,
  },
  {
    title: '음식 삭제 후 빈 식사 재조회: 숨김',
    outcomes: [], suggestions: [{ foodId: '1', status: 'pending' }], visible: false,
  },
  {
    title: '추천 대상 있음 + 생성된 추천 없음: 표시',
    outcomes: ['TASTED'], suggestions: [], visible: true,
  },
  {
    title: '모두 Eaten + 생성된 추천 없음: 표시',
    outcomes: ['EATEN', 'EATEN'], suggestions: [], visible: true,
  },
  {
    title: '모두 Eaten + 미처리 추천 있음: 표시',
    outcomes: ['EATEN', 'EATEN'],
    suggestions: [{ foodId: '1', status: 'saved' }, { foodId: '2', status: 'pending' }],
    visible: true,
  },
  {
    title: '모두 Eaten + 생성한 추천 모두 처리: 숨김',
    outcomes: ['EATEN', 'EATEN'],
    suggestions: [{ foodId: '1', status: 'saved' }, { foodId: '2', status: 'dismissed' }],
    visible: false,
  },
  {
    title: '저장 추천과 미처리 추천이 섞임: 표시',
    outcomes: ['TASTED', 'UNTOUCHED'],
    suggestions: [{ foodId: '1', status: 'saved' }, { foodId: '2', status: 'pending' }],
    visible: true,
  },
  {
    title: '음식 4개 중 생성한 3개 추천 모두 처리: 미생성 음식이 있어도 숨김',
    outcomes: ['EATEN', 'TASTED', 'UNTOUCHED', 'UNCLEAR'],
    suggestions: [
      { foodId: '1', status: 'saved' },
      { foodId: '2', status: 'dismissed' },
      { foodId: '3', status: 'tried' },
    ],
    visible: false,
  },
  {
    title: '음식 4개 중 생성한 추천 1개만 처리 완료: 숨김',
    outcomes: ['EATEN', 'TASTED', 'UNTOUCHED', 'UNCLEAR'],
    suggestions: [{ foodId: '1', status: 'saved' }], visible: false,
  },
  {
    title: '미작성 음식에만 미처리 추천이 남음: 숨김',
    outcomes: ['TASTED', null],
    suggestions: [{ foodId: '1', status: 'saved' }, { foodId: '2', status: 'pending' }],
    visible: false,
  },
  {
    title: '다른 식사의 처리된 추천만 있음: 현재 식사는 미생성이므로 표시',
    outcomes: ['TASTED'],
    suggestions: [{ foodId: '1', status: 'saved', mealId: '20' }], visible: true,
  },
  {
    title: '거절 완료 + 추가 생성 가능: 숨김',
    outcomes: ['TASTED'],
    suggestions: [{ foodId: '1', status: 'dismissed', canRegenerate: true }], visible: false,
  },
  {
    title: '거절 후 실제 생성된 추가 추천이 미처리: 표시',
    outcomes: ['TASTED'],
    suggestions: [
      { foodId: '1', status: 'dismissed', canRegenerate: false },
      { foodId: '1', status: 'pending', replacementForId: '31' },
    ],
    visible: true,
  },
];

for (const { title, outcomes, targetIds } of targetCases) {
  test(`추천 대상 — ${title}`, () => {
    const meal = mealWithOutcomes(outcomes);
    assert.deepEqual(getSuggestionTargetFoodIds(meal), new Set(targetIds));
  });
}

for (const { title, outcomes, suggestions, visible } of visibilityCases) {
  test(`카드 표시 — ${title}`, () => {
    const meal = mealWithOutcomes(outcomes);
    const records = suggestionsFrom(suggestions);
    assert.equal(shouldShowSuggestionMeal(meal, records), visible);
  });
}
