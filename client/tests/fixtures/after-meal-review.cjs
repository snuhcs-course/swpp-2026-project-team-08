// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { newDraft, mealFromDraft } = require('../../src/features/meal-checkin/rules.ts');
const { newFood } = require('../../src/rules/foodDraft.ts');

function savedMeal(childId) {
  const draft = newDraft(childId);
  draft.mealType = 'lunch'; draft.setting = 'home';
  draft.photo = { id: 'before', uri: 'file:///before.png', mimeType: 'image/png' };
  draft.foods = [{ ...newFood(), confirmed: true, id: 'food-1', name: 'Rice', ingredients: ['Carrot', 'Egg'] }];
  draft.step = 'foods';
  return mealFromDraft(draft);
}

module.exports = { savedMeal };
