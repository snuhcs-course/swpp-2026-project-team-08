// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 기본 입력·입력 수정·취소 후 재개의 대표 사용자 흐름 검증
const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { mountMeal, control, click, waitFor, act, nativeDatePicker }
  = require('../../helpers/meal-checkin-screen.cjs');
const { readMealDraft } = require('../../../src/data/storage/mealStorage.ts');

const previousTimezone = process.env.TZ;
process.env.TZ = 'Asia/Seoul';
after(() => {
  if (previousTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = previousTimezone;
});

beforeEach(t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 10, 17, 11).getTime() });
});

// RN Web은 accessibilityState.selected를 내보내지 않아 화면의 선택 강조를 확인한다.
const selected = element => window.getComputedStyle(element).borderWidth === '2px';

function assertChoices(app, mealType, setting) {
  for (const label of ['Breakfast', 'Lunch', 'Dinner', 'Snack']) {
    assert.equal(selected(control(app, 'button', label)), label === mealType, label);
  }
  for (const label of ['Home', 'Restaurant', 'School', 'Others']) {
    assert.equal(selected(control(app, 'button', label)), label === setting, label);
  }
}

async function continueToPhoto(app) {
  const next = control(app, 'button', 'Continue to photo');
  assert.notEqual(next.getAttribute('aria-disabled'), 'true');
  await click(next);
  await waitFor(() => app.container.textContent.includes('Add a before-meal photo'));
  assert.ok(control(app, 'button', 'Take a photo'));
  assert.equal(app.container.textContent.includes('Continue to photo'), false);
}

function assertDetailsScreen(app) {
  assert.ok(control(app, 'heading', 'Meal details'));
  assert.ok(control(app, 'button', 'Continue to photo'));
  assert.equal(app.container.textContent.includes('Add a before-meal photo'), false);
}

function assertSelectedDetails(app) {
  assertDetailsScreen(app);
  assert.ok(control(app, 'button', '16 November 2026'));
  assertChoices(app, 'Dinner', 'Restaurant');
}

async function selectPastMeal(app) {
  await click(control(app, 'button', 'Dinner'));
  await click(control(app, 'button', 'Restaurant'));
  await click(control(app, 'button', 'Today · 17 November'));
  await click(control(app, 'button', 'Day'));
  await click(control(app, 'button', '16'));
  await click(control(app, 'button', 'Confirm date'));
}

test('장소 없이 사진 단계로 갔다가 돌아와 장소를 선택·변경·해제해도 다시 사진 단계로 진행할 수 있다', async t => {
  const app = await mountMeal(t);
  assert.ok(control(app, 'button', 'Today · 17 November'));
  assertChoices(app, 'Lunch', null);
  await continueToPhoto(app);
  await click(control(app, 'button', 'Go back'));
  assertDetailsScreen(app);
  assertChoices(app, 'Lunch', null);

  assert.ok([...app.container.querySelectorAll('*')].some(node => node.textContent === 'Setting'));
  assert.equal(app.container.textContent.includes('Optional'), false);
  await click(control(app, 'button', 'Restaurant'));
  assertChoices(app, 'Lunch', 'Restaurant');
  await click(control(app, 'button', 'School'));
  assertChoices(app, 'Lunch', 'School');
  await click(control(app, 'button', 'School'));
  assertChoices(app, 'Lunch', null);
  await continueToPhoto(app);
  assert.equal((await readMealDraft('1')).setting, null);
  await click(control(app, 'button', 'Go back'));
  assertDetailsScreen(app);
  assertChoices(app, 'Lunch', null);
});

test('어제 저녁·식당으로 수정하고 선택한 저녁을 다시 눌러도 사진 단계 왕복 후 같은 식사 정보가 표시된다', async t => {
  const app = await mountMeal(t);
  await selectPastMeal(app);
  assertSelectedDetails(app);
  await click(control(app, 'button', 'Dinner'));
  assertSelectedDetails(app);
  await continueToPhoto(app);
  await click(control(app, 'button', 'Go back'));
  assertSelectedDetails(app);
});

test('날짜 변경을 취소했다가 다시 확정하고 나간 뒤 다음 날 이어가면 저장한 날짜·유형·장소로 사진 단계에 진입한다', async t => {
  const app = await mountMeal(t);
  const platform = require('react-native-web').Platform;
  const originalOS = platform.OS;
  platform.OS = 'ios';
  t.after(() => { platform.OS = originalOS; });
  await click(control(app, 'button', 'Dinner'));
  await click(control(app, 'button', 'Restaurant'));
  await click(control(app, 'button', 'Today · 17 November'));
  await waitFor(() => document.querySelector('[data-testid="native-date-picker"]'));
  await act(async () => nativeDatePicker.props.onValueChange({}, new Date(Date.UTC(2026, 10, 16))));
  await click(control(app.modal, 'button', 'Close'));
  await waitFor(() => !document.querySelector('[data-testid="native-date-picker"]'));
  assertDetailsScreen(app);
  assert.ok(control(app, 'button', 'Today · 17 November'));
  assertChoices(app, 'Dinner', 'Restaurant');

  await click(control(app, 'button', 'Today · 17 November'));
  await waitFor(() => document.querySelector('[data-testid="native-date-picker"]'));
  await act(async () => nativeDatePicker.props.onValueChange({}, new Date(Date.UTC(2026, 10, 16))));
  await click(control(app.modal, 'button', 'Confirm date'));
  await waitFor(() => !document.querySelector('[data-testid="native-date-picker"]'));
  assertSelectedDetails(app);
  await click(control(app, 'button', 'Go back'));
  await waitFor(() => app.pathname === '/home');

  await app.unmount();
  t.mock.timers.setTime(new Date(2026, 10, 18, 7).getTime());
  const reopened = await mountMeal(t);
  assert.ok(reopened.container.textContent.includes('Ongoing Meal'));
  assert.equal(reopened.container.textContent.includes('Continue to photo'), false);
  await click(control(reopened, 'button', 'Continue draft'));
  assertSelectedDetails(reopened);
  await continueToPhoto(reopened);
  await click(control(reopened, 'button', 'Go back'));
  assertSelectedDetails(reopened);
});
