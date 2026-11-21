// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 어려움 태그의 언어·제목·삭제 및 기록 화면 표시 검증
// AI-generated with Grok 4.6, 2026-11-13, reviewed by Doyeon Kim
// Changed: 어려움 추가 버튼 위치와 태그 글자 크기 검증
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 식후 어려움 편집기와 공통 사유 태그 표시 검증 분리
const { test } = require('node:test');

const assert = require('node:assert/strict');

require('../../helpers/register.cjs');

const { React, renderHook } = require('../../helpers/react-harness.cjs');

const { renderToStaticMarkup } = require('react-dom/server');

for (const ext of ['.svg', '.png']) require.extensions[ext] = (m, file) => { m.exports = file; };

const primitive = tag => ({ children, accessibilityRole, accessibilityLabel, style }) =>
  React.createElement(tag, { role: accessibilityRole, 'aria-label': accessibilityLabel,
    style: Object.assign({}, ...[style].flat(Infinity).filter(Boolean)) }, children);

require('../../helpers/mock-modules.cjs').mockModules(name => {
  if (name === 'react-native') return { View: primitive('div'), Text: primitive('span'),
    Pressable: primitive('button'), TextInput: primitive('textarea'),
    Platform: { OS: 'web' }, StyleSheet: { create: value => value } };
  if (name === '@expo/vector-icons') return { Feather: () => null };
  if (name === '@expo/vector-icons/MaterialCommunityIcons') return () => null;
  if (name === 'expo-image') return { Image: () => null };
});

const { DifficultyEditor } = require('../../../src/features/after-meal-review/components/DifficultyEditor.tsx');

const { abcCopyFor, copyFor } = require('../../../src/util/strings.ts');

function labelsFor(language) {
  const s = copyFor(language), a = abcCopyFor(language);
  return { categories: a.difficultyCategories, questions: a.subcategories,
    values: { ...s.afterMealReview.values, ...a.values }, remove: s.common.remove };
}

test('add stays on the right of the two smaller reason boxes', async t => {
  const labels = labelsFor('en');
  const editor = await renderHook(t, () => DifficultyEditor({
    foodName: 'Rice', category: 'tasteType', value: '', note: '', options: [],
    tags: [], labels, canAdd: false, showNote: false,
    onCategory: () => {}, onSubcategory: () => {}, onValue: () => {}, onNote: () => {},
    onAdd: () => {}, onRemove: () => {},
  }));
  const row = editor.current.props.children[1];
  assert.equal(row.props.style.flexDirection, 'row');
  assert.notEqual(row.props.style.flexWrap, 'wrap');
  const fields = row.props.children.filter(Boolean);
  assert.equal(fields.length, 3);
  const html = renderToStaticMarkup(editor.current);
  assert.match(html, /font-size:12px/);
});
