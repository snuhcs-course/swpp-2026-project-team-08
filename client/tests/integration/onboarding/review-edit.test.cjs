// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 검토 카드별 실제 수정 왕복과 최신 요약·다른 답변 보존 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, mountReview } = require('../../helpers/onboarding-screen.cjs');
const { strings } = require('../../../src/util/strings.ts');
const s = strings.en;

function reviewAnswers(overrides = {}) {
  return {
    caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    childName: '나루', ageRange: 'AGE_4_5', allergies: ['EGGS'], restrictions: ['GLUTEN_FREE'],
    dietaryPattern: 'flexitarian',
    safeFoods: [{ id: 'apple', name: 'Apple', preparation: 'Sliced', presentationNote: 'Blue bowl' }],
    safeFoodInput: { name: 'Next food', preparation: 'Warmed', presentationNote: 'Small plate' },
    ...overrides,
  };
}
const initialSummaries = {
  'Child basics': '나루 · 4-5 years',
  'Safety restrictions': 'Allergies: Eggs · Other dietary restrictions: Gluten-free',
  'Dietary Pattern': 'Flexitarian',
  'Safe foods': 'Apple · Sliced · Blue bowl',
};

function control(app, role, label) {
  const matches = [...app.container.querySelectorAll(`[role="${role}"]`)]
    .filter(element => {
      const text = element.getAttribute('aria-label') ?? element.textContent;
      // 선택 행은 항목명 뒤에 안내 문구가 붙는다.
      return role === 'radio' || role === 'checkbox' ? text.startsWith(label) : text === label;
    });
  assert.equal(matches.length, 1, `${label} ${role} 요소가 하나 있어야 한다`);
  return matches[0];
}
function input(app, label) {
  const matches = [...app.container.querySelectorAll('input')]
    .filter(element => element.getAttribute('aria-label') === label);
  assert.equal(matches.length, 1, `${label} 입력칸이 하나 있어야 한다`);
  return matches[0];
}
const click = async element => act(async () => element.click());
const next = app => control(app, 'button', s.common.continue);
const edit = (app, title) => control(app, 'button', `${s.common.edit} ${title}`);
async function enter(app, label, value) {
  const element = input(app, label);
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(element, value);
    element.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}
async function assertScreen(app, step, title) {
  await waitFor(() => app.pathname === `/onboarding/${step}`);
  assert.ok(control(app, 'heading', title));
}
function assertSummaries(app, expected) {
  for (const [title, value] of Object.entries(expected)) {
    // 해당 카드의 수정 버튼을 기준으로 요약을 확인한다. 전체 화면 스냅샷은 고정하지 않는다.
    assert.equal(edit(app, title).parentElement.textContent, title + value, `${title} 요약`);
  }
}

// Wiki I2-AC-04.2: 실제 입력 화면에서 수정하고 돌아오면 해당 요약만 바뀐다.
test('자녀 이름과 연령을 수정하고 Review로 돌아오면 제목·자녀 요약이 갱신되고 다른 답변은 보존된다', async t => {
  const app = await mountReview(t, reviewAnswers());
  const before = structuredClone(app.current.draft);
  assertSummaries(app, initialSummaries);

  await click(edit(app, 'Child basics'));
  await assertScreen(app, 'child', 'Tell us about your child');
  assert.equal(input(app, s.onboarding.childName).value, '나루');
  await enter(app, s.onboarding.childName, '하루');
  await click(control(app, 'button', '4-5 years'));
  await click(control(app, 'button', '6-8 years'));
  await click(next(app));

  await assertScreen(app, 'review', 'Review 하루’s profile');
  assertSummaries(app, { ...initialSummaries, 'Child basics': '하루 · 6-8 years' });
  assert.deepEqual(app.current.draft, { ...before, childName: '하루', ageRange: 'AGE_6_8' });
});

test('알레르기와 식이 제한을 차례로 수정하고 Review로 돌아오면 두 요약이 갱신되고 음식과 다른 답변은 보존된다', async t => {
  const app = await mountReview(t, reviewAnswers());
  const before = structuredClone(app.current.draft);

  await click(edit(app, 'Safety restrictions'));
  await assertScreen(app, 'allergies', 'Food allergies');
  await click(control(app, 'checkbox', 'Eggs'));
  await click(control(app, 'checkbox', 'Peanuts'));
  await click(next(app));
  await assertScreen(app, 'restrictions', 'Other dietary restrictions');
  await click(control(app, 'checkbox', s.onboarding.noOtherRestrictions));
  await click(next(app));

  await assertScreen(app, 'review', 'Review 나루’s profile');
  assertSummaries(app, {
    ...initialSummaries, 'Safety restrictions': 'Allergies: Peanuts · Other dietary restrictions: None',
  });
  assert.deepEqual(app.current.draft, { ...before, allergies: ['PEANUTS'], restrictions: ['none'] });
});

test('미응답인 식생활 유형을 선택하고 Review로 돌아오면 선택한 유형을 표시하고 다른 답변은 보존된다', async t => {
  const app = await mountReview(t, reviewAnswers({ dietaryPattern: null }));
  const before = structuredClone(app.current.draft);
  assertSummaries(app, { ...initialSummaries, 'Dietary Pattern': 'Not answered' });

  await click(edit(app, 'Dietary Pattern'));
  await assertScreen(app, 'family', 'Dietary Pattern');
  await click(control(app, 'radio', 'Pescatarian'));
  await click(next(app));

  await assertScreen(app, 'review', 'Review 나루’s profile');
  assertSummaries(app, { ...initialSummaries, 'Dietary Pattern': 'Pescatarian' });
  assert.deepEqual(app.current.draft, { ...before, dietaryPattern: 'pescatarian' });
});

test('음식 없음을 해제하고 음식을 추가해 Review로 돌아오면 음식·제공 형태·추가 설명을 표시하고 다른 답변은 보존된다', async t => {
  const app = await mountReview(t, reviewAnswers({
    noSafeFoods: true, safeFoods: [],
    safeFoodInput: { name: '', preparation: '', presentationNote: '' },
  }));
  const before = structuredClone(app.current.draft);
  assertSummaries(app, { ...initialSummaries, 'Safe foods': 'No Safe Foods Yet' });

  await click(edit(app, 'Safe foods'));
  await assertScreen(app, 'safe-foods', '나루’s Safe foods');
  await click(control(app, 'checkbox', s.onboarding.noSafeFoods));
  await enter(app, s.onboarding.foodName, 'Banana');
  await enter(app, s.onboarding.preparation, 'Mashed');
  await enter(app, s.onboarding.presentationNote, 'Small bowl');
  await click(control(app, 'button', s.onboarding.addSafeFoodAction));
  await click(next(app));

  await assertScreen(app, 'review', 'Review 나루’s profile');
  assertSummaries(app, { ...initialSummaries, 'Safe foods': 'Banana · Mashed · Small bowl' });
  const [food] = app.current.draft.safeFoods;
  assert.ok(food.id);
  assert.deepEqual(app.current.draft, {
    ...before, noSafeFoods: false,
    safeFoods: [{ id: food.id, name: 'Banana', preparation: 'Mashed', presentationNote: 'Small bowl' }],
  });
});
