// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: 익숙한 음식 폼·선택 조리 방법·토큰 삭제 상호작용 검증
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 안심 음식 없음 선택이 사라진 구조에 맞춰 검증 수정
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Validate current onboarding requirements and retired dietary-approach migration
// Dietary Pattern 선택 및 저장; 익숙한 음식의 조리 방법 선택 입력 검증
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 id·선택 사항 채식 단계 기준으로 수정, 직접 입력 테스트 제거
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 단계(family)와 snake_case 식별자 기준으로 수정
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 행동별 테스트 분리 및 경로 정리 · 음식 없음 응답 반영
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { renderHook } = require('../../helpers/react-harness.cjs');
const { mockModules } = require('../../helpers/mock-modules.cjs');
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
const { SafeFoodsStepView } = require('../../../src/features/onboarding/screens/SafeFoodsStepView.tsx');
const { FormField } = require('../../../src/components/FormField.tsx');
const { AppButton } = require('../../../src/components/AppButton.tsx');
const { ChoiceRow } = require('../../../src/components/ChoiceRow.tsx');
const { copyFor } = require('../../../src/util/strings.ts');
const { canAddSafeFood, matchingSafeFoods } = require('../../../src/features/onboarding/rules.ts');
const { reviewRows } = require('../../../src/features/onboarding/screens/reviewRows.ts');
const { emptyDraft } = require('../../../src/features/onboarding/types.ts');

function elements(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(elements);
  return [node, ...elements(node.props?.children)];
}

for (const language of ['en', 'ko']) {
  test(`${language}: 입력 폼을 유지하고 삭제 버튼은 지정한 음식만 전달한다`, async t => {
    const input = { name: '', preparation: '', presentationNote: '' };
    const foods = [];
    let removed;
    const props = () => ({
      language, childName: 'Max', safeFoods: foods, input, noSafeFoods: false, onToggleNone: () => {},
      canAdd: canAddSafeFood(input),
      onInputChange: (field, value) => { input[field] = value; },
      onAdd: () => {
        foods.push({ id: 'apple', ...input });
        Object.assign(input, { name: '', preparation: '', presentationNote: '' });
      },
      onRemove: id => { removed = id; },
    });
    const view = await renderHook(t, () => SafeFoodsStepView(props()));
    const render = async () => { await view.rerender(); return elements(view.current); };
    let tree = await render();
    assert.equal(tree.find(n => n.type === AppButton).props.disabled, true);
    const fields = tree.filter(n => n.type === FormField);
    assert.equal(fields.length, 3);
    assert.equal(fields[1].props.optionalLabel, copyFor(language).onboarding.optional);
    fields[0].props.onChangeText('Apple slices');
    tree = await render();
    assert.equal(tree.find(n => n.type === AppButton).props.disabled, false);
    fields[1].props.onChangeText('Sliced and warmed');
    tree = await render();
    assert.equal(tree.filter(n => n.type === FormField)[1].props.value, 'Sliced and warmed');
    fields[1].props.onChangeText('');
    tree.find(n => n.type === AppButton).props.onPress();
    tree = await render();
    assert.equal(foods[0].preparation, '');
    assert.equal(reviewRows({ ...emptyDraft(), safeFoods: foods }, language)[3].value, 'Apple slices');
    assert.equal(tree.find(n => n.type === FormField).props.value, '');
    assert.equal(tree.find(n => n.type === AppButton).props.disabled, true);
    const remove = tree.find(n => n.props?.accessibilityLabel === `${copyFor(language).common.remove} Apple slices`);
    assert.ok(remove);
    assert.equal(removed, undefined);
    remove.props.onPress();
    assert.equal(removed, 'apple');
    assert.equal(tree.find(n => n.type === ChoiceRow).props.selected, false);
    assert.ok(tree.some(n => n.props?.children === copyFor(language).onboarding.multipleInput));
  });
}

test('기존 제공 형태와 추가 설명을 자유 입력칸에 그대로 표시한다', async t => {
  const input = { name: 'Apple', preparation: 'Sliced and warmed', presentationNote: 'Blue bowl' };
  const view = await renderHook(t, () => SafeFoodsStepView({ language: 'en', safeFoods: [],
    noSafeFoods: false, input, canAdd: true }));
  const tree = elements(view.current);
  assert.equal(tree.filter(n => n.type === FormField)[1].props.value, input.preparation);
  assert.equal(tree.filter(n => n.type === FormField)[2].props.value, input.presentationNote);
});

function completeDraft() {
  return { ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    childName: 'Child', ageRange: 'AGE_4_5', consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], vegetarianRestrictions: ['EGGS'] };
}

test('safe foods require a nonblank name; cooking method is optional', () => {
  assert.equal(canAddSafeFood({ name: 'Rice', preparation: 'Boiled' }), true);
  assert.equal(canAddSafeFood({ name: ' ', preparation: 'Boiled' }), false);
  assert.equal(canAddSafeFood({ name: 'Rice', preparation: ' ' }), true);
  assert.equal(canAddSafeFood({ name: 'Rice', preparation: '' }), true);
  assert.equal(canAddSafeFood({ name: '', preparation: '' }), false);
});

test('safe food warnings match a selected allergy but ignore none', () => {
  const draft = { ...completeDraft(), allergies: ['EGGS'], safeFoods: [
    { name: 'Eggs soup', preparation: 'Boiled' }, { name: 'Rice', preparation: 'Boiled' },
  ] };
  assert.deepEqual(matchingSafeFoods(draft, 'en'), ['Eggs soup']);
  assert.deepEqual(matchingSafeFoods({ ...draft, allergies: ['none'] }, 'en'), []);
});
