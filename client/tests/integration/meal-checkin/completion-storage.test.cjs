// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 대문자 enum·음식 id 없는 저장 요청·식사 상세 저장 응답 기준으로 수정
// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 서버·기기 저장 분리 반영 및 완료 화면 흐름으로 중복 검증 이동
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 초안·완료 저장 순서와 추천 연결 보존 검증 분리
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { completeDraft } = require('../../fixtures/meal-checkin.cjs');
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries();
const { clearSession } = require('../../../src/data/storage/authStorage.ts');
beforeEach(async () => { values.clear(); await clearSession(); });
const { newDraft, mealFromDraft } = require('../../../src/features/meal-checkin/rules.ts');
const { newFood } = require('../../../src/rules/foodDraft.ts');
const { isDraft } = require('../../../src/data/storage/mealValidation.ts');
const { readMealDraft, saveMealDraft, saveMeal } = require('../../../src/data/storage/mealStorage.ts');

test('초안 저장과 완료 저장을 연속 요청하면 최종 저장된 초안 단계는 complete이다', async () => {
  const draft = completeDraft('ordering');
  await Promise.all([saveMealDraft({ ...draft, step: 'foods' }), saveMeal(mealFromDraft(draft))]);
  assert.equal((await readMealDraft('ordering')).step, 'complete');
});

test('초안과 식사를 로컬에 저장하면 수용도 0·추천 연결을 보존하고 시도 피드백은 만들지 않는다', async () => {
  const draft = newDraft('abc-links');
  draft.mealType = 'lunch'; draft.setting = 'home';
  draft.foods = [{ ...newFood(), id: 'served', name: 'Rice', acceptance: 0, confirmed: true, source: 'ai' }];
  draft.suggestionLinks = [{ suggestionId: 'saved-idea', foodId: 'served', title: 'Rice', description: 'Offer a small portion' }];
  assert.equal(isDraft(draft, draft.childId), true);
  assert.equal(isDraft({ ...draft, foods: [{ ...draft.foods[0], acceptance: 4 }] }, draft.childId), false);
  assert.equal(isDraft({ ...draft, suggestionLinks: [{ ...draft.suggestionLinks[0], foodId: 'missing' }] }, draft.childId), false);
  await saveMealDraft(draft);
  assert.deepEqual((await readMealDraft(draft.childId)).suggestionLinks, draft.suggestionLinks);
  const saved = await saveMeal(mealFromDraft(draft));
  assert.equal(saved.foods[0].acceptance, 0);
  assert.equal(saved.foods[0].source, 'ai');
  assert.equal(saved.foods[0].confirmed, true);
  assert.deepEqual(saved.suggestionLinks, draft.suggestionLinks);
  assert.equal(saved.suggestionFeedback, undefined);
});
