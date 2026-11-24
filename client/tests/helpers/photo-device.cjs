// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: OS 사진 선택·권한·이미지 읽기·파일 복사 경계 대체

// 앱의 선택기 함수는 실제로 실행하고 Expo·기기의 응답만 제어한다.
function createPhotoDevice() {
  const device = {
    reset() {
      device.result = { canceled: true, assets: null };
      device.permissionGranted = true;
      device.readable = true;
      device.copyError = null;
      device.permissions = [];
      device.selections = [];
      device.reads = [];
      device.copies = [];
    },
    getSize(uri, success, failure) {
      device.reads.push(uri);
      queueMicrotask(() => device.readable
        ? success(100, 100) : failure(new Error('Image unavailable')));
    },
  };
  async function permission(source) {
    device.permissions.push(source);
    return { granted: device.permissionGranted };
  }
  async function select(source, options) {
    device.selections.push({ source, options });
    return device.result;
  }
  device.imagePicker = {
    requestCameraPermissionsAsync: () => permission('camera'),
    requestMediaLibraryPermissionsAsync: () => permission('gallery'),
    launchCameraAsync: options => select('camera', options),
    launchImageLibraryAsync: options => select('gallery', options),
  };
  device.documentPicker = { getDocumentAsync: options => select('files', options) };
  class Directory {
    constructor(parent, name) { this.uri = `${parent}/${name}`; }
    create() {}
  }
  class File {
    constructor(parent, name) { this.uri = name ? `${parent.uri}/${name}` : parent; }
    copy(target) {
      if (device.copyError) throw device.copyError;
      device.copies.push({ from: this.uri, to: target.uri });
    }
  }
  device.fileSystem = { Directory, File, Paths: { document: 'file:///documents' } };
  device.reset();
  return device;
}

function pickedImage(overrides = {}) {
  return { canceled: false, assets: [{ uri: 'file:///cache/meal.png', mimeType: 'image/png',
    name: 'meal.png', fileName: 'meal.png', width: 100, height: 100, ...overrides }] };
}

module.exports = { createPhotoDevice, pickedImage };
