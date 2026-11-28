// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: Cover review edits for the current onboarding profile sections
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
    dietaryPattern: 'flexitarian', sensoryTextures: ['hardness.hard'], sensoryNote: 'Likes crisp food',
    refusedFoods: [{ id: 'peas', name: 'Peas', cookingMethod: null, reasons: [] }],
    ...overrides,
  };
}
const initialSummaries = {
  'Child basics': '나루 · 4-5 years',
  'Safety restrictions': 'Allergies: Eggs',
  'Dietary Pattern': 'Flexitarian',
  'Sensory Profile': 'How hard it feels: Hard\nLikes crisp food',
  'Refused foods': 'Peas',
};
const click = async element => act(async () => element.click());

function control(app, role, label) {
  const matches = [...app.container.querySelectorAll(`[role="${role}"]`)].filter(element => {
    const text = element.getAttribute('aria-label') ?? element.textContent;
    return ['radio', 'checkbox'].includes(role) ? text.startsWith(label) : text === label;
  });
  assert.equal(matches.length, 1, `${label} ${role} 요소가 하나 있어야 한다`);
  return matches[0];
}

const edit = (app, title) => control(app, 'button', `${s.common.edit} ${title}`);
const previous = app => control(app, 'button', s.common.previous);
function assertSummaries(app, expected = initialSummaries) {
  for (const [title, value] of Object.entries(expected)) {
    assert.equal(edit(app, title).parentElement.textContent, title + value, `${title} 요약`);
  }
}
async function assertScreen(app, step, title) {
  await waitFor(() => app.pathname === `/onboarding/${step}`);
  assert.ok(control(app, 'heading', title));
  const positions = { child: 3, allergies: 4, family: 5, sensory: 6, 'refused-foods': 7, review: 8 };
  const position = positions[step];
  const labels = [...app.container.querySelectorAll('*')]
    .filter(el => el.childElementCount === 0 && el.textContent === `STEP ${position} OF 8`);
  assert.equal(labels.length, 1, `${step} 화면의 단계 번호`);
  const fill = labels[0].parentElement.nextElementSibling?.firstElementChild;
  assert.ok(fill, `${step} 화면의 진행 막대`);
  assert.equal(fill.style.width, `${position * 12.5}%`, `${step} 화면의 진행률`);
}

test('Review에서 자녀 정보를 수정하면 해당 요약만 갱신된다', async t => {
  const app = await mountReview(t, reviewAnswers());
  const before = structuredClone(app.current.draft);
  assertSummaries(app);
  await click(edit(app, 'Child basics'));
  await assertScreen(app, 'child', 'Tell us about your child');
  await click(control(app, 'button', '4-5 years'));
  await click(control(app, 'button', '6-8 years'));
  await click(control(app, 'button', s.common.continue));
  await assertScreen(app, 'review', 'Review 나루’s profile');
  assertSummaries(app, { ...initialSummaries, 'Child basics': '나루 · 6-8 years' });
  assert.deepEqual(app.current.draft, { ...before, ageRange: 'AGE_6_8' });
});

test('Review에서 알레르기와 식생활 유형을 각각 수정하고 다시 돌아올 수 있다', async t => {
  const app = await mountReview(t, reviewAnswers());
  const before = structuredClone(app.current.draft);
  await click(edit(app, 'Safety restrictions'));
  await assertScreen(app, 'allergies', 'Food allergies');
  await click(control(app, 'checkbox', 'Eggs'));
  await click(control(app, 'checkbox', 'Peanuts'));
  await click(control(app, 'button', s.common.continue));
  await assertScreen(app, 'review', 'Review 나루’s profile');
  assertSummaries(app, { ...initialSummaries, 'Safety restrictions': 'Allergies: Peanuts' });
  assert.deepEqual(app.current.draft, { ...before, allergies: ['PEANUTS'] });

  await click(edit(app, 'Dietary Pattern'));
  await assertScreen(app, 'family', 'Dietary Pattern');
  await click(control(app, 'radio', 'Pescatarian'));
  await click(control(app, 'button', s.common.continue));
  await assertScreen(app, 'review', 'Review 나루’s profile');
  assertSummaries(app, {
    ...initialSummaries, 'Safety restrictions': 'Allergies: Peanuts', 'Dietary Pattern': 'Pescatarian',
  });
  assert.deepEqual(app.current.draft, { ...before, allergies: ['PEANUTS'], dietaryPattern: 'pescatarian' });
});

test('Review의 감각·거부 음식 수정 화면에서 Previous를 누르면 기존 요약을 보존한다', async t => {
  const app = await mountReview(t, reviewAnswers());
  const before = structuredClone(app.current.draft);
  for (const [card, step, title] of [
    ['Sensory Profile', 'sensory', s.sensory.title],
    ['Refused foods', 'refused-foods', s.refusedFoods.title('나루')],
  ]) {
    await click(edit(app, card));
    await assertScreen(app, step, title);
    await click(previous(app));
    await assertScreen(app, 'review', 'Review 나루’s profile');
    assertSummaries(app);
    assert.deepEqual(app.current.draft, before);
  }
  assert.deepEqual(app.submissions, []);
});

test('Review 수정 후 Previous는 Review로 돌아오고, Review의 Previous는 거부 음식 단계로 간다', async t => {
  const app = await mountReview(t, reviewAnswers());
  const before = structuredClone(app.current.draft);
  await click(edit(app, 'Child basics'));
  await assertScreen(app, 'child', 'Tell us about your child');
  await click(previous(app));
  await assertScreen(app, 'review', 'Review 나루’s profile');
  assertSummaries(app);
  assert.deepEqual(app.current.draft, before);
  await click(previous(app));
  await assertScreen(app, 'refused-foods', s.refusedFoods.title('나루'));
  assert.deepEqual(app.current.draft, { ...before, step: 'refused-foods' });
  assert.deepEqual(app.submissions, []);
});
