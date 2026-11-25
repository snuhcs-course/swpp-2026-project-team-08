// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 감각 프로필 요약과 편집 흐름 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, mountReview, mountDraft, click, control } = require('../../helpers/onboarding-screen.cjs');
const { profileResponse } = require('../../fixtures/account-profile.cjs');
const { sensoryProfileSummary } = require('../../../src/util/sensoryProfile.ts');

function response() {
  const data = profileResponse();
  data.profile.sensory_textures = ['hardness.hard'];
  data.profile.sensory_note = 'Avoid mixed textures';
  data.profile.refused_foods = [];
  return data;
}
async function changeNote(app, value) {
  const element = app.container.querySelector('textarea');
  assert.ok(element);
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(element, value);
    element.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}

test('sensory summary localizes textures, retains notes and indicates empty answers', () => {
  assert.equal(sensoryProfileSummary(['hardness.hard'], ' Mixed ', 'en'), 'How hard it feels: Hard\nMixed');
  assert.equal(sensoryProfileSummary(['hardness.hard'], '', 'ko'), '단단한 정도: 딱딱한');
  assert.equal(sensoryProfileSummary([], '', 'en'), 'Not entered');
  assert.equal(sensoryProfileSummary(undefined, '   ', 'ko'), '입력하지 않음');
});

test('review sensory card opens the editor and returns with updated notes', async t => {
  const app = await mountReview(t, { caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    childName: 'Child', ageRange: 'AGE_4_5', allergies: ['none'],
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    sensoryTextures: ['hardness.hard'], sensoryNote: 'Avoid mixed textures' });
  assert.ok(app.container.textContent.includes('How hard it feels: Hard'));
  await click(control(app, 'button', 'Edit Sensory Profile'));
  await waitFor(() => app.pathname === '/onboarding/sensory');
  await changeNote(app, 'Prefers smooth foods');
  await click(control(app, 'button', 'Continue'));
  await waitFor(() => app.pathname === '/onboarding/review');
  assert.ok(app.container.textContent.includes('Prefers smooth foods'));
  assert.deepEqual(app.current.draft.sensoryTextures, ['hardness.hard']);
});

test('My Page sensory card opens editor and saving updates profile summary', async t => {
  const original = response();
  const app = await mountDraft(t, undefined, { completion: true, initialPath: '/profile',
    loadProfile: () => Response.json(original),
    submit: body => Response.json({ ...original, profile: { ...original.profile,
      sensory_textures: body.profile.sensory_textures, sensory_note: body.profile.sensory_note,
      refused_foods: body.profile.refused_foods } }),
  });
  await waitFor(() => app.container.textContent.includes('How hard it feels: Hard'));
  const sensoryCard = [...app.container.querySelectorAll('[role="button"]')].find(el => el.textContent.includes('Sensory Profile'));
  assert.ok(sensoryCard);
  await click(sensoryCard);
  await waitFor(() => app.pathname === '/onboarding/sensory');
  await changeNote(app, 'Prefers smooth foods');
  await click(control(app, 'button', 'Continue'));
  await waitFor(() => app.pathname === '/profile');
  assert.equal(app.profile.sensoryNote, 'Prefers smooth foods');
  assert.ok(app.container.textContent.includes('Prefers smooth foods'));
  assert.deepEqual(app.submissions[0].profile.sensory_textures, ['hardness.hard']);
});

test('a failed sensory edit keeps the draft and existing profile for retry', async t => {
  const original = response();
  let fails = true;
  const app = await mountDraft(t, undefined, { completion: true, initialPath: '/profile',
    loadProfile: () => Response.json(original),
    submit: body => fails ? Response.json({}, { status: 503 }) : Response.json({ ...original,
      profile: { ...original.profile, sensory_note: body.profile.sensory_note,
        sensory_textures: body.profile.sensory_textures, refused_foods: body.profile.refused_foods } }),
  });
  await waitFor(() => app.container.textContent.includes('Sensory Profile'));
  await click([...app.container.querySelectorAll('[role="button"]')].find(el => el.textContent.includes('Sensory Profile')));
  await waitFor(() => app.pathname === '/onboarding/sensory');
  await changeNote(app, 'Updated note');
  await click(control(app, 'button', 'Continue'));
  await waitFor(() => app.current.saveStatus === 'error');
  assert.equal(app.profile.sensoryNote, 'Avoid mixed textures');
  assert.equal(app.current.draft.sensoryNote, 'Updated note');
  fails = false;
  await click(control(app, 'button', 'Continue'));
  await waitFor(() => app.pathname === '/profile');
  assert.equal(app.profile.sensoryNote, 'Updated note');
  await app.unmount();
  await act(async () => {});
});

test('child profile sensory edit can be canceled without changing the profile', async t => {
  const app = await mountDraft(t, undefined, { completion: true, initialPath: '/profile',
    loadProfile: () => Response.json(response()) });
  await click(control(app, 'button', 'Child 14-5 yearsView profile >'));
  await waitFor(() => app.pathname === '/child-profile');
  await waitFor(() => app.container.textContent.includes('How hard it feels: Hard'));
  const sensoryCard = [...app.container.querySelectorAll('[role="button"]')].find(el => el.textContent.includes('Sensory Profile'));
  assert.ok(sensoryCard);
  await click(sensoryCard);
  await waitFor(() => app.pathname === '/onboarding/sensory');
  await changeNote(app, 'Unsaved');
  await click(control(app, 'button', 'Previous'));
  await waitFor(() => app.pathname === '/child-profile');
  assert.equal(app.profile.sensoryNote, 'Avoid mixed textures');
  assert.equal(app.submissions.length, 0);
  await app.unmount();
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 100)); });
});

