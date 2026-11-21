// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 음식 삭제·복원의 순서·상세·추천 연결을 구분하는 초안
const { photoDraft } = require('./meal-photo.cjs');

function removalDraft() {
  const draft = photoDraft();
  const [rice, soup] = draft.foods;
  return { ...draft, step: 'foods', foods: [rice, soup,
    { ...rice, id: 'apple', name: 'Apple', ingredients: ['Apple'], preparation: 'raw',
      servingNote: 'Slices', acceptance: 3 }],
    suggestionLinks: [
      { suggestionId: '32', foodId: rice.id, title: 'Serve a small portion',
        description: 'Offer rice separately.', servingTip: 'Use a small bowl.' },
      { suggestionId: '31', foodId: soup.id, title: 'Try warm soup',
        description: 'Offer tofu soup.', servingTip: 'Serve warm.' },
    ] };
}

module.exports = { removalDraft };
