// AI-generated with GPT-6.2 Astra, 2026-11-22, reviewed by Haechan Jung
// Changed: 저장된 단계와 추가·수정 중인 음식에 따른 이어하기 문구 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const React = require('react');
const { JSDOM } = require('jsdom');
const { mockModules } = require('../../helpers/mock-modules.cjs');
const { renderToStaticMarkup } = require('react-dom/server');
const native = require('react-native-web');
mockModules(name => {
  if (name === 'react-native') return native;
  if (name === 'react-native-safe-area-context') return { SafeAreaView: native.View };
  if (name === './AppIcon') return { AppIcon: () => null };
});
const { MealDraftResumeView } = require('../../../src/features/meal-checkin/screens/MealDraftResumeView.tsx');
const { photoDraft } = require('../../fixtures/meal-photo.cjs');

function resumeCardText(draft) {
  const html = renderToStaticMarkup(React.createElement(MealDraftResumeView, {
    draft, childName: 'Alex', language: 'ko', onContinue() {}, onBack() {},
  }));
  return JSDOM.fragment(html).textContent;
}

test('음식 편집창이 닫힌 초안에는 마지막으로 열었던 단계가 표시된다', () => {
  const draft = photoDraft();
  for (const [step, title] of [
    ['details', '식사 정보'], ['photo', '식전 사진'], ['preview', '사진 확인'], ['foods', '음식 확인'],
  ]) {
    assert.ok(resumeCardText({ ...draft, step }).includes(`이어갈 단계: ${title}`), title);
  }
});

test('기존 음식과 같은 이름의 새 음식을 입력 중이면 이어갈 단계는 음식 추가다', () => {
  const draft = photoDraft();
  const editingFood = { ...draft.foods[0], id: 'new-food' };
  const text = resumeCardText({ ...draft, step: 'foods', editingFood });
  assert.ok(text.includes('이어갈 단계: 음식 추가'));
  assert.ok(!text.includes(`이어갈 단계: ${editingFood.name} 수정`));
});

test('기존 음식의 이름을 바꾸던 초안에는 새 이름과 수정이 이어갈 단계로 표시된다', () => {
  const draft = photoDraft();
  const editingFood = { ...draft.foods[0], name: '바나나 밥' };
  const text = resumeCardText({ ...draft, step: 'foods', editingFood });
  assert.ok(text.includes('이어갈 단계: 바나나 밥 수정'));
  assert.ok(!text.includes(`이어갈 단계: ${draft.foods[0].name} 수정`));
});
