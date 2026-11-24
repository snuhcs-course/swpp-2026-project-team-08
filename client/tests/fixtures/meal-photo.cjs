// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 사진 확인 단계의 음식 상세·추천 연결 초안
const { completeDraft } = require('./meal-checkin.cjs');

function photoDraft() {
  const draft = completeDraft('1');
  const rice = { ...draft.foods[0], id: 'rice', name: 'Carrot rice',
    ingredients: ['Rice', 'Carrot'], preparation: 'steamed', servingNote: 'Small bowl', acceptance: 2 };
  const soup = { ...rice, id: 'soup', name: 'Tofu soup', ingredients: ['Tofu'],
    preparation: 'boiled', servingNote: 'Warm', acceptance: 0 };
  return { ...draft, mealDate: '2026-11-16', mealType: 'dinner', setting: 'restaurant',
    step: 'preview', photo: { id: 'before-photo', uri: 'file:///documents/original.png', mimeType: 'image/png' },
    foods: [rice, soup], editingSuggestionLink: null,
    suggestionLinks: [{ suggestionId: 'saved-1', foodId: rice.id,
      title: 'Serve a small portion', description: 'Offer rice separately.', servingTip: 'Use a small bowl.' }] };
}

module.exports = { photoDraft };
