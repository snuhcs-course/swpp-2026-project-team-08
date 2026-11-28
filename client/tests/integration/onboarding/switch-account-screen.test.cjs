// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 진입 화면의 다른 계정 로그인 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountDraft, waitFor, click, enter, control } = require('../../helpers/onboarding-screen.cjs');
const { emptyDraft } = require('../../../src/features/onboarding/types.ts');
const { readDraft } = require('../../../src/data/storage/onboardingDraftStorage.ts');

const draft = { ...emptyDraft(), step: 'child', caregiverName: 'Parent', caregiverEmail: 'parent@example.com', childName: 'First child' };

test('resume offers another account and login does not reuse the current draft', async t => {
  const app = await mountDraft(t, draft, { initialPath: '/', signIn: (path, init) => {
    if (path.endsWith('/login')) return Response.json({ access_token: 'new-access', refresh_token: 'new-refresh', token_type: 'bearer' });
    return Response.json({ id: '2', email: 'other@example.com', full_name: 'Other Parent', created_at: '2026-10-23T00:00:00Z' });
  } });
  assert.ok(control(app, 'button', 'Resume setup'));
  await click(control(app, 'button', 'Or Sign in to another account'));
  await waitFor(() => app.pathname === '/login');
  assert.equal(await readDraft(), null);
  await enter(app, 'Email', 'other@example.com');
  await enter(app, 'Password', 'password123');
  await click(control(app, 'button', 'Log in'));
  await waitFor(() => app.pathname === '/onboarding/consent');
  assert.equal(app.current.draft.childName, '');
  assert.equal(app.current.draft.caregiverEmail, 'other@example.com');
});

test('failed draft backup keeps Resume setup and reports an error', async t => {
  const { failNextWrite } = require('../../helpers/onboarding-screen.cjs');
  const app = await mountDraft(t, draft, { initialPath: '/' });
  failNextWrite('nurturebites.onboarding.v1.account.1');
  await click(control(app, 'button', 'Or Sign in to another account'));
  await waitFor(() => app.container.querySelector('[role="alert"]'));
  assert.equal(app.pathname, '/');
  assert.deepEqual(await readDraft(), draft);
  assert.ok(control(app, 'button', 'Resume setup'));
});

test('a failed sign-in keeps the original account draft in its archive', async t => {
  const { readArchivedDraft } = require('../../../src/data/storage/onboardingDraftStorage.ts');
  const app = await mountDraft(t, draft, { initialPath: '/', signIn: () =>
    Response.json({ error_code: 'INVALID_CREDENTIALS' }, { status: 401 }) });
  await click(control(app, 'button', 'Or Sign in to another account'));
  await waitFor(() => app.pathname === '/login');
  await enter(app, 'Email', 'other@example.com');
  await enter(app, 'Password', 'password123');
  await click(control(app, 'button', 'Log in'));
  await waitFor(() => app.container.textContent.includes('Email or password is incorrect.'));
  assert.equal(app.pathname, '/login');
  assert.deepEqual(await readArchivedDraft('1'), draft);
  assert.equal(await readDraft(), null);
});
