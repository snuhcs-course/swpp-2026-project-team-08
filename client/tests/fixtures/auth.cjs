// AI-generated with GPT-6, 2026-10-31, reviewed by Haechan Jung
// Changed: 인증 예시의 공통 입력 fixture

function loginInput(email = 'parent@example.com') {
  return { email, password: 'test-password' };
}

function authSession() {
  return {
    accessToken: 'test-access',
    refreshToken: 'test-refresh',
    user: { id: '1', email: 'parent@example.com', fullName: '보호자' },
  };
}

module.exports = { loginInput, authSession };
