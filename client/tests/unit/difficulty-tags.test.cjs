// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 어려움 태그의 언어·제목·삭제 및 기록 화면 표시 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { React, renderHook } = require('../helpers/react-harness.cjs');
const { renderToStaticMarkup } = require('react-dom/server');
for (const ext of ['.svg', '.png']) require.extensions[ext] = (m, file) => { m.exports = file; };
const primitive = tag => ({ children, accessibilityRole, accessibilityLabel, style }) =>
  React.createElement(tag, { role: accessibilityRole, 'aria-label': accessibilityLabel,
    style: Object.assign({}, ...[style].flat(Infinity).filter(Boolean)) }, children);
require('../helpers/mock-modules.cjs').mockModules(name => {
  if (name === 'react-native') return { View: primitive('div'), Text: primitive('span'),
    Pressable: primitive('button'), TextInput: primitive('textarea'),
    Platform: { OS: 'web' }, StyleSheet: { create: value => value } };
  if (name === '@expo/vector-icons') return { Feather: () => null };
  if (name === '@expo/vector-icons/MaterialCommunityIcons') return () => null;
  if (name === 'expo-image') return { Image: () => null };
});
const { DifficultyReasonTag } = require('../../src/components/DifficultyReasonTag.tsx');
const { DifficultyEditor } = require('../../src/features/after-meal-review/components/DifficultyEditor.tsx');
const { FoodResponseCard } = require('../../src/features/meal-log/components/FoodResponseCard.tsx');
const { abcCopyFor, copyFor } = require('../../src/util/strings.ts');
const { difficultyColorDots } = require('../../src/util/colors.ts');

function labelsFor(language) {
  const s = copyFor(language), a = abcCopyFor(language);
  return { categories: a.difficultyCategories, questions: a.subcategories,
    values: { ...s.afterMealReview.values, ...a.values }, remove: s.common.remove };
}
const cases = [
  { reason: { category: 'tasteType', value: 'sweet' }, en: 'Tastes: Sweet', ko: '맛: 단맛' },
  { reason: { category: 'texture', subcategory: 'hardness', value: 'firm' },
    en: 'Texture · How hard it feels: Firm', ko: '식감 · 단단한 정도: 단단한' },
  { reason: { category: 'texture', value: 'firm' }, en: 'Texture: Firm', ko: '식감: 단단한' },
  { reason: { category: 'smell', value: 'mint' }, en: 'Food Smells: Cool mint-like smell', ko: '음식 냄새: 시원한 민트 냄새' },
  { reason: { category: 'notSure', value: 'notSure' }, en: 'Not sure', ko: '잘 모르겠음' },
  { reason: { category: 'futureCategory', subcategory: 'futureDetail', value: 'futureValue' },
    en: 'futureCategory · futureDetail: futureValue', ko: 'futureCategory · futureDetail: futureValue' },
];

for (const language of ['en', 'ko']) {
  test(`${language}: tags show category, texture detail, and value with legacy fallbacks`, () => {
    for (const item of cases) {
      const tag = DifficultyReasonTag({ reason: item.reason, labels: labelsFor(language) });
      const text = tag.props.children.props.children[1];
      assert.equal(text.props.children[0], item[language]);
      assert.equal(tag.props.onPress, undefined);
    }
  });

  test(`${language}: editor and history use the same titled tags; only editor tags are removable`, async t => {
    const reasons = [cases[0].reason, cases[1].reason, cases[3].reason];
    const removed = [];
    const labels = labelsFor(language);
    const editor = await renderHook(t, () => DifficultyEditor({
      foodName: 'Rice', category: null, value: '', note: '', options: [],
      tags: reasons.map((reason, i) => ({ ...reason, id: `tag-${i}` })), labels,
      canAdd: false, showNote: false, onRemove: id => removed.push(id),
    }));
    const card = { name: 'Rice', kind: 'food', ingredients: [], preparation: '', servingNote: '',
      outcome: 'tasted', reasons, suggestion: null };
    const history = await renderHook(t, props => FoodResponseCard(props), {
      props: { card, language, defaultOpen: true },
    });
    const editorHtml = renderToStaticMarkup(editor.current);
    const historyHtml = renderToStaticMarkup(history.current);
    for (const expected of [cases[0], cases[1], cases[3]].map(item => item[language])) {
      assert.ok(editorHtml.includes(expected));
      assert.ok(historyHtml.includes(expected));
    }
    assert.ok(!historyHtml.includes(' ×'));
    const tags = editor.current.props.children[4].props.children;
    DifficultyReasonTag(tags[1].props).props.onPress();
    assert.deepEqual(removed, ['tag-1']);
    await history.rerender({ card: { ...card, reasons: [] }, language, defaultOpen: true });
    assert.ok(!renderToStaticMarkup(history.current).includes(copyFor(language).mealLog.reason));
  });
}

test('color tags retain a color dot and notes, and deletion announces the full reason', () => {
  const labels = labelsFor('en');
  const tag = DifficultyReasonTag({ reason: { category: 'color', value: 'red', note: 'Sauce' },
    labels, onRemove: () => {} });
  assert.equal(tag.props.accessibilityLabel, 'Remove: Colors: Red · Sauce');
  const dot = tag.props.children.props.children[0];
  assert.equal(dot.props.style[1].backgroundColor, difficultyColorDots.red);
  assert.equal(tag.props.children.props.children[1].props.children[0], 'Colors: Red · Sauce');
});
