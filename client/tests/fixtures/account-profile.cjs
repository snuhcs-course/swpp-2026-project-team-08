// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
function profileResponse(userId = '1') {
  return { profile: {
    user_id: userId, child_name: `Child ${userId}`, age_group: '4-5', updated_at: '2026-10-23T00:00:00Z',
    safety: { allergies: { status: 'none_known', items: [] }, restrictions: { status: 'none', items: [] } },
    food_preferences: { family_foods: [], dietary_approaches: [], difficult_textures: [], smell_sensitivity: null,
      difficult_tastes: [], presentation_preferences: [], preferred_temperature: null, new_food_response: null },
    safe_foods: { status: 'none', items: [] },
  }, consents: [] };
}
module.exports = { profileResponse };
