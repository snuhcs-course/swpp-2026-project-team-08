// AI-generated with GPT-6, 2026-11-26, reviewed by Seoyeon Heo
// Changed: 현재 온보딩 완료 계약 검증
// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 자녀 프로필 거부 음식 요약 검증
// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 감각·거부 음식 및 필수 알레르기 완료 검증
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
// AI-generated with GPT-6, 2026-11-16, reviewed by Haechan Jung
// Changed: 완료 대기·실패 재시도·로컬 저장 실패·식사 진입·프로필 재열기 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act, waitFor, deferred, mountCompletion, mountDraft, failNextWrite } =
  require('../../helpers/onboarding-screen.cjs');
const { readDraft } = require('../../../src/data/storage/onboardingDraftStorage.ts');
const { readProfile } = require('../../../src/data/storage/profileStorage.ts');
const { profileResponse } = require('../../fixtures/account-profile.cjs');

function completeAnswers(overrides = {}) {
  return {
    caregiverName: 'Parent', caregiverEmail: 'parent@example.com', childName: 'Child 1', ageRange: 'AGE_4_5',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], vegetarianRestrictions: ['EGGS'],
    dietaryPattern: null,
    ...overrides,
  };
}
function noneResponse() {
  const response = profileResponse();
  return Response.json(response);
}
const expectedNoneRequest = {
  profile: {
    child_name: 'Child 1', age_group: 'AGE_4_5', restrictions: ['ALLERGY.NONE', 'VEGETARIAN.EGGS'],
    dietary_pattern: null, sensory_textures: [], sensory_note: '', refused_foods: [],
  },
  consents: [
    { kind: 'ACCOUNT_PRIVACY', granted: true },
    { kind: 'PHOTO_ANALYSIS', granted: true },
    { kind: 'AI_TRAINING', granted: false },
  ],
};
const expectedNoneProfile = {
  id: '1', caregiverName: 'Parent', caregiverEmail: 'parent@example.com', childName: 'Child 1',
  ageRange: 'AGE_4_5', consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
  allergies: ['none'], restrictions: ['none'], vegetarianRestrictions: ['EGGS'],
  dietaryPattern: null, sensoryTextures: [], sensoryNote: '', refusedFoods: [], updatedAt: '2026-10-23T00:00:00Z',
};
function control(app, role, label) {
  const matches = [...app.container.querySelectorAll(`[role="${role}"]`)]
    .filter(element => (element.getAttribute('aria-label') ?? element.textContent) === label);
  assert.equal(matches.length, 1, `${label} ${role} 요소가 하나 있어야 한다`);
  return matches[0];
}
const button = (app, label) => control(app, 'button', label);
const click = async element => act(async () => element.click());
function assertReview(app) {
  assert.equal(app.pathname, '/onboarding/review');
  assert.ok(control(app, 'heading', 'Review Child 1’s profile'));
  assert.equal(app.container.textContent.includes('You’re ready to begin'), false);
}
function assertCompleted(app) {
  assert.ok(app.container.textContent.includes('You’re ready to begin'));
  assert.ok(app.container.textContent.includes('Learn what food Child 1 can explore'));
  assert.ok(button(app, 'Go to home'));
  assert.equal(app.container.textContent.includes('Review Child 1’s profile'), false);
}

test('필수 알레르기에 답하지 않으면 완료 버튼이 비활성화되고 요청 없이 Review와 답변을 유지한다', async t => {
  const app = await mountCompletion(t, completeAnswers({ allergies: [] }));
  const before = structuredClone(app.current.draft);
  assert.equal(button(app, 'Looks good').getAttribute('aria-disabled'), 'true');
  await click(button(app, 'Looks good'));

  assertReview(app);
  assert.equal(app.submissions.length, 0);
  assert.equal(app.profile, null);
  assert.equal(await readProfile(), null);
  assert.deepEqual(app.current.draft, before);
  assert.deepEqual(await readDraft(), before);
});

