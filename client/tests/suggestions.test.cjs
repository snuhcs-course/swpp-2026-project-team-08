const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    filename,
  );

const { suggestionPreview } = require('../src/features/suggestions/rules.ts');

test('saved suggestion preview includes only the first sentence', () => {
  assert.equal(suggestionPreview('Try this. Another sentence.'), 'Try this.');
});
