// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 알레르기·식이 제한 선택·해제와 실제 화면 이동 검증
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
  assert.ok(control(app, 'heading', strings.en.onboarding.titles[step]));
}

test('각 질문에서 복수 선택 후 하나를 해제해도 나머지 답변을 유지하고 실제 다음 화면으로 이동한다', async t => {
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

  await waitFor(() => app.pathname === '/onboarding/restrictions');
  assertScreen(app, 'restrictions');
  assert.ok(choice(app, 'Gluten-free'));
  assert.equal(continueButton(app).getAttribute('aria-disabled'), 'true');
  await click(continueButton(app));
  assertScreen(app, 'restrictions');

  await click(choice(app, 'Gluten-free'));
  await click(choice(app, 'Casein-free'));
  assert.deepEqual(app.current.draft.restrictions, ['GLUTEN_FREE', 'CASEIN_FREE']);
  await click(choice(app, 'Gluten-free'));
  assert.deepEqual(app.current.draft.restrictions, ['CASEIN_FREE']);
  assert.deepEqual(app.current.draft.allergies, ['MILK_DAIRY']);
  assert.notEqual(continueButton(app).getAttribute('aria-disabled'), 'true');
  await click(continueButton(app));

  await waitFor(() => app.pathname === '/onboarding/family');
  assertScreen(app, 'family');
  assert.ok(app.container.querySelector('[role="radiogroup"] [role="radio"]'));
  assert.deepEqual(app.current.draft.allergies, ['MILK_DAIRY']);
  assert.deepEqual(app.current.draft.restrictions, ['CASEIN_FREE']);
});

test('없음은 기존 선택을 지우고 다른 항목 선택 시 자동 해제되며 다른 질문의 답변을 보존한다', async t => {
  const app = await mountAllergies(t);
  await click(choice(app, 'Eggs'));
  await click(choice(app, 'Milk / Dairy'));
  await click(choice(app, strings.en.onboarding.noKnownAllergies));
  assert.deepEqual(app.current.draft.allergies, ['none']);
  assert.deepEqual(app.current.draft.restrictions, []);
  assert.notEqual(continueButton(app).getAttribute('aria-disabled'), 'true');
  await click(choice(app, 'Eggs'));
  assert.deepEqual(app.current.draft.allergies, ['EGGS']);
  await click(continueButton(app));

  await waitFor(() => app.pathname === '/onboarding/restrictions');
  assertScreen(app, 'restrictions');
  await click(choice(app, 'Gluten-free'));
  await click(choice(app, 'Casein-free'));
  await click(choice(app, strings.en.onboarding.noOtherRestrictions));
  assert.deepEqual(app.current.draft.restrictions, ['none']);
  assert.deepEqual(app.current.draft.allergies, ['EGGS']);
  await click(choice(app, 'Lactose-free'));
  assert.deepEqual(app.current.draft.restrictions, ['LACTOSE_FREE']);
  await click(choice(app, strings.en.onboarding.noOtherRestrictions));
  assert.deepEqual(app.current.draft.restrictions, ['none']);
  assert.deepEqual(app.current.draft.allergies, ['EGGS']);
  assert.notEqual(continueButton(app).getAttribute('aria-disabled'), 'true');
  await click(continueButton(app));

  await waitFor(() => app.pathname === '/onboarding/family');
  assertScreen(app, 'family');
  assert.ok(app.container.querySelector('[role="radiogroup"] [role="radio"]'));
  assert.deepEqual(app.current.draft.restrictions, ['none']);
  assert.deepEqual(app.current.draft.allergies, ['EGGS']);
});

test('각 질문의 마지막 선택이나 없음을 해제하면 다음 버튼이 비활성화되고 현재 화면에 머문다', async t => {
  const app = await mountAllergies(t);
  for (const { step, label, id, noneLabel } of [
    { step: 'allergies', label: 'Eggs', id: 'EGGS', noneLabel: strings.en.onboarding.noKnownAllergies },
    { step: 'restrictions', label: 'Gluten-free', id: 'GLUTEN_FREE', noneLabel: strings.en.onboarding.noOtherRestrictions },
  ]) {
    assertScreen(app, step);
    for (const answer of [{ label, id }, { label: noneLabel, id: 'none' }]) {
      await click(choice(app, answer.label));
      assert.deepEqual(app.current.draft[step], [answer.id]);
      assert.notEqual(continueButton(app).getAttribute('aria-disabled'), 'true');
      await click(choice(app, answer.label));
      assert.deepEqual(app.current.draft[step], []);
      assert.equal(continueButton(app).getAttribute('aria-disabled'), 'true');
      await click(continueButton(app));
      assertScreen(app, step);
    }
    if (step === 'allergies') {
      await click(choice(app, noneLabel));
      await click(continueButton(app));
      await waitFor(() => app.pathname === '/onboarding/restrictions');
    } else {
      assert.deepEqual(app.current.draft.allergies, ['none']);
    }
  }
});
