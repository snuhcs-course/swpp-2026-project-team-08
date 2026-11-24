// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 리뷰 완료의 사진·음식·재료 결과·사유와 서버 요청 기대값
const { difficultyFixture } = require('./after-meal-difficulties.cjs');

function completionFixture() {
  const { response, draft, carrotId } = difficultyFixture();
  response.before_photo_uri = 'file:///before.png';
  draft.afterPhoto = { id: 'after', uri: 'file:///after.png', mimeType: 'image/png' };
  draft.difficulties['1'] = [{ id: 'color:yellow', category: 'color', value: 'yellow' }];
  draft.difficultyInputs['1'] = { category: 'smell', value: 'mint', note: '' };
  draft.difficultyInputs[carrotId] = { category: 'texture', subcategory: 'hardness', value: 'firm', note: '' };
  return { response, draft, carrotId };
}
function expectedReview(photo = 'file:///after.png') {
  return {
    after_photo_uri: photo,
    food_results: [
      { food_id: '1', outcome: 'EATEN', difficulty_reasons: ['COLOR.YELLOW', 'SMELL.MINT'],
        ingredient_outcomes: [{ ingredient_id: '101', outcome: 'TASTED', difficulty_reasons: ['TEXTURE.HARDNESS.FIRM'] }] },
      { food_id: '2', outcome: 'UNCLEAR', difficulty_reasons: [], ingredient_outcomes: [] },
    ],
  };
}
module.exports = { completionFixture, expectedReview };
