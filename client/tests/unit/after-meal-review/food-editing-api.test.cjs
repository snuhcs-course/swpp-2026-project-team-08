// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-03, reviewed by Seoyeon Heo
// Changed: Ingredient difficulty API coverage and selection/note round trips
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식·재료 안 리뷰 결과, 난이도 사유 문자열, 기존 음식 id 갱신 계약으로 수정
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 재료 난이도 저장·복원 테스트를 서버 난이도 사유 문자열 기준으로 수정
// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: 사유 코드 저장·메모 제외·폐기 분류 거부 검증
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 음식 편집 API와 리뷰 완료 API 검증을 행동별로 분리
const { test } = require("node:test");

const assert = require("node:assert/strict");

require("../../helpers/register.cjs");

let request;

const { mockModules } = require("../../helpers/mock-modules.cjs");

const restoreMocks = mockModules((name) => {
  if (name.endsWith("/network/apiClient"))
    return { apiRequest: (...params) => request(...params) };
  return undefined;
});

const { updateReviewMealFoods } = require("../../../src/data/api/mealFoodsApi.ts");

restoreMocks();

const response = {
  id: "8",
  user_id: "1",
  meal_date: "2026-10-21",
  meal_type: "LUNCH",
  setting: "HOME",
  before_photo_uri: null,
  after_photo_uri: null,
  saved_at: "2026-10-21T00:00:00Z",
  foods: [
    {
      id: "2",
      meal_id: "8",
      name: "Potato",
      ingredients: [
        { id: "212", name: "Potato", outcome: null, difficulty_reasons: [] },
      ],
      cooking_method: null,
      serving_note: null,
      acceptance: null,
      outcome: null,
      difficulty_reasons: [],
      recommendation_tries: [],
    },
  ],
};

test("food edit sends IDs only for existing foods and maps the new food to its server ID", async () => {
  request = async (path, init) => {
    assert.equal(path, "/api/v1/meals/8/foods");
    assert.equal(init.method, "PUT");
    const foods = JSON.parse(init.body).foods;
    assert.deepEqual(
      foods.map((food) => food.id),
      ["1", undefined],
    );
    assert.deepEqual(foods[1].ingredients, [{ name: "Potato" }]);
    return {
      ...response,
      foods: [
        { ...response.foods[0], id: "1", name: "Rice", ingredients: [] },
        { ...response.foods[0], id: "3", name: "Potato" },
      ],
    };
  };
  const foods = [
    {
      id: "1",
      name: "Rice",
      ingredients: [],
      preparation: "",
      servingNote: "",
      source: "parent",
      confirmed: true,
    },
    {
      id: "new-food",
      name: "Potato",
      ingredients: ["Potato"],
      preparation: "",
      servingNote: "",
      source: "parent",
      confirmed: true,
    },
  ];
  const result = await updateReviewMealFoods("8", foods, ["1", "2"]);
  assert.equal(result.foodIdMap.get("1"), "1");
  assert.equal(result.foodIdMap.get("new-food"), "3");
});
