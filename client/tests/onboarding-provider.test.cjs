// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: 익숙한 음식 추가·삭제·선택 정보 초안 복원 검증
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 안심 음식 없음 선택이 사라진 구조에 맞춰 검증 수정
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 행동별 테스트 분리와 실행 환경 추출
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { values, mount, account, emptyDraft, readDraft, saveDraft } = require('./helpers/onboarding-provider-harness.cjs');

test('profile editing cannot restore a cleared account field when another answer changes', async () => {
  values.clear();
  const draft = { ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: account.user.email };
  await saveDraft(draft);
  const harness = mount(account, { ...draft, id: '12', updatedAt: '2026-10-27T00:00:00Z' });
  let model = await harness.flush();
  assert.equal(model.editing, true);
  model.setField('caregiverEmail', '');
  model = await harness.flush();
  model.setField('childName', 'Edited child');
  model = await harness.flush();
  assert.equal(model.draft.caregiverEmail, '');
  assert.equal((await readDraft()).caregiverEmail, '');
});
