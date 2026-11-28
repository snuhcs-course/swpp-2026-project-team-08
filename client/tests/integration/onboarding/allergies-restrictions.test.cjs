// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 알레르기·식이 제한 선택·해제와 실제 화면 이동 검증
// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: Follow simplified onboarding route after allergies
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, mountAllergies } = require('../../helpers/onboarding-screen.cjs');
const { strings } = require('../../../src/util/strings.ts');

function control(app, role, label) {
  const matches = [...app.container.querySelectorAll(`[role="${role}"]`)]
    .filter(element => {
      const text = element.getAttribute('aria-label') ?? element.textContent;
      // Choice rows may append a description to their visible label.
      return role === 'checkbox' ? text.startsWith(label) : text === label;
    });
  assert.equal(matches.length, 1, `${label} ${role} 요소가 하나 있어야 한다`);
  return matches[0];
}
const continueButton = app => control(app, 'button', strings.en.common.continue);
const choice = (app, label) => control(app, 'checkbox', label);
async function click(element) { await act(async () => element.click()); }
function assertScreen(app, step) {
  assert.equal(app.pathname, `/onboarding/${step}`);
  const title = step === 'sensory' ? strings.en.sensory.title
    : step === 'refused-foods' ? strings.en.refusedFoods.title(app.current.draft.childName)
      : strings.en.onboarding.titles[step];
  assert.ok(control(app, 'heading', title));
}

test('알레르기 복수 선택을 유지하고 식생활 유형 화면으로 이동한다', async t => {
  const app = await mountAllergies(t);
  assert.equal(continueButton(app).getAttribute('aria-disabled'), 'true');
  await click(continueButton(app));
  assertScreen(app, 'allergies');

  await click(choice(app, 'Eggs'));
  await click(choice(app, 'Milk / Dairy'));
  assert.deepEqual(app.current.draft.allergies, ['EGGS', 'MILK_DAIRY']);
  await click(choice(app, 'Eggs'));
  assert.deepEqual(app.current.draft.allergies, ['MILK_DAIRY']);
  assert.deepEqual(app.current.draft.restrictions, []);
  assert.notEqual(continueButton(app).getAttribute('aria-disabled'), 'true');
  await click(continueButton(app));

  await waitFor(() => app.pathname === '/onboarding/family');
  assertScreen(app, 'family');
  assert.ok(app.container.querySelector('[role="radiogroup"] [role="radio"]'));
  assert.deepEqual(app.current.draft.allergies, ['MILK_DAIRY']);
  assert.deepEqual(app.current.draft.restrictions, []);
  await click([...app.container.querySelectorAll('[role="radio"]')]
    .find(element => element.textContent.startsWith('Pescatarian')));
  await click(continueButton(app));
  await waitFor(() => app.pathname === '/onboarding/sensory');
  assertScreen(app, 'sensory');
});

test('알레르기 없음은 기존 선택을 지우고 실제 항목 선택 시 자동 해제된다', async t => {
  const app = await mountAllergies(t);
  await click(choice(app, 'Eggs'));
  await click(choice(app, 'Milk / Dairy'));
  await click(choice(app, strings.en.onboarding.noKnownAllergies));
  assert.deepEqual(app.current.draft.allergies, ['none']);
  assert.notEqual(continueButton(app).getAttribute('aria-disabled'), 'true');
  await click(choice(app, 'Eggs'));
  assert.deepEqual(app.current.draft.allergies, ['EGGS']);
  await click(continueButton(app));

  assertScreen(app, 'family');
  assert.ok(app.container.querySelector('[role="radiogroup"] [role="radio"]'));
  assert.deepEqual(app.current.draft.restrictions, []);
  assert.deepEqual(app.current.draft.allergies, ['EGGS']);
});

test('마지막 알레르기 답변을 해제하면 다음 버튼을 비활성화한다', async t => {
  const app = await mountAllergies(t);
  assertScreen(app, 'allergies');
  await click(choice(app, 'Eggs'));
  assert.deepEqual(app.current.draft.allergies, ['EGGS']);
  await click(choice(app, 'Eggs'));
  assert.deepEqual(app.current.draft.allergies, []);
  assert.equal(continueButton(app).getAttribute('aria-disabled'), 'true');
  await click(continueButton(app));
  assertScreen(app, 'allergies');
});
