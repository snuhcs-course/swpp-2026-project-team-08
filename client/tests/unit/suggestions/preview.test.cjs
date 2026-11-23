// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: Unit 테스트를 담당 기능·공통 컴포넌트 폴더로 이동
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');

const { suggestionPreview } = require('../../../src/features/suggestions/rules.ts');

test('saved suggestion preview shows the first sentence or the complete unpunctuated text', () => {
  assert.equal(suggestionPreview('Try this. Another sentence.'), 'Try this.');
  assert.equal(suggestionPreview('Try this'), 'Try this');
  assert.equal(suggestionPreview(''), '');
});
