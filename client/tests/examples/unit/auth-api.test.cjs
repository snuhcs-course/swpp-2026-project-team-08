// AI-generated with GPT-6, 2026-10-31, reviewed by Haechan Jung
// Changed: mock과 다양한 응답을 사용하는 Unit 테스트 예시

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
require('../../helpers/native-boundaries.cjs').nativeBoundaries();

const { loginInput } = require('../../fixtures/auth.cjs');

const network = require('../../../src/data/network/apiClient.ts');
const { loginAccount } = require('../../../src/data/api/authApi.ts');

// 로그인 API 함수는 실제로 실행하고, 하위 요청 함수의 응답·실패만 바꾼다.
const networkError = new Error('연결 실패');
const cases = [
  {
    title: '로그인 응답을 앱 형식의 토큰으로 변환한다',
    response: { access_token: 'test-access', refresh_token: 'test-refresh' },
    expected: { accessToken: 'test-access', refreshToken: 'test-refresh' },
  },
  {
    title: '응답이 null이면 거부한다',
    response: null,
    expectedError: /Invalid login response/,
  },
  {
    title: '토큰 필드가 없으면 거부한다',
    response: {},
    expectedError: /Invalid login response/,
  },
  {
    title: '액세스 토큰이 숫자이면 거부한다',
    response: { access_token: 123, refresh_token: 'test-refresh' },
    expectedError: /Invalid login response/,
  },
  {
    title: '갱신 토큰이 없으면 거부한다',
    response: { access_token: 'test-access' },
    expectedError: /Invalid login response/,
  },
  {
    title: '네트워크 요청이 실패하면 같은 오류를 전달한다',
    requestError: networkError,
    expectedError: actual => actual === networkError,
  },
];

for (const { title, response, requestError, expected, expectedError } of cases) {
  test(title, async (t) => {
    // 준비
    const input = loginInput();
    const request = t.mock.method(network, 'apiRequest', async () => {
      if (requestError) throw requestError;
      return response;
    });

    // 실행·검증
    if (expectedError) {
      await assert.rejects(() => loginAccount(input), expectedError);
    } else {
      assert.deepEqual(await loginAccount(input), expected);
    }

    // 모든 케이스에서 요청 계약을 확인한다.
    assert.equal(request.mock.callCount(), 1);
    const [path, options] = request.mock.calls[0].arguments;
    assert.equal(path, '/api/v1/auth/login');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), input);
  });
}
