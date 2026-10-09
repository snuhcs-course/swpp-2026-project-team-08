const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText,
  filename,
);

let imageLoads = true;
const getSize = (_uri, success, failure) => {
  assert.equal(typeof success, 'function');
  assert.equal(typeof failure, 'function');
  queueMicrotask(() => imageLoads ? success(100, 100) : failure(new Error('Image unavailable')));
};
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === 'react-native') return { Image: { getSize }, Platform: { OS: 'web' } };
  if (name === 'expo-image-picker' || name === 'expo-document-picker' || name === 'expo-file-system') return {};
  return originalLoad.call(this, name, ...args);
};

const { isMealPhotoReadable } = require('../src/data/device/mealPhotoPicker.ts');

test('photo readability waits for the web Image.getSize callbacks', async () => {
  const photo = { id: 'after', uri: 'data:image/png;base64,example', mimeType: 'image/png' };
  imageLoads = true;
  assert.equal(await isMealPhotoReadable(photo), true);
  imageLoads = false;
  assert.equal(await isMealPhotoReadable(photo), false);
});
