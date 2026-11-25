// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 현재 온보딩 단계의 이전·다음 이동과 진행 표시 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mountDraft, waitFor, control, input, click } = require('../../helpers/onboarding-screen.cjs');
const { emptyDraft } = require('../../../src/features/onboarding/types.ts');
const { strings } = require('../../../src/util/strings.ts');
const s = strings.en;

const positions = {
  account: 1, consent: 2, child: 3, allergies: 4,
  family: 5, sensory: 6, 'refused-foods': 7, review: 8,
};
function answers(step) {
  return {
    ...emptyDraft(), step, caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    childName: '나루', ageRange: 'AGE_4_5', allergies: ['EGGS', 'MILK_DAIRY'],
    restrictions: ['GLUTEN_FREE'], dietaryPattern: 'pescatarian',
    sensoryTextures: ['hardness.hard'], sensoryNote: 'Likes crisp food',
    refusedFoods: [{ id: 'peas', name: 'Peas', cookingMethod: null, reasons: [] }],
    safeFoods: [{ id: 'apple', name: 'Apple', preparation: 'Sliced', presentationNote: 'Blue bowl' }],
    safeFoodInput: { name: 'Banana', preparation: 'Mashed', presentationNote: 'Small plate' },
  };
}
async function assertScreen(app, step, expected) {
  await waitFor(() => app.pathname === `/onboarding/${step}`);
  const title = step === 'refused-foods' ? s.refusedFoods.title(expected.childName)
    : step === 'sensory' ? s.sensory.title
      : step === 'review' ? s.onboarding.reviewTitle(expected.childName) : s.onboarding.titles[step];
  assert.ok(control(app, 'heading', title));
  assert.deepEqual(app.current.draft, { ...expected, step });
  const number = positions[step];
  const labels = [...app.container.querySelectorAll('*')]
    .filter(el => el.childElementCount === 0 && el.textContent === `STEP ${number} OF 8`);
  assert.equal(labels.length, 1, `${step} 화면의 단계 번호`);
  // 단계 문구 아래에 표시되는 진행 막대의 실제 채움 너비를 확인한다.
  const fill = labels[0].parentElement.nextElementSibling?.firstElementChild;
  assert.ok(fill, `${step} 화면의 진행 막대`);
  assert.equal(fill.style.width, `${number * 12.5}%`, `${step} 화면의 진행률`);

  if (step === 'account') {
    assert.equal(input(app, s.onboarding.caregiverName).value, expected.caregiverName);
    assert.equal(input(app, s.onboarding.email).value, expected.caregiverEmail);
  } else if (step === 'child') {
    assert.equal(input(app, s.onboarding.childName).value, expected.childName);
    assert.ok(control(app, 'button', '4-5 years'));
  } else if (step === 'sensory') {
    assert.ok(app.container.textContent.includes('Likes crisp food'));
  } else if (step === 'refused-foods') {
    assert.ok(control(app, 'button', 'Remove Peas'));
  }
}

test('이전·다음 왕복 후 답변과 작성 중 음식 입력이 유지되고 단계 번호·진행률이 실제 화면과 일치한다', async t => {
  for (const [current, previous] of [
    ['consent', 'account'], ['child', 'consent'], ['allergies', 'child'],
    ['family', 'allergies'], ['sensory', 'family'],
    ['refused-foods', 'sensory'], ['review', 'refused-foods'],
  ]) {
    const expected = answers(current);
    const app = await mountDraft(t, expected);
    await assertScreen(app, current, expected);
    await click(control(app, 'button', s.common.previous));
    await assertScreen(app, previous, expected);
    const next = control(app, 'button', s.common.continue);
    assert.notEqual(next.getAttribute('aria-disabled'), 'true');
    await click(next);
    await assertScreen(app, current, expected);
    assert.deepEqual(app.submissions, []);
    await app.unmount();
  }
});
