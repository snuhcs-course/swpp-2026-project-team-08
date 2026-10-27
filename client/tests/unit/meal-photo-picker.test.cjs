// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');

let imageLoads = true;

const getSize = (_uri, success, failure) => {
  assert.equal(typeof success, 'function');
  assert.equal(typeof failure, 'function');
  queueMicrotask(() => imageLoads ? success(100, 100) : failure(new Error('Image unavailable')));
};

const { mockModules } = require('../helpers/mock-modules.cjs');
mockModules((name) => {
  if (name === 'react-native') return { Image: { getSize }, Platform: { OS: 'web' } };
  if (name === 'expo-image-picker' || name === 'expo-document-picker' || name === 'expo-file-system') return {};
  return undefined;
});

const { isMealPhotoReadable } = require('../../src/data/device/mealPhotoPicker.ts');

test('photo readability waits for the web Image.getSize callbacks', async () => {
  const photo = { id: 'after', uri: 'data:image/png;base64,example', mimeType: 'image/png' };
  imageLoads = true;
  assert.equal(await isMealPhotoReadable(photo), true);
  imageLoads = false;
  assert.equal(await isMealPhotoReadable(photo), false);
});
