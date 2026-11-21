// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 기존 footer 테스트의 사진 없음과 초안 재시도 검증 보존
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { act } = require('../../helpers/meal-checkin-screen.cjs');
const React = require('react');
const { renderHook } = require('../../helpers/react-harness.cjs');
const { AfterMealReviewView } = require('../../../src/features/after-meal-review/screens/AfterMealReviewView.tsx');
const { MealFlowButton } = require('../../../src/components/MealFlowButton.tsx');
const { MealTextButton } = require('../../../src/components/MealTextButton.tsx');
const { reviewPhotoFixture } = require('../../fixtures/after-meal-photo.cjs');
const { toMealDetail } = require('../../../src/data/dto/mealDto.ts');
const { toLegacyMeal } = require('../../../src/data/dto/mealLegacyDto.ts');

function viewProps() {
  const { response, draft } = reviewPhotoFixture();
  return { language: 'en', meal: toLegacyMeal(toMealDetail(response)), draft, saveStatus: 'saved' };
}
function button(tree, label) {
  const matches = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if ((node.type === MealFlowButton || node.type === MealTextButton) && node.props.label === label) matches.push(node);
    React.Children.forEach(node.props?.children, visit);
  }
  visit(tree);
  assert.equal(matches.length, 1, label);
  return matches[0];
}

test('사진 확인 단계에서 식후 사진이 없으면 Use this photo 버튼은 비활성화된다', async t => {
  const props = viewProps();
  props.draft = { ...props.draft, afterPhoto: null };
  const h = await renderHook(t, () => AfterMealReviewView(props));
  assert.equal(button(h.current, 'Use this photo').props.disabled, true);
});

test('사진 비교 단계의 초안 저장 상태가 오류이면 Retry와 Save as Draft & Exit은 각각 재시도와 나가기 요청을 전달한다', async t => {
  const props = viewProps();
  const retry = t.mock.fn(), exit = t.mock.fn();
  const h = await renderHook(t, () => AfterMealReviewView({ ...props,
    draft: { ...props.draft, step: 'compare' }, saveStatus: 'error',
    onRetrySave: retry, onSaveExit: exit,
  }));
  await act(async () => button(h.current, 'Retry').props.onPress());
  assert.equal(retry.mock.callCount(), 1);
  assert.equal(exit.mock.callCount(), 0);
  await act(async () => button(h.current, 'Save as Draft & Exit').props.onPress());
  assert.equal(exit.mock.callCount(), 1);
  assert.equal(retry.mock.callCount(), 1);
});
