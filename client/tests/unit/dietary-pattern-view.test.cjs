// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Verify shared dietary radio rows and profile summaries; Dietary Pattern

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { act, renderHook } = require('../helpers/react-harness.cjs');
const { mockModules } = require('../helpers/mock-modules.cjs');
mockModules(name => {
  if (name === 'react-native') return {
    View: 'view', Text: 'text', Pressable: 'pressable', TextInput: 'input',
    Platform: { OS: 'web' }, StyleSheet: { create: s => s },
  };
  if (name.startsWith('@expo/vector-icons/')) return () => null;
  if (name.endsWith('/UiAssetIcon')) return { UiAssetIcon: () => null };
  if (name.endsWith('/DropdownChoice')) return { DropdownChoice: () => null };
  return undefined;
});
const { ChoiceStepView } = require('../../src/features/onboarding/screens/ChoiceStepView.tsx');
const { ChoiceRow } = require('../../src/components/ChoiceRow.tsx');
const { emptyDraft } = require('../../src/features/onboarding/types.ts');
const { copyFor } = require('../../src/util/strings.ts');
const { reviewRows } = require('../../src/features/onboarding/screens/reviewRows.ts');

test('all seven radio rows select through the complete label/description row', async t => {
  let selected = null;
  const props = { step: 'family', values: { ...emptyDraft(), childName: 'Max' }, language: 'en',
    onSetField: (field, value) => { assert.equal(field, 'dietaryPattern'); selected = value; } };
  const view = await renderHook(t, input => ChoiceStepView(input), { props });
  assert.equal(view.current.props.children[0].props.children, copyFor('en').onboarding.dietaryPattern.helper('Max'));
  const rows = view.current.props.children[1].props.children;
  assert.equal(rows.length, 7);
  assert.equal(rows.every(row => !row.props.selected), true);
  for (const option of rows) {
    const row = ChoiceRow(option.props);
    assert.equal(row.props.accessibilityRole, 'radio');
    assert.equal(row.props.children[1].props.children[1].props.children, option.props.subtitle);
    await act(async () => row.props.onPress());
    assert.equal(selected, option.key);
    await view.rerender({ ...props, values: { ...props.values, dietaryPattern: selected } });
    assert.equal(view.current.props.children[1].props.children.filter(row => row.props.selected).length, 1);
  }
  assert.equal(reviewRows({ ...emptyDraft(), dietaryPattern: selected }, 'en')[2].value,
    'No specific dietary pattern');
  assert.equal(reviewRows(emptyDraft(), 'en')[2].value, 'Not answered');
});
