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
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 식생활 유형의 완료 후 프로필 수정 저장 검증 분리
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, saveDraft, readDraft, profileResponse, completeDraft, mount } = require('../../helpers/onboarding-flow.cjs');

test('식생활 유형을 바꿔 온보딩을 완료하고 프로필에서 다시 수정하면 마지막 선택값이 저장된다', async t => {
  await saveDraft({ ...completeDraft(), dietaryPattern: 'vegan' });
  const hook = await mount(t, body => {
    const response = profileResponse();
    response.profile.dietary_pattern = body.profile.dietary_pattern;
    return new Response(JSON.stringify(response));
  });
  assert.equal(hook.current.onboarding.draft.dietaryPattern, 'vegan');
  await act(async () => hook.current.onboarding.setField('dietaryPattern', 'flexitarian'));
  await waitFor(() => hook.current.onboarding.saveStatus === 'saved');
  assert.equal((await readDraft()).dietaryPattern, 'flexitarian');
  await act(async () => assert.equal(await hook.current.onboarding.finish(), true));
  assert.equal(hook.current.profile.profile.dietaryPattern, 'flexitarian');
  await act(async () => hook.current.onboarding.startProfileEdit());
  assert.equal(hook.current.onboarding.draft.dietaryPattern, 'flexitarian');
  await act(async () => hook.current.onboarding.setField('dietaryPattern', 'no_specific_pattern'));
  await act(async () => assert.equal(await hook.current.onboarding.applyEdit(), true));
  assert.equal(hook.current.profile.profile.dietaryPattern, 'no_specific_pattern');
});
