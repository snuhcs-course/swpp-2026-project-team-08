// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 식생활 유형 선택·교체·재선택과 실제 다음 화면 이동 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, mountDietaryPattern } = require('../../helpers/onboarding-screen.cjs');
const { strings } = require('../../../src/util/strings.ts');

function control(app, role, label) {
  const matches = [...app.container.querySelectorAll(`[role="${role}"]`)]
    .filter(element => {
      const text = element.getAttribute('aria-label') ?? element.textContent;
      return role === 'radio' ? text.startsWith(label) : text === label;
    });
  assert.equal(matches.length, 1, `${label} ${role} 요소가 하나 있어야 한다`);
  return matches[0];
}
const continueButton = app => control(app, 'button', strings.en.common.continue);
async function click(element) { await act(async () => element.click()); }
function assertSafeFoodsScreen(app) {
  assert.equal(app.pathname, '/onboarding/safe-foods');
  assert.ok(control(app, 'heading', strings.en.onboarding.safeFoodsTitle('나루')));
  const inputs = [...app.container.querySelectorAll('input')];
  assert.ok(inputs.some(input => input.getAttribute('aria-label') === strings.en.onboarding.foodName));
  assert.equal(app.container.querySelector('[role="radiogroup"]'), null);
}

test('미선택으로 계속하면 미응답을 유지한 채 익숙한 음식 화면으로 이동한다', async t => {
  const app = await mountDietaryPattern(t);
  assert.equal(app.pathname, '/onboarding/family');
  assert.ok(control(app, 'heading', strings.en.onboarding.titles.family));
  assert.equal(app.current.draft.dietaryPattern, null);
  assert.notEqual(continueButton(app).getAttribute('aria-disabled'), 'true');
  await click(continueButton(app));

  await waitFor(() => app.pathname === '/onboarding/safe-foods');
  assertSafeFoodsScreen(app);
  assert.equal(app.current.draft.dietaryPattern, null);
});

test('다른 유형을 선택하면 이전 선택을 교체하고 다른 답변을 보존한 채 다음 화면으로 이동한다', async t => {
  const app = await mountDietaryPattern(t);
  const initialDraft = structuredClone(app.current.draft);
  await click(control(app, 'radio', 'Vegan'));
  assert.deepEqual(app.current.draft, { ...initialDraft, dietaryPattern: 'vegan' });
  await click(control(app, 'radio', 'Pescatarian'));
  assert.deepEqual(app.current.draft, { ...initialDraft, dietaryPattern: 'pescatarian' });
  assert.notEqual(continueButton(app).getAttribute('aria-disabled'), 'true');
  await click(continueButton(app));

  await waitFor(() => app.pathname === '/onboarding/safe-foods');
  assertSafeFoodsScreen(app);
  assert.deepEqual(app.current.draft, {
    ...initialDraft, step: 'safe-foods', dietaryPattern: 'pescatarian',
  });
});

test('특정 유형 없음을 선택하면 미응답과 구분되는 값을 유지한 채 다음 화면으로 이동한다', async t => {
  const app = await mountDietaryPattern(t);
  await click(control(app, 'radio', 'No specific dietary pattern'));
  assert.equal(app.current.draft.dietaryPattern, 'no_specific_pattern');
  assert.notEqual(continueButton(app).getAttribute('aria-disabled'), 'true');
  await click(continueButton(app));

  await waitFor(() => app.pathname === '/onboarding/safe-foods');
  assertSafeFoodsScreen(app);
  assert.equal(app.current.draft.dietaryPattern, 'no_specific_pattern');
});

test('이미 선택한 유형을 다시 누르면 선택과 다른 답변이 그대로 유지된다', async t => {
  const app = await mountDietaryPattern(t);
  await click(control(app, 'radio', 'Vegan'));
  assert.equal(app.current.draft.dietaryPattern, 'vegan');
  const selectedDraft = structuredClone(app.current.draft);
  await click(control(app, 'radio', 'Vegan'));

  assert.deepEqual(app.current.draft, selectedDraft);
  assert.equal(app.pathname, '/onboarding/family');
  assert.ok(control(app, 'heading', strings.en.onboarding.titles.family));
  assert.notEqual(continueButton(app).getAttribute('aria-disabled'), 'true');
});
