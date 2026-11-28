// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 단위 추천 서버 응답 픽스처 추가
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 원본 식사가 있는 추천과 재생성 잔여 횟수가 포함된 홈 생성 응답 제공
// AI-generated with Claude Opus 5.5, 2026-11-28, reviewed by Jaemin Kim
// Changed: 서버 추천 응답(음식 이름·이유·재료·준비 방법)과 같은 모양으로 변경

// 서버 SuggestionResponse 와 같은 필드다. 추천은 특정 식사나 음식에 묶이지 않는다.
function suggestionResponse(overrides = {}) {
  return {
    id: '31', user_id: '1',
    what_to_try: 'Try a little', why_this_may_help: 'Familiar texture',
    ingredients: ['Potato'], preparation_method: null,
    status: 'PENDING', dismiss_reasons: [], saved_at: null, created_at: '2026-10-21T00:00:00Z',
    ...overrides,
  };
}
// 홈 생성 응답. 앱은 준비 방법이 빈 생성 결과를 받지 않는다.
function homeSuggestionResponse(overrides = {}) {
  return suggestionResponse({ preparation_method: 'Offer a small portion.', ...overrides });
}
module.exports = { suggestionResponse, homeSuggestionResponse };
