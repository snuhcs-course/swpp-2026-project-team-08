// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 프로필 기대값을 채식 제한 필드로 변경
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: 영어 시작 언어 및 사용자 언어 전환 검증
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 언어 초기화·저장 실패 검증을 My Page로 분리
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { server, mount, signIn, values, failNextWrite } = require('../../helpers/account-session.cjs');
const { act, waitFor } = require('../../helpers/react-harness.cjs');

const { readLanguage } = require('../../../src/data/storage/languageStorage.ts');
const { clearSession } = require('../../../src/data/storage/authStorage.ts');
beforeEach(async () => { await clearSession(); values.clear(); });

test('한국어 설정이 저장되어 있어도 앱 시작·로그인·프로필 재조회 후 언어는 영어다', async (t) => {
  server(t);
  values.set('nurturebites.language.v1', 'ko');
  const harness = await mount(t);
  assert.equal(harness.current.profile.language, 'en');
  await signIn(harness);
  await waitFor(() => harness.current.profile.status === 'ready');
  assert.equal(harness.current.profile.language, 'en');
  await act(async () => { await harness.current.profile.retryLoad(); });
  assert.equal(harness.current.profile.language, 'en');
});

test('언어 변경 저장에 실패하면 기존 언어를 유지하고 재시도에 성공하면 선택한 언어를 표시하고 저장한다', async (t) => {
  server(t);
  const harness = await mount(t);
  failNextWrite('nurturebites.language.v1');
  await act(async () => { await assert.rejects(harness.current.profile.changeLanguage('ko'), /Disk full/); });
  assert.equal(harness.current.profile.language, 'en');
  await act(async () => { await harness.current.profile.changeLanguage('ko'); });
  assert.equal(harness.current.profile.language, 'ko');
  assert.equal(await readLanguage(), 'ko');
});
