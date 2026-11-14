// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 초안 fixture 를 채식 제한 필드와 서버 연령 값으로 변경
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Validate current onboarding requirements and retired dietary-approach migration
// Dietary Pattern 선택 및 저장; 익숙한 음식의 조리 방법 선택 입력 검증
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 id·선택 사항 채식 단계 기준으로 수정, 직접 입력 테스트 제거
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 단계(family)와 snake_case 식별자 기준으로 수정
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Repair onboarding imports and connect the shared storage mock; Dietary Pattern
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: family 단계를 vegetarian 으로, 채식 제한을 선택 사항으로 수정
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 단계(family)를 선택 사항으로 되돌려 수정
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 행동별 테스트 분리 및 경로 정리
const { test } = require('node:test');

const assert = require('node:assert/strict');

require('../../helpers/register.cjs');

const { createMemoryStorage } = require('../../helpers/memory-storage.cjs');

const { values, storage } = createMemoryStorage();

const { mockModules } = require('../../helpers/mock-modules.cjs');

mockModules((name) => {
  return name === '@react-native-async-storage/async-storage' ? storage : undefined;
});

const { emptyDraft } = require('../../../src/features/onboarding/types.ts');

const { canFinish, isDraft } = require('../../../src/features/onboarding/rules.ts');

const { readProfile } = require('../../../src/data/storage/profileStorage.ts');

function completedDraft() {
  return {
    ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    childName: 'Child', ageRange: 'AGE_2_3',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], vegetarianRestrictions: ['DAIRY'],
  };
}

test('invalid persisted profile and draft are rejected at their boundaries', async () => {
  values.clear();
  values.set('nurturebites.profile.v1', JSON.stringify({ id: 'broken' }));
  await assert.rejects(readProfile());
  assert.equal(isDraft({ ...completedDraft(), step: 'unknown' }), false);
  assert.equal(canFinish({ ...completedDraft(), caregiverEmail: 'invalid' }), false);
});

function completeDraft() {
  return { ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    childName: 'Child', ageRange: 'AGE_4_5', consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], vegetarianRestrictions: ['EGGS'] };
}

test('retired steps are omitted on restore and resume at the dietary pattern step', () => {
  const { restoreDraft } = require('../../../src/features/onboarding/rules.ts');
  for (const step of ['approaches', 'vegetarian']) {
    const restored = restoreDraft({ ...completeDraft(), step, approaches: [] });
    assert.deepEqual(restored, { ...completeDraft(), step: 'family' });
    assert.equal(canFinish(restored), true);
  }
});

test('saved vegetarian restrictions survive a draft restore even without an input screen', () => {
  const { restoreDraft } = require('../../../src/features/onboarding/rules.ts');
  const draft = { ...completeDraft(), vegetarianRestrictions: ['EGGS', 'POULTRY'], step: 'review' };
  assert.deepEqual(restoreDraft(JSON.parse(JSON.stringify(draft))).vegetarianRestrictions,
    ['EGGS', 'POULTRY']);
});

test('draft validation rejects missing fields and invalid consent types', () => {
  assert.equal(isDraft(emptyDraft()), true);
  for (const invalid of [null, {}, { ...emptyDraft(), step: 'unknown' },
    { ...emptyDraft(), consent: { accountPrivacy: 'true' } }, { ...emptyDraft(), safeFoodInput: null }]) {
    assert.equal(isDraft(invalid), false);
  }
});

const { restoreDraft } = require("../../../src/features/onboarding/rules.ts");

test("a retired saved step preserves answers and removes obsolete draft fields", () => {
  const draft = completedDraft();
  assert.deepEqual(
    restoreDraft({
      ...draft,
      step: "retired-step",
      obsoleteSelections: ["old"],
    }),
    { ...draft, step: "family" },
  );
  for (const step of [
    "texture",
    "smell",
    "taste",
    "presentation",
    "temperature",
    "familiarity",
  ]) {
    assert.deepEqual(
      restoreDraft({
        ...draft,
        step,
        texture: ["soft"],
        smell: "yes",
        taste: ["sour"],
        presentation: ["separate"],
        temperature: "warm",
        familiarity: "plate",
      }),
      { ...draft, step: "family" },
    );
  }
  assert.deepEqual(
    restoreDraft({
      ...draft,
      step: "safe-foods",
      texture: ["soft"],
      familiarity: "plate",
    }),
    { ...draft, step: "safe-foods" },
  );
  assert.equal(restoreDraft({ step: "retired-step" }), null);
});
