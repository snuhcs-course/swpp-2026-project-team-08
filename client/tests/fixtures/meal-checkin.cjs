// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { newDraft } = require('../../src/features/meal-checkin/rules.ts');
const { newFood } = require('../../src/rules/foodDraft.ts');

function completeDraft(childId) { return { ...newDraft(childId), mealType: 'lunch', setting: 'home', foods: [{ ...newFood(), name: 'Rice', confirmed: true }], step: 'foods' }; }

module.exports = { completeDraft };
