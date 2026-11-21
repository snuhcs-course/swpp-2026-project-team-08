// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 사진 선택의 취소·권한·이미지 검증·보관·비동기 읽기 경계 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { createPhotoDevice, pickedImage } = require('../../helpers/photo-device.cjs');
const device = createPhotoDevice();
const platform = { OS: 'android' };
const { mockModules } = require('../../helpers/mock-modules.cjs');
mockModules(name => {
  if (name === 'react-native') return { Image: { getSize: (...args) => device.getSize(...args) }, Platform: platform };
  if (name === 'expo-image-picker') return device.imagePicker;
  if (name === 'expo-document-picker') return device.documentPicker;
  if (name === 'expo-file-system') return device.fileSystem;
});
const { pickMealPhoto, isMealPhotoReadable } = require('../../../src/data/device/mealPhotoPicker.ts');
beforeEach(() => { device.reset(); platform.OS = 'android'; });

test('사진 선택을 취소하면 사진을 반환하지 않고 파일을 복사하지 않는다', async () => {
  for (const source of ['camera', 'gallery', 'files']) {
    assert.equal(await pickMealPhoto(source), null);
  }
  assert.deepEqual(device.selections.map(item => item.source), ['camera', 'gallery', 'files']);
  assert.deepEqual(device.reads, []);
  assert.deepEqual(device.copies, []);
});

test('카메라·사진 보관함 권한이 거부되면 선택기를 열지 않고 권한 오류를 반환한다', async () => {
  device.permissionGranted = false;
  for (const source of ['camera', 'gallery']) {
    await assert.rejects(pickMealPhoto(source), { code: 'permission' });
  }
  assert.deepEqual(device.permissions, ['camera', 'gallery']);
  assert.deepEqual(device.selections, []);
  assert.deepEqual(device.copies, []);
});

test('지원하지 않는 형식이나 읽을 수 없는 이미지는 사진으로 받아들이지 않는다', async () => {
  device.result = pickedImage({ mimeType: 'application/pdf' });
  await assert.rejects(pickMealPhoto('files'), { code: 'image' });
  assert.deepEqual(device.reads, []);
  device.result = pickedImage();
  device.readable = false;
  await assert.rejects(pickMealPhoto('files'), { code: 'image' });
  assert.deepEqual(device.copies, []);
  assert.equal(await isMealPhotoReadable({ uri: 'file:///broken.png' }), false);
});

test('정상 이미지는 기기에서 사용할 사진 주소로 반환하고 파일 보관 실패는 성공으로 처리하지 않는다', async () => {
  // 아래 형식은 현재 구현의 지원 범위이며 PRD에서 확정한 목록은 아니다.
  for (const mimeType of ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif']) {
    device.result = pickedImage({ mimeType });
    const photo = await pickMealPhoto('files');
    assert.equal(photo.mimeType, mimeType);
    assert.match(photo.uri, /^file:\/\/\/documents\/meal-photos\//);
    assert.deepEqual(device.copies.at(-1), { from: 'file:///cache/meal.png', to: photo.uri });
  }
  device.copyError = new Error('Storage unavailable');
  await assert.rejects(pickMealPhoto('files'), /Storage unavailable/);
  const copyCount = device.copies.length;
  platform.OS = 'web';
  device.result = pickedImage({ base64: 'test-image' });
  const photo = await pickMealPhoto('gallery');
  assert.equal(photo.uri, 'data:image/png;base64,test-image');
  assert.equal(device.copies.length, copyCount);
  assert.deepEqual(device.permissions, []);
});

test('이미지 읽기 결과가 도착하기 전에는 사진 선택을 성공으로 처리하지 않는다', async t => {
  let finishRead;
  t.mock.method(device, 'getSize', (_uri, success) => { finishRead = success; });
  device.result = pickedImage();
  let settled = false;
  const pending = pickMealPhoto('files').then(photo => { settled = true; return photo; });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(typeof finishRead, 'function');
  assert.equal(settled, false);
  assert.deepEqual(device.copies, []);
  finishRead(100, 100);
  assert.ok((await pending).uri);
  assert.equal(settled, true);
});
