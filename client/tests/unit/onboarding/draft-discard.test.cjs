// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 요약 함수와 단계 이름을 채식 제한 기준으로 수정
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 채식 제한 요약을 제거하고 식생활 유형 단계(family) 이동 기준으로 수정
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 익숙한 음식 미응답과 명시적 없음 요약 구분
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 프로필 표시·계정 입력·온보딩 이동·초안 폐기 검증 분리
const { test } = require('node:test');

const assert = require('node:assert/strict');

require('../../helpers/register.cjs');

const { createDraftSaveGate } = require('../../../src/features/onboarding/draftSaveGate.ts');

test('discard waits out an in-flight save so a deleted draft is not rewritten', async () => {
  let stored = 'kept';
  let release;
  const blocked = new Promise((resolve) => { release = resolve; });
  const gate = createDraftSaveGate();
  const writing = gate.persist(async () => {
    await blocked;
    stored = 'stale';
  });
  const discarded = gate.discard(async () => { stored = null; });
  release();
  await writing;
  await discarded;
  assert.equal(stored, null);
});
