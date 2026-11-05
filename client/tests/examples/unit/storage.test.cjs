// AI-generated with GPT-6, 2026-10-31, reviewed by Haechan Jung
// Changed: 레이어별 Unit 테스트 예시

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');

const { authSession } = require('../../fixtures/auth.cjs');

// SecureStore 미지원 상태와 AsyncStorage를 공통 도구로 대체한다.
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries();
const { saveSession, clearSession } = require('../../../src/data/storage/authStorage.ts');

test('SecureStore를 사용할 수 없으면 인증 정보를 AsyncStorage에 저장한다', async (t) => {
  // 준비
  await clearSession();
  t.after(clearSession);
  const session = authSession();

  // 실행
  await saveSession(session);

  // 검증: 읽기 함수 대신 저장 매체의 결과를 직접 확인한다.
  assert.equal(values.get('nurturebites.auth.accessToken'), 'test-access');
  assert.equal(values.get('nurturebites.auth.refreshToken'), 'test-refresh');
  assert.deepEqual(JSON.parse(values.get('nurturebites.auth.user.v1')), session.user);
});
