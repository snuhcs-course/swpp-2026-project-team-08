// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: MyPage 언어 버튼과 저장 실패 표시 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { React, act, renderHook } = require('../helpers/react-harness.cjs');
const { mockModules } = require('../helpers/mock-modules.cjs');
let rejectSave = false;
let view;
mockModules(name => {
  if (name === 'expo-router') return { Redirect: () => null, router: {} };
  if (name === 'react-native') return { View: () => null };
  if (name.endsWith('/ProfileProvider')) return { useProfile: () => {
    const [language, setLanguage] = React.useState('en');
    return ({
    status: 'ready', language, profile: { childName: 'Sam', ageRange: 'AGE_2_3', caregiverName: 'Parent', caregiverEmail: 'parent@example.com' },
    changeLanguage: async next => { if (rejectSave) throw new Error('Disk full'); setLanguage(next); },
  }); } };
  if (name.endsWith('/useOnboarding')) return { useOnboarding: () => ({ ready: true }) };
  if (name.endsWith('/useAccountSession')) return { useAccountSession: () => ({}) };
  if (name === './MyPageView') return { MyPageView: props => { view = props; return null; } };
});
const { MyPageScreen } = require('../../src/features/my-page/screens/MyPageScreen.tsx');
test('MyPage toggles both ways and retains the language on a failed save, then retries', async t => {
  await renderHook(t, () => null, { wrapper: () => React.createElement(MyPageScreen) });
  assert.equal(view.language, 'en');
  await act(async () => view.onLanguage());
  assert.equal(view.language, 'ko');
  await act(async () => view.onLanguage());
  assert.equal(view.language, 'en');
  rejectSave = true;
  await act(async () => view.onLanguage());
  assert.equal(view.language, 'en');
  assert.equal(view.languageError, true);
  assert.equal(view.changingLanguage, false);
  rejectSave = false;
  await act(async () => view.onLanguage());
  assert.equal(view.language, 'ko');
  assert.equal(view.languageError, false);
});
