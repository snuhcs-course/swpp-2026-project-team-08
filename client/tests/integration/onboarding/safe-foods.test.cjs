// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: 익숙한 음식 추가·삭제·선택 정보 초안 복원 검증
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 안심 음식 없음 선택이 사라진 구조에 맞춰 검증 수정
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 테스트 분리·실행 환경 추출 및 사례 이름 한글화
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { values, mount } = require('../../helpers/onboarding-provider-harness.cjs');

test('선택 정보 없이 음식을 추가하고 초안을 복원한 뒤 지정한 음식을 삭제한다', async () => {
  values.clear();
  const harness = mount();
  let model = await harness.flush();
  model.addSafeFood({ name: '  ', preparation: '', presentationNote: '' });
  model = await harness.flush();
  assert.equal(model.draft.safeFoods.length, 0);

  model.setSafeFoodInput('name', '  Apple slices  ');
  model = await harness.flush();
  model.addSafeFood(model.draft.safeFoodInput);
  model = await harness.flush();
  assert.equal(model.draft.safeFoods[0].name, 'Apple slices');
  assert.equal(model.draft.safeFoods[0].preparation, '');
  assert.deepEqual(model.draft.safeFoodInput, { name: '', preparation: '', presentationNote: '' });
  const apple = model.draft.safeFoods[0];
  model.addSafeFood({ name: 'Banana', preparation: 'Raw', presentationNote: 'Blue bowl' });
  model = await harness.flush();
  const banana = model.draft.safeFoods[1];
  assert.notEqual(apple.id, banana.id);
  model.setSafeFoodInput('name', 'Next food');
  model = await harness.flush();
  const saved = model.draft;
  harness.unmount();

  const restored = mount();
  model = await restored.flush();
  assert.deepEqual(model.draft, saved);
  model.removeSafeFood(apple.id);
  model = await restored.flush();
  assert.deepEqual(model.draft.safeFoods, [banana]);
  assert.equal(model.draft.safeFoodInput.name, 'Next food');
  model.removeSafeFood(banana.id);
  model = await restored.flush();
  assert.deepEqual(model.draft.safeFoods, []);
  restored.unmount();
});
