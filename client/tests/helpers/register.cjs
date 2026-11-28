// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: Load static assets in tests that import onboarding screens
const fs = require('node:fs');
const ts = require('typescript');

// Each test file runs in its own Node test process. This loader only transpiles;
// run tsc separately to check types.
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      fileName: filename,
      compilerOptions: {
        inlineSourceMap: true,
        inlineSources: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
}

for (const extension of ['.svg', '.png']) {
  require.extensions[extension] = (module, filename) => {
    module.exports = filename;
  };
}
