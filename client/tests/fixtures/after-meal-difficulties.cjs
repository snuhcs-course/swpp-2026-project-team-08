// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 선택적 어려움 입력의 음식·재료 결과와 빈 사유 초안
const { entryMeal } = require('./after-meal-entry.cjs');
const { toMealDetail } = require('../../src/data/dto/mealDto.ts');
const { toLegacyMeal } = require('../../src/data/dto/mealLegacyDto.ts');
const { newReviewDraft } = require('../../src/features/after-meal-review/rules.ts');

function difficultyFixture() {
  const response = entryMeal();
  const draft = newReviewDraft(toLegacyMeal(toMealDetail(response)));
  draft.step = 'difficulties';
  draft.outcomes[0].decision.confirmed = 'eaten';
  draft.outcomes[1].decision.confirmed = 'unclear';
  const carrot = draft.outcomes[0].ingredients[0];
  carrot.selected = true;
  carrot.decision.confirmed = 'tasted';
  return { response, draft, carrotId: carrot.id };
}
module.exports = { difficultyFixture };
