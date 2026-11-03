// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 restrictions 목록·대문자 enum 응답 모양으로 변경
function profileResponse(userId = '1', { aiTraining = false } = {}) {
  return { profile: {
    user_id: userId, child_name: `Child ${userId}`, age_group: 'AGE_4_5', updated_at: '2026-10-23T00:00:00Z',
    restrictions: ['ALLERGY.NONE', 'VEGETARIAN.EGGS'],
    safe_foods: [],
  }, consents: [
    { id: '1', user_id: userId, kind: 'ACCOUNT_PRIVACY', granted: true,
      document_version: '2026-10-21', recorded_at: '2026-10-23T00:00:00Z' },
    { id: '2', user_id: userId, kind: 'PHOTO_ANALYSIS', granted: true,
      document_version: '2026-10-21', recorded_at: '2026-10-23T00:00:00Z' },
    { id: '3', user_id: userId, kind: 'AI_TRAINING', granted: aiTraining,
      document_version: '2026-10-21', recorded_at: '2026-10-23T00:00:00Z' },
  ] };
}
module.exports = { profileResponse };
