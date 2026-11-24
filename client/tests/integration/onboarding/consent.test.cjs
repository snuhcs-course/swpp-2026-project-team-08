// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 동의 선택·해제의 실제 화면 이동 검증 및 사례 이름 한글화
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, mountConsent } = require('../../helpers/onboarding-screen.cjs');
const { strings } = require('../../../src/util/strings.ts');

function control(app, role, label) {
  const matches = [...app.container.querySelectorAll(`[role="${role}"]`)]
    .filter(element => (element.getAttribute('aria-label') ?? element.textContent).includes(label));
  assert.equal(matches.length, 1, `Expected one ${role}: ${label}`);
  return matches[0];
}
const consent = (app, key) => control(app, 'checkbox', strings.en.onboarding[key]);
const continueButton = app => control(app, 'button', strings.en.common.continue);
async function click(element) { await act(async () => element.click()); }
function assertConsentScreen(app) {
  assert.equal(app.pathname, '/onboarding/consent');
  assert.equal(control(app, 'heading', strings.en.onboarding.titles.consent).textContent,
    strings.en.onboarding.titles.consent);
  assert.equal(app.container.textContent.includes(strings.en.onboarding.titles.child), false);
}

test('필수 항목만 선택하면 다음 버튼이 활성화되고 클릭 시 자녀 기본 정보 화면으로 이동한다', async t => {
  const app = await mountConsent(t);
  assert.equal(continueButton(app).getAttribute('aria-disabled'), 'true');

  await click(consent(app, 'accountPrivacy'));
  assert.equal(continueButton(app).getAttribute('aria-disabled'), 'true');
  await click(consent(app, 'photoAnalysis'));
  assert.deepEqual(app.current.draft.consent,
    { accountPrivacy: true, photoAnalysis: true, aiTraining: false });
  assert.notEqual(continueButton(app).getAttribute('aria-disabled'), 'true');

  await click(continueButton(app));
  await waitFor(() => app.pathname === '/onboarding/child');
  assert.equal(control(app, 'heading', strings.en.onboarding.titles.child).textContent,
    strings.en.onboarding.titles.child);
  assert.ok(app.container.querySelector('input'), 'Child basics has a name input');
  assert.ok(app.container.textContent.includes(strings.en.onboarding.ageRange));
  assert.equal(app.container.querySelectorAll('[role="checkbox"]').length, 0);
});

test('선택 항목만 동의하면 다음 버튼이 비활성화되고 클릭해도 동의 화면에 머문다', async t => {
  const app = await mountConsent(t);
  await click(consent(app, 'aiTraining'));
  assert.deepEqual(app.current.draft.consent,
    { accountPrivacy: false, photoAnalysis: false, aiTraining: true });
  assert.equal(continueButton(app).getAttribute('aria-disabled'), 'true');

  await click(continueButton(app));
  assertConsentScreen(app);
});

test('필수 동의 중 어느 하나라도 해제하면 다음 버튼이 비활성화되고 클릭해도 동의 화면에 머문다', async t => {
  const app = await mountConsent(t);
  await click(consent(app, 'accountPrivacy'));
  await click(consent(app, 'photoAnalysis'));

  for (const key of ['accountPrivacy', 'photoAnalysis']) {
    assert.notEqual(continueButton(app).getAttribute('aria-disabled'), 'true');
    await click(consent(app, key));
    assert.equal(app.current.draft.consent[key], false);
    assert.equal(continueButton(app).getAttribute('aria-disabled'), 'true');

    await click(continueButton(app));
    assertConsentScreen(app);
    await click(consent(app, key));
  }
});
