// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 난이도 선택지와 서버 DifficultyReason(77개) 변환 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { toDifficultyReason, fromDifficultyReason } = require('../../src/data/dto/difficultyReasons.ts');
const { difficultyOptions, textureQuestions } = require('../../src/features/after-meal-review/rules.ts');

// 화면이 고를 수 있는 모든 난이도 태그. 식감은 하위 질문(textureQuestions)의 값을 쓴다.
function allTags() {
  const tags = [];
  for (const [category, values] of Object.entries(difficultyOptions)) {
    if (category === 'texture') continue;
    for (const value of values) tags.push({ category, subcategory: null, value });
  }
  for (const [subcategory, values] of Object.entries(textureQuestions)) {
    for (const value of values) tags.push({ category: 'texture', subcategory, value });
  }
  return tags;
}

test('every selectable difficulty maps to one of the 77 server reasons and back', () => {
  const tags = allTags();
  const reasons = tags.map(toDifficultyReason);
  assert.equal(reasons.length, 77);
  assert.equal(new Set(reasons).size, 77);
  for (const [index, reason] of reasons.entries()) {
    assert.match(reason, /^[A-Z_]+(\.[A-Z_]+){0,2}$/);
    assert.deepEqual(fromDifficultyReason(reason), tags[index]);
  }
});

test('reasons follow the server path format', () => {
  const reason = (tag) => toDifficultyReason({ subcategory: null, ...tag });
  assert.equal(reason({ category: 'texture', subcategory: 'hardness', value: 'soft' }), 'TEXTURE.HARDNESS.SOFT');
  assert.equal(reason({ category: 'texture', subcategory: 'stickiness', value: 'nonSticky' }), 'TEXTURE.STICKINESS.NON_STICKY');
  assert.equal(reason({ category: 'tasteType', value: 'sweet' }), 'TASTE.SWEET');
  assert.equal(reason({ category: 'pieceSize', value: 'fine' }), 'PIECE_SIZE.FINE');
  assert.equal(reason({ category: 'notSure', value: 'notSure' }), 'NOT_SURE');
});

test('unsupported categories and malformed reasons are rejected', () => {
  assert.throws(() => toDifficultyReason({ category: 'shape', subcategory: null, value: 'varied' }));
  assert.throws(() => toDifficultyReason({ category: 'texture', subcategory: null, value: 'soft' }));
  for (const value of [
    'texture.hardness.soft', 'TEXTURE.SOFT', 'TEXTURE.HARDNESS.SOFT.EXTRA', 'SHAPE.VARIED',
    'COLOR', 'NOT_SURE.NOT_SURE', 'COLOR.RED.EXTRA', '', 7, null,
  ]) assert.throws(() => fromDifficultyReason(value), undefined, String(value));
});