// Wiki I2-US-04: 저장 성공 후 식사 기록 이용 가능. 완료 안내→홈은 현재 구현의 경로다.
test('완료하면 선택한 답변과 음식 상세를 저장하고 홈에서 식사 기록을 시작할 수 있다', async t => {
  const response = profileResponse('1', { aiTraining: true, dietaryPattern: 'PESCATARIAN' });
  response.profile.restrictions = ['ALLERGY.PEANUTS', 'DIETARY_APPROACH.GLUTEN_FREE', 'VEGETARIAN.EGGS'];
  const app = await mountCompletion(t, completeAnswers({
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: true },
    allergies: ['PEANUTS'], restrictions: ['GLUTEN_FREE'], dietaryPattern: 'pescatarian',
  }), () => Response.json(response));
  await click(button(app, 'Looks good'));
  await waitFor(() => app.current.hasDraft === false);

  assert.deepEqual(app.submissions, [{
    profile: {
      child_name: 'Child 1', age_group: 'AGE_4_5',
      restrictions: ['ALLERGY.PEANUTS', 'DIETARY_APPROACH.GLUTEN_FREE', 'VEGETARIAN.EGGS'],
      dietary_pattern: 'PESCATARIAN', sensory_textures: [], sensory_note: '', refused_foods: [],
    },
    consents: [
      { kind: 'ACCOUNT_PRIVACY', granted: true },
      { kind: 'PHOTO_ANALYSIS', granted: true },
      { kind: 'AI_TRAINING', granted: true },
    ],
  }]);
  const expectedProfile = {
    ...expectedNoneProfile, consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: true },
    allergies: ['PEANUTS'], restrictions: ['GLUTEN_FREE'], dietaryPattern: 'pescatarian',
  };
  assert.deepEqual(app.profile, expectedProfile);
  assert.deepEqual(await readProfile(), expectedProfile);
  assert.equal(await readDraft(), null);
  assertCompleted(app);

  await click(button(app, 'Go to home'));
  await waitFor(() => app.pathname === '/home'
    && app.container.textContent.includes('Log this meal'));
  assert.equal(app.container.textContent.includes('You’re ready to begin'), false);
  assert.notEqual(button(app, 'Log this meal').getAttribute('aria-disabled'), 'true');
  await click(button(app, 'Log this meal'));
  await waitFor(() => app.pathname === '/meal-checkin'
    && app.container.textContent.includes('Meal details'));
  assert.ok(control(app, 'heading', 'Meal details'));
  assert.ok(button(app, 'Continue to photo'));
  assert.deepEqual(app.profile, expectedProfile);
  assert.equal(await readDraft(), null);
});

// Wiki UAT-AC-01.3: 메모리의 완료 상태 없이 서버에서 다시 읽은 답변을 실제 화면에 표시한다.
test('완료 후 앱을 다시 열어 프로필을 조회하면 저장한 자녀 정보·제한·식생활·음식 상세가 표시된다', async t => {
  const response = profileResponse('1', { aiTraining: true, dietaryPattern: 'PESCATARIAN' });
  response.profile.child_name = '하루';
  response.profile.age_group = 'AGE_6_8';
  response.profile.restrictions = ['ALLERGY.PEANUTS', 'DIETARY_APPROACH.GLUTEN_FREE', 'VEGETARIAN.EGGS'];
  const app = await mountCompletion(t, completeAnswers({
    childName: '하루', ageRange: 'AGE_6_8',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: true },
    allergies: ['PEANUTS'], restrictions: ['GLUTEN_FREE'], dietaryPattern: 'pescatarian',
  }), () => Response.json(response));
  await click(button(app, 'Looks good'));
  await waitFor(() => app.current.hasDraft === false);
  assert.deepEqual(app.submissions, [{
    ...expectedNoneRequest,
    profile: {
      child_name: '하루', age_group: 'AGE_6_8',
      restrictions: ['ALLERGY.PEANUTS', 'DIETARY_APPROACH.GLUTEN_FREE', 'VEGETARIAN.EGGS'],
      dietary_pattern: 'PESCATARIAN', sensory_textures: [], sensory_note: '', refused_foods: [],
    },
    consents: expectedNoneRequest.consents.map(consent => ({ ...consent, granted: true })),
  }]);
  assert.equal(await readDraft(), null);
  await app.unmount();

  // 저장소만 유지하고 화면·Provider·Query 캐시는 새로 만든다.
  let fetchedProfile = false;
  const reopened = await mountDraft(t, undefined, {
    completion: true, initialPath: '/profile',
    loadProfile: () => { fetchedProfile = true; return Response.json(response); },
  });
  assert.equal(fetchedProfile, true);
  assert.ok(control(reopened, 'heading', 'My Page'));
  await click(button(reopened, '하루6-8 yearsView profile >'));
  await waitFor(() => reopened.pathname === '/child-profile');
  assert.ok(control(reopened, 'heading', 'Child Profile'));
  assert.equal(button(reopened, 'Edit').parentElement.textContent, '하루6-8 yearsEdit');
  assert.ok(button(reopened, 'Allergies & RestrictionsPeanuts, Gluten-free'));
  assert.ok(button(reopened, 'Dietary PatternPescatarian'));
  assert.ok(button(reopened, 'Refused foodsNot entered'));
  assert.equal(reopened.container.textContent.includes('Safe Foods'), false);
  assert.deepEqual(reopened.profile, {
    ...expectedNoneProfile, childName: '하루', ageRange: 'AGE_6_8',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: true },
    allergies: ['PEANUTS'], restrictions: ['GLUTEN_FREE'], dietaryPattern: 'pescatarian',
  });
  assert.deepEqual(reopened.submissions, []);
  assert.equal(reopened.current.hasDraft, false);
  assert.equal(await readDraft(), null);
});

