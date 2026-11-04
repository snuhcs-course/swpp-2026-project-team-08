// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: 익숙한 음식 폼·선택 조리 방법·토큰 삭제 상호작용 검증
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 안심 음식 없음 선택이 사라진 구조에 맞춰 검증 수정

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { mockModules } = require('../helpers/mock-modules.cjs');
const DropdownChoice = () => null;
mockModules(name => {
  if (name === 'react-native') return {
    View: 'view', Text: 'text', Pressable: 'pressable', TextInput: 'input',
    StyleSheet: { create: s => s },
  };
  if (name.startsWith('@expo/vector-icons/')) return () => null;
  if (name.endsWith('/UiAssetIcon')) return { UiAssetIcon: () => null };
  if (name.endsWith('/DropdownChoice')) return { DropdownChoice };
  return undefined;
});
const { SafeFoodsStepView } = require('../../src/features/onboarding/screens/SafeFoodsStepView.tsx');
const { FormField } = require('../../src/components/FormField.tsx');
const { AppButton } = require('../../src/components/AppButton.tsx');
const { ChoiceRow } = require('../../src/components/ChoiceRow.tsx');
const { copyFor } = require('../../src/util/strings.ts');
const { canAddSafeFood } = require('../../src/features/onboarding/rules.ts');
const { reviewRows } = require('../../src/features/onboarding/screens/reviewRows.ts');
const { emptyDraft } = require('../../src/features/onboarding/types.ts');

function elements(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(elements);
  return [node, ...elements(node.props?.children)];
}

for (const language of ['en', 'ko']) {
  test(`${language}: form stays available and only the remove control deletes a food`, () => {
    const input = { name: '', preparation: '', presentationNote: '' };
    const foods = [];
    let removed;
    const render = () => elements(SafeFoodsStepView({
      language, childName: 'Max', safeFoods: foods, input,
      canAdd: canAddSafeFood(input),
      onInputChange: (field, value) => { input[field] = value; },
      onAdd: () => {
        foods.push({ id: 'apple', ...input });
        Object.assign(input, { name: '', preparation: '', presentationNote: '' });
      },
      onRemove: id => { removed = id; },
    }));
    let tree = render();
    assert.equal(tree.find(n => n.type === AppButton).props.disabled, true);
    const fields = tree.filter(n => n.type === FormField);
    assert.equal(fields.length, 2);
    assert.equal(fields[1].props.optionalLabel, copyFor(language).onboarding.optional);
    fields[0].props.onChangeText('Apple slices');
    tree = render();
    assert.equal(tree.find(n => n.type === AppButton).props.disabled, false);
    const dropdown = tree.find(n => n.type === DropdownChoice);
    const choice = dropdown.props.options[1];
    dropdown.props.onChange(choice.id);
    tree = render();
    assert.equal(tree.find(n => n.type === DropdownChoice).props.value, choice.id);
    dropdown.props.onChange('');
    tree.find(n => n.type === AppButton).props.onPress();
    tree = render();
    assert.equal(foods[0].preparation, '');
    assert.equal(reviewRows({ ...emptyDraft(), safeFoods: foods }, language)[3].value, 'Apple slices');
    assert.equal(tree.find(n => n.type === FormField).props.value, '');
    assert.equal(tree.find(n => n.type === AppButton).props.disabled, true);
    const remove = tree.find(n => n.props?.accessibilityLabel === `${copyFor(language).common.remove} Apple slices`);
    assert.ok(remove);
    assert.equal(removed, undefined);
    remove.props.onPress();
    assert.equal(removed, 'apple');
    // "안심 음식 없음" 선택은 없고, 여러 항목을 입력할 수 있다는 안내만 항상 표시한다.
    assert.equal(tree.some(n => n.type === ChoiceRow), false);
    assert.ok(tree.some(n => n.props?.children === copyFor(language).onboarding.multipleInput));
  });
}

test('legacy free-text cooking methods remain visible in a restored form', () => {
  const input = { name: 'Apple', preparation: 'Sliced and warmed', presentationNote: 'Blue bowl' };
  const tree = elements(SafeFoodsStepView({ language: 'en', safeFoods: [],
    input, canAdd: true }));
  assert.equal(tree.find(n => n.type === DropdownChoice).props.displayFallback, input.preparation);
  assert.equal(tree.filter(n => n.type === FormField)[1].props.value, input.presentationNote);
});
