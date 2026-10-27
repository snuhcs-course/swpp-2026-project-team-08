// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
function profileResponse(userId = '1', { aiTraining = false } = {}) {
  return { profile: {
    user_id: userId, child_name: `Child ${userId}`, age_group: '4-5', updated_at: '2026-10-23T00:00:00Z',
    safety: { allergies: { status: 'none_known', items: [] }, restrictions: { status: 'none', items: [] } },
    food_preferences: { family_foods: [{ code: 'eggs', custom_name: null }], dietary_approaches: [], difficult_textures: [], smell_sensitivity: null,
      difficult_tastes: [], presentation_preferences: [], preferred_temperature: null, new_food_response: null },
    safe_foods: { status: 'none', items: [] },
  }, consents: [
    { id: '1', user_id: userId, kind: 'account_privacy', granted: true,
      document_version: '2026-10-21', recorded_at: '2026-10-23T00:00:00Z' },
    { id: '2', user_id: userId, kind: 'photo_analysis', granted: true,
      document_version: '2026-10-21', recorded_at: '2026-10-23T00:00:00Z' },
    { id: '3', user_id: userId, kind: 'ai_training', granted: aiTraining,
      document_version: '2026-10-21', recorded_at: '2026-10-23T00:00:00Z' },
  ] };
}
module.exports = { profileResponse };