test('선택 동의 거부·식생활 미응답·음식 없음을 제출하면 그 상태로 완료하고 보관 음식과 작성 중 입력은 전송하지 않는다', async t => {
  const app = await mountCompletion(t, completeAnswers(), noneResponse);
  await click(button(app, 'Looks good'));
  await waitFor(() => app.current.hasDraft === false);

  assert.deepEqual(app.submissions, [expectedNoneRequest]);
  assert.deepEqual(app.profile, expectedNoneProfile);
  assert.deepEqual(await readProfile(), expectedNoneProfile);
  assert.equal(await readDraft(), null);
  assertCompleted(app);
});

test('완료 직전 초안 저장이 실패하면 서버에 제출하지 않고 답변을 보존하며 Retry 성공 후에만 완료한다', async t => {
  const app = await mountCompletion(t, completeAnswers(), noneResponse);
  const before = structuredClone(app.current.draft);
  failNextWrite('nurturebites.onboarding.v1');
  await click(button(app, 'Looks good'));
  await waitFor(() => app.current.saveStatus === 'error');

  assert.deepEqual(app.submissions, []);
  assertReview(app);
  assert.ok(app.container.textContent.includes('Could not save. Retry before leaving.'));
  assert.notEqual(button(app, 'Looks good').getAttribute('aria-disabled'), 'true');
  assert.equal(button(app, 'Looks good').querySelector('[role="progressbar"]'), null);
  assert.equal(app.profile, null);
  assert.equal(await readProfile(), null);
  assert.equal(app.current.hasDraft, true);
  assert.deepEqual(app.current.draft, before);
  assert.deepEqual(await readDraft(), before);

  await click(button(app, 'Retry'));
  await waitFor(() => app.current.hasDraft === false);
  assert.deepEqual(app.submissions, [expectedNoneRequest]);
  assert.deepEqual(app.profile, expectedNoneProfile);
  assert.deepEqual(await readProfile(), expectedNoneProfile);
  assert.equal(await readDraft(), null);
  assertCompleted(app);
});

