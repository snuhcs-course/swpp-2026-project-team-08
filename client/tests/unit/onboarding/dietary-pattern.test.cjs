// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Verify shared dietary radio rows and profile summaries; Dietary Pattern
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Validate current onboarding requirements and retired dietary-approach migration
// Dietary Pattern 선택 및 저장; 익숙한 음식의 조리 방법 선택 입력 검증
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 id·선택 사항 채식 단계 기준으로 수정, 직접 입력 테스트 제거
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 단계(family)와 snake_case 식별자 기준으로 수정
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 식생활 유형 테스트 분리 및 화면 구성·진행 경계 보강 · 음식 없음 응답 반영
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 식생활 초기 표시·진행 조건·Review 요약 중복 검증 제거
// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: Match dietary option ordering in the current screen
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook } = require('../../helpers/react-harness.cjs');
const { mockModules } = require('../../helpers/mock-modules.cjs');
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
const { ChoiceStepView } = require('../../../src/features/onboarding/screens/ChoiceStepView.tsx');
const { ChoiceRow } = require('../../../src/components/ChoiceRow.tsx');
const { emptyDraft } = require('../../../src/features/onboarding/types.ts');
const { copyFor } = require('../../../src/util/strings.ts');

const { canContinue, canFinish, isDraft } = require('../../../src/features/onboarding/rules.ts');

function completeDraft() {
  return { ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    childName: 'Child', ageRange: 'AGE_4_5', consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], vegetarianRestrictions: ['EGGS'], noSafeFoods: true };
}

test('식생활 유형의 이름·설명 영역을 누르면 해당 유형 하나만 선택된다', async t => {
  let selected = null;
  const props = { step: 'family', values: { ...emptyDraft(), childName: 'Max' }, language: 'en',
    onSetField: (field, value) => { assert.equal(field, 'dietaryPattern'); selected = value; } };
  const view = await renderHook(t, input => ChoiceStepView(input), { props });
  const rows = view.current.props.children[1].props.children;
  for (const option of rows) {
    const row = ChoiceRow(option.props);
    assert.equal(row.props.accessibilityRole, 'radio');
    assert.equal(row.props.children[1].props.children[1].props.children, option.props.subtitle);
    await act(async () => row.props.onPress());
    assert.equal(selected, option.key);
    await view.rerender({ ...props, values: { ...props.values, dietaryPattern: selected } });
    assert.equal(view.current.props.children[1].props.children.filter(row => row.props.selected).length, 1);
  }
});

test('식생활 유형이 없는 초안은 미응답으로 복원되고 유효한 선택값은 저장 전과 같다', () => {
  const { restoreDraft } = require('../../../src/features/onboarding/rules.ts');
  const { dietaryPatternLabel } = require('../../../src/util/dietaryPattern.ts');
  const legacy = completeDraft();
  delete legacy.dietaryPattern;
  assert.equal(restoreDraft(legacy).dietaryPattern, null);
  assert.equal(dietaryPatternLabel(null, 'en'), 'Not answered');
  assert.equal(dietaryPatternLabel('no_specific_pattern', 'en'), 'No specific dietary pattern');
  for (const dietaryPattern of [null, 'flexitarian', 'no_specific_pattern']) {
    const draft = { ...completeDraft(), dietaryPattern };
    assert.equal(canFinish(draft), true);
    assert.equal(restoreDraft(JSON.parse(JSON.stringify(draft))).dietaryPattern, dietaryPattern);
  }
  assert.equal(isDraft({ ...legacy, dietaryPattern: 'eggs' }), false);
});

test('처음에는 선택 없이 일곱 식생활 유형과 설명·닉네임 안내·추천 반영 한계를 표시한다', async t => {
  const props = {
    step: 'family', values: { ...emptyDraft(), childName: 'Max' }, language: 'en',
    onSetField: () => {},
  };
  const view = await renderHook(t, input => ChoiceStepView(input), { props });
  const [helper, choices, guidance] = view.current.props.children;
  const copy = copyFor('en').onboarding.dietaryPattern;
  const rows = choices.props.children;
  assert.equal(helper.props.children, copy.helper('Max'));
  assert.match(helper.props.children, /Max/);
  assert.equal(choices.props.accessibilityRole, 'radiogroup');
  assert.deepEqual(rows.map(row => [row.key, row.props.label]), [
    ['no_specific_pattern', 'No specific dietary pattern'],
    ['vegan', 'Vegan'],
    ['lacto_vegetarian', 'Lacto-vegetarian'],
    ['ovo_vegetarian', 'Ovo-vegetarian'],
    ['lacto_ovo_vegetarian', 'Lacto-ovo vegetarian'],
    ['pescatarian', 'Pescatarian'],
    ['flexitarian', 'Flexitarian'],
  ]);
  assert.equal(rows.every(row => !row.props.selected), true);
  for (const row of rows) {
    assert.equal(row.props.subtitle, copy.options.find(option => option.id === row.key).description);
    assert.ok(row.props.subtitle.trim());
  }
  assert.equal(guidance.props.body,
    'We’ll try to follow this dietary pattern when suggesting meals, '
    + 'but it may not be fully reflected in every suggestion.');
  await view.rerender({ ...props, values: { ...props.values, dietaryPattern: 'pescatarian' } });
  assert.deepEqual(view.current.props.children[1].props.children
    .filter(row => row.props.selected).map(row => row.props.label), ['Pescatarian']);
});

test('미응답·유효한 식생활 유형·특정 유형 없음은 다음 단계 진행을 허용한다', () => {
  for (const dietaryPattern of [null, 'vegan', 'flexitarian', 'no_specific_pattern']) {
    assert.equal(canContinue('family', { ...emptyDraft(), dietaryPattern }, ''), true);
  }
});

test('등록되지 않은 식생활 유형과 빈 문자열은 다음 단계 진행을 차단한다', () => {
  for (const dietaryPattern of ['eggs', '']) {
    assert.equal(canContinue('family', { ...emptyDraft(), dietaryPattern }, ''), false);
  }
});
