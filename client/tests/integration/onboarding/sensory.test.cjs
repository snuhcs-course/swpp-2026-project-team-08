// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 감각 프로필과 거부 음식 단계 이동 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, mountDietaryPattern } = require('../../helpers/onboarding-screen.cjs');
const { readDraft } = require('../../../src/data/storage/onboardingDraftStorage.ts');

function button(app, label) {
  return [...app.container.querySelectorAll('[role="button"]')].find(el =>
    (el.getAttribute('aria-label') ?? el.textContent) === label);
}
test('sensory profile precedes refused foods and selected texture is saved', async t => {
  const app = await mountDietaryPattern(t);
  await act(async () => button(app, 'Continue').click());
  await waitFor(() => app.pathname === '/onboarding/sensory');
  await act(async () => button(app, 'texture category').click());
  await act(async () => button(app, 'How hard it feels').click());
  await act(async () => button(app, 'value').click());
  await act(async () => button(app, 'Hard').click());
  await act(async () => button(app, '+ Add').click());
  assert.deepEqual(app.current.draft.sensoryTextures, ['hardness.hard']);
  await waitFor(async () => (await readDraft()).sensoryTextures?.[0] === 'hardness.hard');
  await act(async () => button(app, 'Continue').click());
  await waitFor(() => app.pathname === '/onboarding/refused-foods');
  assert.equal(app.submissions.length, 0);
  await act(async () => button(app, 'Previous').click());
  await waitFor(() => app.pathname === '/onboarding/sensory');
  await waitFor(() => button(app, 'Remove Hard'));
});
