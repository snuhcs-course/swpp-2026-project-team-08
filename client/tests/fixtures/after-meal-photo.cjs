// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 사진 확인 단계의 식사와 기존 답변·재료 선택·사유 구성
const { entryMeal, unfinishedReview } = require('./after-meal-entry.cjs');

function reviewPhotoFixture(before = true) {
  const response = entryMeal();
  response.before_photo_uri = before ? 'file:///before.png' : null;
  const draft = { ...unfinishedReview(), step: 'preview' };
  return { response, draft };
}

module.exports = { reviewPhotoFixture };
