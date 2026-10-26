// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');

const { suggestionPreview } = require('../../src/features/suggestions/rules.ts');

test('saved suggestion preview shows the first sentence or the complete unpunctuated text', () => {
  assert.equal(suggestionPreview('Try this. Another sentence.'), 'Try this.');
  assert.equal(suggestionPreview('Try this'), 'Try this');
  assert.equal(suggestionPreview(''), '');
});
