const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  filename,
);

const { visibleHomeData } = require('../src/features/home/rules.ts');

test('legacy suggestions without verifiable food-form evidence stay out of actionable Home cards', () => {
  const profile = { id: 'child-1', updatedAt: 'v1', allergies: [], restrictions: [] };
  const records = {
    meals: [{ id: 'meal-1', childId: 'child-1', mealDate: '2026-10-08' }],
    exposures: [{ id: 'exposure-1', childId: 'child-1', foodName: 'Egg', stage: 'touched' }],
    suggestions: [
      { id: 'egg', childId: 'child-1', ingredients: ['egg'], isSaved: true, safetyVerifiedForProfileAt: 'v1' },
      { id: 'other-child', childId: 'child-2', ingredients: ['rice'], isSaved: true, safetyVerifiedForProfileAt: 'v1' },
    ],
  };
  assert.deepEqual(visibleHomeData(records, profile).suggestions, []);
  assert.deepEqual(visibleHomeData(records, { ...profile, updatedAt: 'v2' }).suggestions, []);
  assert.deepEqual(visibleHomeData(records, { ...profile, allergies: ['egg'] }).suggestions, []);
  assert.deepEqual([...visibleHomeData(records, profile).loggedDates], ['2026-10-08']);
});
