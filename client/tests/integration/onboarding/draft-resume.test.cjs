// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Verify reset discards pending autosaves and current onboarding fixtures
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Dietary Pattern
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 restrictions 목록·대문자 enum 요청 기준으로 수정
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 요청·응답 기준으로 수정
// Connects Auth/Profile/Onboarding providers, validation, API conversion and draft storage.
// Only HTTP and native storage boundaries are mocked.
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 행동별 테스트 분리와 실행 환경 추출
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, values, saveDraft, readDraft, completeDraft, mount } = require('../../helpers/onboarding-flow.cjs');

test('restored draft keeps its step and edits are persisted without storing the password', async t => {
  await saveDraft({ ...completeDraft(), step: 'child' });
  const hook = await mount(t);
  assert.equal(hook.current.onboarding.draft.step, 'child');
  await act(async () => { hook.current.onboarding.setField('childName', 'Edited'); hook.current.onboarding.setPassword('private-password'); });
  await waitFor(() => hook.current.onboarding.saveStatus === 'saved');
  const stored = await readDraft();
  assert.equal(stored.childName, 'Edited');
  assert.equal('password' in stored, false);
});

test('corrupt stored draft reports load error and can be reloaded after storage recovery', async t => {
  values.set('nurturebites.onboarding.v1', '{invalid');
  const hook = await mount(t);
  assert.equal(hook.current.onboarding.loadError, true);
  assert.equal(values.get('nurturebites.onboarding.v1'), '{invalid');
  await saveDraft(completeDraft());
  await act(async () => hook.current.onboarding.retryLoad());
  await waitFor(() => hook.current.onboarding.ready && !hook.current.onboarding.loadError);
  assert.equal(hook.current.onboarding.draft.childName, 'Child 1');
  assert.equal(hook.current.onboarding.draft.step, 'review');
});