test('완료를 연속 클릭해도 요청은 한 번이며 응답 전까지 버튼이 회전 표시와 비활성 상태를 유지한다', async t => {
  const response = deferred();
  const app = await mountCompletion(t, completeAnswers(), () => response.promise);
  const before = structuredClone(app.current.draft);
  const finish = button(app, 'Looks good');
  // 한 렌더 사이의 연속 클릭과 비활성화된 뒤의 클릭을 모두 확인한다.
  await act(async () => { finish.click(); finish.click(); });
  assert.ok(button(app, 'Looks good').querySelector('[role="progressbar"][aria-label="Saving…"]'));
  await waitFor(() => app.submissions.length === 1);
  assert.equal(button(app, 'Looks good').getAttribute('aria-disabled'), 'true');
  await click(button(app, 'Looks good'));

  assert.equal(app.submissions.length, 1);
  assertReview(app);
  assert.equal(app.profile, null);
  assert.equal(await readProfile(), null);
  assert.deepEqual(app.current.draft, before);
  assert.deepEqual(await readDraft(), before);
  assert.equal(app.current.hasDraft, true);
  await act(async () => response.resolve(noneResponse()));
  await waitFor(() => app.current.hasDraft === false);
  assert.deepEqual(app.submissions, [expectedNoneRequest]);
  assert.deepEqual(app.profile, expectedNoneProfile);
  assert.equal(await readDraft(), null);
  assertCompleted(app);
  assert.equal(button(app, 'Go to home').querySelector('[role="progressbar"]'), null);
});

test('완료 실패 시 회전을 멈추고 답변을 유지하며 Retry 중 다시 버튼을 잠그고 성공 후에만 완료한다', async t => {
  let fail = true;
  const retryResponse = deferred();
  const app = await mountCompletion(t, completeAnswers(), () =>
    fail ? Response.json({}, { status: 503 }) : retryResponse.promise);
  const before = structuredClone(app.current.draft);
  await click(button(app, 'Looks good'));
  await waitFor(() => app.current.saveStatus === 'error');

  assert.deepEqual(app.submissions, [expectedNoneRequest]);
  assertReview(app);
  assert.notEqual(button(app, 'Looks good').getAttribute('aria-disabled'), 'true');
  assert.equal(button(app, 'Looks good').querySelector('[role="progressbar"]'), null);
  assert.ok(app.container.textContent.includes('Could not save. Retry before leaving.'));
  assert.equal(app.profile, null);
  assert.equal(await readProfile(), null);
  assert.deepEqual(app.current.draft, before);
  assert.deepEqual(await readDraft(), before);
  assert.equal(app.current.hasDraft, true);
  fail = false;
  await click(button(app, 'Retry'));
  await waitFor(() => app.submissions.length === 2);
  assert.equal(button(app, 'Looks good').getAttribute('aria-disabled'), 'true');
  assert.ok(button(app, 'Looks good').querySelector('[role="progressbar"][aria-label="Saving…"]'));
  await click(button(app, 'Looks good'));
  assert.equal(app.submissions.length, 2);
  assertReview(app);
  assert.equal(app.profile, null);
  assert.deepEqual(await readDraft(), before);
  await act(async () => retryResponse.resolve(noneResponse()));
  await waitFor(() => app.current.hasDraft === false);

  assert.deepEqual(app.submissions, [expectedNoneRequest, expectedNoneRequest]);
  assert.deepEqual(app.profile, expectedNoneProfile);
  assert.deepEqual(await readProfile(), expectedNoneProfile);
  assert.equal(await readDraft(), null);
  assertCompleted(app);
});

test('거부 음식과 이유가 제출되고 저장된 프로필에 복원된다', async t => {
  const food = { id: 'food-1', name: 'Apple', cookingMethod: 'pan_fried',
    reasons: [{ category: 'texture', subcategory: 'hardness', value: 'hard' }] };
  const response = profileResponse();
  response.profile.refused_foods = [{ id: 'food-1', name: 'Apple', cooking_method: 'PAN_FRIED',
    reasons: ['TEXTURE.HARDNESS.HARD'] }];
  const app = await mountCompletion(t, completeAnswers({ refusedFoods: [food] }), () => Response.json(response));
  await click(button(app, 'Looks good'));
  await waitFor(() => app.current.hasDraft === false);
  assert.deepEqual(app.submissions[0].profile.refused_foods, response.profile.refused_foods);
  assert.deepEqual(app.profile.refusedFoods, [food]);
  assert.deepEqual((await readProfile()).refusedFoods, [food]);
  assertCompleted(app);
});
