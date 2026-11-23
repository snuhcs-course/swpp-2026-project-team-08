// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 기존 식사 진입의 서버 음식과 미완료 리뷰 초안
const { mealResponse } = require('./server-meal.cjs');
const { ingredientId } = require('../../src/rules/ingredientIds.ts');

function entryMeal() {
  const meal = mealResponse();
  meal.foods[0].ingredients = [
    { id: '101', name: 'Carrot', outcome: null, difficulty_reasons: [] },
    { id: '102', name: 'Egg', outcome: null, difficulty_reasons: [] },
  ];
  meal.foods.push({ ...meal.foods[0], id: '2', name: 'Soup', ingredients: [] });
  return meal;
}

function unfinishedReview() {
  return {
    mealId: '10', childId: '1', step: 'outcomes', comparisonMethod: 'manual',
    afterPhoto: { id: 'after', uri: 'file:///after.png', mimeType: 'image/png' },
    outcomes: [
      { foodId: '1', decision: { confirmed: 'tasted', suggested: null }, ingredients: [
        { id: ingredientId('1', 'Carrot', 0), name: 'Carrot', selected: true,
          decision: { confirmed: 'untouched', suggested: null } },
        { id: ingredientId('1', 'Egg', 0), name: 'Egg', selected: false,
          decision: { confirmed: null, suggested: null } },
      ] },
      { foodId: '2', decision: { confirmed: null, suggested: null }, ingredients: [] },
    ],
    difficulties: { '1': [{ id: 'color:yellow', category: 'color', value: 'yellow' }] },
    difficultyInputs: { '1': { category: 'texture', subcategory: 'hardness', value: '', note: '' } },
    suggestionFeedback: {},
  };
}

module.exports = { entryMeal, unfinishedReview };
