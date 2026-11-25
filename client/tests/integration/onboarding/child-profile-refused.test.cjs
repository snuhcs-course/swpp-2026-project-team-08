// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 자녀 프로필 거부 음식 편집 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, mountDraft, waitFor, click, enter, control } = require('../../helpers/onboarding-screen.cjs');
const { profileResponse } = require('../../fixtures/account-profile.cjs');

function profile() {
  const response = profileResponse();
  response.profile.safe_foods = [{ id: '1', name: 'Rice', preparation: 'Steamed', presentation_note: null }];
  response.profile.sensory_textures = ['hardness.hard'];
  response.profile.sensory_note = 'Avoid mixed';
  response.profile.refused_foods = [{ id: 'old', name: 'Apple', cooking_method: null, reasons: [] }];
  return response;
}
async function openChild(app) {
  assert.equal(app.container.textContent.includes('Sensory Profile'), false);
  await click(control(app, 'button', 'Child 14-5 yearsView profile >'));
  await waitFor(() => app.pathname === '/child-profile');
}

test('child profile displays refused foods and saves edits while preserving other answers', async t => {
  const original = profile();
  const app = await mountDraft(t, undefined, { completion: true, initialPath: '/profile',
    loadProfile: () => Response.json(original),
    submit: body => Response.json({ ...original, profile: { ...original.profile, refused_foods: body.profile.refused_foods } }),
  });
  await openChild(app);
  assert.ok(control(app, 'button', 'Refused foodsApple'));
  assert.ok(app.container.textContent.includes('Sensory Profile'));
  assert.equal(app.container.textContent.includes('Safe Foods'), false);
  await click(control(app, 'button', 'Refused foodsApple'));
  await waitFor(() => app.pathname === '/onboarding/refused-foods');
  await enter(app, 'Food name', 'Banana');
  await click(control(app, 'button', 'Add Refused Food'));
  await click(control(app, 'button', 'Save'));
  await waitFor(() => app.pathname === '/child-profile');
  assert.ok(control(app, 'button', 'Refused foodsApple, Banana'));
  assert.deepEqual(app.profile.refusedFoods.map(food => food.name), ['Apple', 'Banana']);
  assert.equal(app.profile.sensoryNote, 'Avoid mixed');
  assert.equal(app.profile.safeFoods[0].name, 'Rice');
  assert.equal(app.submissions[0].profile.safe_foods[0].name, 'Rice');
  await click(control(app, 'button', 'Refused foodsApple, Banana'));
  await waitFor(() => app.pathname === '/onboarding/refused-foods');
  await click(control(app, 'button', 'Remove Apple'));
  await click(control(app, 'button', 'Remove Banana'));
  await click(control(app, 'button', 'Save'));
  await waitFor(() => app.pathname === '/child-profile');
  assert.ok(control(app, 'button', 'Refused foodsNot entered'));
  assert.deepEqual(app.profile.refusedFoods, []);
  await app.unmount();
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 100)); });
});


