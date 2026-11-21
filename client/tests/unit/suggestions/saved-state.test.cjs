// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 삭제된 mealLogApi 를 검증하던 테스트 제거, 추천 연결을 음식 카드에만 붙이도록 수정
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 식사 기록에서 음식·재료의 어려움 세부 항목 보존 검증
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: History 기존 검증을 보존하고 추천 저장 상태 검증을 분리
const { test } = require('node:test');

const assert = require('node:assert/strict');

require('../../helpers/register.cjs');

const { mockModules } = require('../../helpers/mock-modules.cjs');

mockModules((name) => {
  if (name === '@react-native-async-storage/async-storage') {
    return { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined };
  }

  if (name === 'expo-secure-store') {
    const store = {
      WHEN_UNLOCKED: 1,
      isAvailableAsync: async () => false,
      getItemAsync: async () => null,
      setItemAsync: async () => undefined,
      deleteItemAsync: async () => undefined,
    };
    return { __esModule: true, ...store, default: store };
  }
  if (name === 'expo-constants') {
    const constants = { expoConfig: { hostUri: '127.0.0.1:8081' } };
    return { __esModule: true, default: constants, ...constants };
  }
  return undefined;
});

const { applySuggestionSaved } = require('../../../src/data/storage/homeStorage.ts');

test('bookmarking a linked suggestion toggles the saved flag without dropping it on a later unsave', () => {
  const records = { meals: [], suggestions: [] };
  const draft = {
    id: 'sug-2026-10-16-dinner',
    title: 'Offer a smaller piece beside a familiar food.',
    description: 'Rolled omelet was eaten last time, so a similar texture may feel safer.',
    servingTip: 'Keep the slices thin and serve warm.',
    ingredients: ['Egg', 'Carrot'],
  };
  assert.equal(applySuggestionSaved(records, 'child-1', draft, true, 'v1'), true);
  assert.equal(records.suggestions[0].isSaved, true);
  assert.equal(applySuggestionSaved(records, 'child-1', draft, false, 'v1'), false);
  assert.equal(records.suggestions[0].isSaved, false);
  assert.equal(applySuggestionSaved(records, 'child-1', draft, true, 'v1'), true);
  assert.equal(records.suggestions[0].id, 'sug-2026-10-16-dinner');
});
