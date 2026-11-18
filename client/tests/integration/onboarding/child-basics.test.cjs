// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 자녀 정보 입력·삭제와 진행 차단·실제 화면 이동 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, mountChildBasics } = require('../../helpers/onboarding-screen.cjs');
const { strings } = require('../../../src/util/strings.ts');

function control(app, role, label) {
  const matches = [...app.container.querySelectorAll(`[role="${role}"]`)]
    .filter(element => (element.getAttribute('aria-label') ?? element.textContent) === label);
  assert.equal(matches.length, 1, `${label} ${role} 요소가 하나 있어야 한다`);
  return matches[0];
}
function nicknameInput(app) {
  const matches = [...app.container.querySelectorAll('input[aria-label]')]
    .filter(element => element.getAttribute('aria-label') === strings.en.onboarding.childName);
  assert.equal(matches.length, 1, '닉네임 입력칸이 하나 있어야 한다');
  return matches[0];
}
const continueButton = app => control(app, 'button', strings.en.common.continue);
async function click(element) { await act(async () => element.click()); }
async function enterNickname(app, value) {
  const input = nicknameInput(app);
  // Dispatch an input event through React and RN Web instead of calling onChangeText directly.
  const setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => {
    setValue.call(input, value);
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}
async function selectAge(app) {
  await click(control(app, 'button', strings.en.onboarding.ageRange));
  // One existing option is a fixture, not a requirement that fixes the final age bands.
  await click(control(app, 'button', '4-5 years'));
  assert.ok(control(app, 'button', '4-5 years'));
}
function assertChildScreen(app) {
  assert.equal(app.pathname, '/onboarding/child');
  assert.ok(control(app, 'heading', strings.en.onboarding.titles.child));
  assert.equal(app.container.textContent.includes(strings.en.onboarding.titles.allergies), false);
}

test('닉네임만 입력하면 진행을 막고 연령대까지 선택하면 알레르기 화면으로 이동한다', async t => {
  const app = await mountChildBasics(t);
  assert.equal(continueButton(app).getAttribute('aria-disabled'), 'true');

  await enterNickname(app, '나루');
  assert.equal(nicknameInput(app).value, '나루');
  assert.equal(app.current.draft.childName, '나루');
  assert.equal(app.current.draft.ageRange, '');
  assert.equal(continueButton(app).getAttribute('aria-disabled'), 'true');
  await click(continueButton(app));
  assertChildScreen(app);

  await selectAge(app);
  assert.equal(app.current.draft.ageRange, 'AGE_4_5');
  assert.notEqual(continueButton(app).getAttribute('aria-disabled'), 'true');
  await click(continueButton(app));

  await waitFor(() => app.pathname === '/onboarding/allergies');
  assert.ok(control(app, 'heading', strings.en.onboarding.titles.allergies));
  assert.ok(control(app, 'checkbox', 'Peanuts'));
  assert.equal(app.container.querySelectorAll('input').length, 0);
  assert.equal(app.current.draft.childName, '나루');
  assert.equal(app.current.draft.ageRange, 'AGE_4_5');
});

test('연령대만 선택하거나 입력한 닉네임을 지우면 다음 버튼이 비활성화되고 현재 화면에 머문다', async t => {
  const app = await mountChildBasics(t);
  await selectAge(app);
  assert.equal(nicknameInput(app).value, '');
  assert.equal(app.current.draft.childName, '');
  assert.equal(app.current.draft.ageRange, 'AGE_4_5');
  assert.equal(continueButton(app).getAttribute('aria-disabled'), 'true');
  await click(continueButton(app));
  assertChildScreen(app);

  await enterNickname(app, '나루');
  assert.notEqual(continueButton(app).getAttribute('aria-disabled'), 'true');
  await enterNickname(app, '');
  assert.equal(nicknameInput(app).value, '');
  assert.equal(app.current.draft.childName, '');
  assert.equal(app.current.draft.ageRange, 'AGE_4_5');
  assert.equal(continueButton(app).getAttribute('aria-disabled'), 'true');
  await click(continueButton(app));
  assertChildScreen(app);
});
