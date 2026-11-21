// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 사진 표시 실패·교체 대기 중 진행 버튼의 비활성화 경계 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
// 공통 웹·기기 모듈 환경만 사용하며 라우터나 Provider는 마운트하지 않는다.
require('../../helpers/meal-checkin-screen.cjs');
const { React, act, renderHook } = require('../../helpers/react-harness.cjs');
const { MealCheckinView } = require('../../../src/features/meal-checkin/screens/MealCheckinView.tsx');
const { MealPhotoStepsView } = require('../../../src/features/meal-checkin/screens/MealPhotoStepsView.tsx');
const { AppButton } = require('../../../src/components/AppButton.tsx');
const { photoDraft } = require('../../fixtures/meal-photo.cjs');

function findElement(node, type) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === type) return node;
  for (const child of React.Children.toArray(node.props?.children)) {
    const found = findElement(child, type);
    if (found) return found;
  }
  return null;
}

test('사진을 표시하지 못하거나 교체 중이면 음식 목록 진행 버튼이 비활성화된다', async t => {
  const props = { language: 'en', draft: photoDraft(), saveStatus: 'saved', picking: false,
    onPick: t.mock.fn() };
  const h = await renderHook(t, input => MealCheckinView(input), { props });
  const next = () => findElement(h.current, AppButton);
  const photo = () => findElement(h.current, MealPhotoStepsView);
  assert.equal(next().props.label, 'Add food item');
  assert.equal(next().props.disabled, false);

  await act(async () => photo().props.onImageError());
  assert.equal(photo().props.imageError, true);
  assert.equal(next().props.disabled, true);

  await act(async () => photo().props.onPick('gallery'));
  await h.rerender({ ...props, picking: true });
  assert.equal(props.onPick.mock.callCount(), 1);
  assert.equal(photo().props.imageError, false);
  assert.equal(next().props.disabled, true);

  await h.rerender({ ...props, draft: { ...props.draft, photo: {
    id: 'new-photo', uri: 'file:///new.png', mimeType: 'image/png',
  } } });
  assert.equal(next().props.disabled, false);
});
