// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Dietary Pattern 선택 및 저장
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 restrictions 목록·대문자 enum 계약 기준으로 변환 테스트 재작성
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 변환과 선택 입력인 조리 방법 검증을 새 계약에 맞게 수정
// AI-generated with GPT-6, 2026-11-03, reviewed by Seoyeon Heo
// Changed: Verify meal flow actions and shared three-step after-meal progress
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 선택지 id·채식 단계 기준으로 테스트 수정, 카탈로그 검색 테스트 교체
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: 추천 모달 안전 여백 및 추천 연결·언어 버튼 및 공통 Outcome 헤더 검증
// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: Eaten 단계 생략 및 언어 버튼 숨김 검증
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 애니메이션 바텀시트의 네이티브 컴포넌트 대체 지원
// AI-generated with Grok 4.6, 2026-11-13, reviewed by Doyeon Kim
// Changed: 음식 편집에서 저장 추천 연결 검증
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 테스트 분리 및 익숙한 음식 응답 상태 변환 검증
const { test } = require("node:test");
const assert = require("node:assert/strict");
require("../../helpers/register.cjs");

let response;

let request;

const { mockModules } = require("../../helpers/mock-modules.cjs");
mockModules((name) => {
  if (name === "../network/apiClient")
    return {
      apiRequest: async (path, init) => {
        request = { path, init };
        return response;
      },
    };
  if (name === "../storage/authStorage")
    return {
      isUserId: (value) =>
        typeof value === "string" && /^[1-9][0-9]*$/.test(value),
    };
  return undefined;
});

const {
  toOnboardingWrite,
  fromOnboardingResponse,
  readOnboarding,
  writeOnboarding,
} = require("../../../src/data/api/onboardingApi.ts");

const account = { id: "12", email: "parent@example.com", fullName: "Parent" };
const profile = {
  id: "12",
  caregiverName: "Parent",
  caregiverEmail: "parent@example.com",
  childName: "Child",
  ageRange: "AGE_4_5",
  consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
  allergies: ["EGGS", "SESAME"],
  restrictions: ["GLUTEN_FREE"],
  vegetarianRestrictions: ["EGGS", "POULTRY"],
  safeFoods: [
    {
      id: "local-1",
      name: "Potato",
      preparation: "Boiled",
      presentationNote: "",
    },
    {
      id: "501",
      name: "Egg",
      preparation: "Steamed",
      presentationNote: "Small pieces",
    },
  ],
  updatedAt: "2026-10-21T00:00:00Z",
};

const serverRestrictions = [
  "ALLERGY.EGGS",
  "ALLERGY.SESAME",
  "DIETARY_APPROACH.GLUTEN_FREE",
  "VEGETARIAN.EGGS",
  "VEGETARIAN.POULTRY",
];

function serverResponse() {
  return {
    profile: {
      user_id: "12",
      child_name: "Child",
      age_group: "AGE_4_5",
      restrictions: [...serverRestrictions],
      dietary_pattern: null,
      safe_foods: [
        {
          id: "502",
          name: "Potato",
          preparation: "Boiled",
          presentation_note: null,
        },
        {
          id: "501",
          name: "Egg",
          preparation: "Steamed",
          presentation_note: "Small pieces",
        },
      ],
      updated_at: "2026-10-21T12:00:00+09:00",
    },
    consents: [
      {
        id: "1",
        user_id: "12",
        kind: "ACCOUNT_PRIVACY",
        granted: true,
        document_version: "2026-10-21",
        recorded_at: "2026-10-21T12:00:00+09:00",
      },
      {
        id: "2",
        user_id: "12",
        kind: "PHOTO_ANALYSIS",
        granted: true,
        document_version: "2026-10-21",
        recorded_at: "2026-10-21T12:00:00+09:00",
      },
      {
        id: "3",
        user_id: "12",
        kind: "AI_TRAINING",
        granted: false,
        document_version: "2026-10-21",
        recorded_at: "2026-10-21T12:00:00+09:00",
      },
    ],
  };
}

test("onboarding write prefixes restriction categories and never sends safe food IDs", () => {
  const body = toOnboardingWrite(profile);
  assert.equal(body.profile.age_group, "AGE_4_5");
  assert.deepEqual(body.profile.restrictions, serverRestrictions);
  // 식생활 유형을 고르지 않으면 null 을 보낸다.
  assert.equal(body.profile.dietary_pattern, null);
  assert.deepEqual(body.profile.safe_foods, [
    { name: "Potato", preparation: "Boiled", presentation_note: null },
    { name: "Egg", preparation: "Steamed", presentation_note: "Small pieces" },
  ]);
  assert.deepEqual(body.consents, [
    { kind: "ACCOUNT_PRIVACY", granted: true },
    { kind: "PHOTO_ANALYSIS", granted: true },
    { kind: "AI_TRAINING", granted: false },
  ]);
});

test("none answers become ALLERGY.NONE or are omitted", () => {
  const body = toOnboardingWrite({
    ...profile,
    allergies: ["none"],
    restrictions: ["none"],
    vegetarianRestrictions: [],
  });
  assert.deepEqual(body.profile.restrictions, ["ALLERGY.NONE"]);
});

test("server profile restores app shape with server IDs", () => {
  const restored = fromOnboardingResponse(serverResponse(), account);
  assert.equal(restored.id, "12");
  assert.equal(restored.ageRange, "AGE_4_5");
  assert.deepEqual(restored.allergies, ["EGGS", "SESAME"]);
  assert.deepEqual(restored.restrictions, ["GLUTEN_FREE"]);
  assert.deepEqual(restored.vegetarianRestrictions, ["EGGS", "POULTRY"]);
  assert.deepEqual(restored.consent, {
    accountPrivacy: true,
    photoAnalysis: true,
    aiTraining: false,
  });
  assert.deepEqual(
    restored.safeFoods.map((item) => item.id),
    ["502", "501"],
  );
  assert.equal(restored.caregiverEmail, account.email);
  assert.throws(() =>
    fromOnboardingResponse(serverResponse(), { ...account, id: "13" }),
  );
});

test("missing categories restore as none answers and empty lists", () => {
  const source = serverResponse();
  source.profile.restrictions = ["ALLERGY.NONE"];
  source.profile.safe_foods = [];
  const restored = fromOnboardingResponse(source, account);
  assert.deepEqual(restored.allergies, ["none"]);
  assert.deepEqual(restored.restrictions, ["none"]);
  assert.deepEqual(restored.vegetarianRestrictions, []);
  assert.deepEqual(restored.safeFoods, []);
});

test("onboarding API reads and writes the authenticated account path", async () => {
  response = serverResponse();
  assert.equal((await readOnboarding()).profile.user_id, "12");
  assert.deepEqual(request, { path: "/api/v1/onboarding", init: undefined });
  assert.equal(
    (await writeOnboarding(profile)).profile.safe_foods[0].id,
    "502",
  );
  assert.equal(request.path, "/api/v1/onboarding");
  assert.equal(request.init.method, "PUT");
  assert.deepEqual(
    JSON.parse(request.init.body).profile.safe_foods.map((food) => "id" in food),
    [false, false],
  );
  response = { profile: { user_id: "not-an-id" }, consents: [] };
  await assert.rejects(readOnboarding());
});

// 앱 안의 식생활 유형 값은 소문자 snake_case 이고 서버와는 대문자 값으로 주고받는다.
const dietaryPatterns = [
  [null, null],
  ["vegan", "VEGAN"],
  ["lacto_vegetarian", "LACTO_VEGETARIAN"],
  ["ovo_vegetarian", "OVO_VEGETARIAN"],
  ["lacto_ovo_vegetarian", "LACTO_OVO_VEGETARIAN"],
  ["pescatarian", "PESCATARIAN"],
  ["flexitarian", "FLEXITARIAN"],
  ["no_specific_pattern", "NO_SPECIFIC_PATTERN"],
];

for (const [pattern, wire] of dietaryPatterns) {
  test(`API converts dietary pattern ${pattern} to ${wire} without touching restrictions`, async () => {
    const source = { ...profile, dietaryPattern: pattern };
    const body = toOnboardingWrite(source);
    assert.equal(body.profile.dietary_pattern, wire);
    assert.deepEqual(body.profile.restrictions, serverRestrictions);
    response = serverResponse();
    response.profile.dietary_pattern = wire;
    const saved = await writeOnboarding(source);
    const restored = fromOnboardingResponse(saved, account);
    assert.equal(restored.dietaryPattern, pattern);
    assert.deepEqual(restored.allergies, source.allergies);
    assert.deepEqual(restored.restrictions, source.restrictions);
    assert.deepEqual(restored.vegetarianRestrictions, source.vegetarianRestrictions);
  });
}

test("save fails when the server loses the selected pattern; unknown patterns are rejected", async () => {
  response = serverResponse();
  await assert.rejects(writeOnboarding({ ...profile, dietaryPattern: "flexitarian" }));
  for (const wire of ["flexitarian", "EGGS", "lacto-vegetarian"]) {
    response = serverResponse();
    response.profile.dietary_pattern = wire;
    await assert.rejects(readOnboarding());
  }
});

test("safe food cooking method is optional and an empty value is sent as null", async () => {
  const source = {
    ...profile,
    safeFoods: [
      { id: "local-1", name: "Potato", preparation: "", presentationNote: "" },
      { id: "local-2", name: "Rice", preparation: "  ", presentationNote: "Blue bowl" },
    ],
  };
  assert.deepEqual(toOnboardingWrite(source).profile.safe_foods, [
    { name: "Potato", preparation: null, presentation_note: null },
    { name: "Rice", preparation: null, presentation_note: "Blue bowl" },
  ]);
  const stored = serverResponse();
  stored.profile.safe_foods = [
    { id: "601", name: "Potato", preparation: null, presentation_note: null },
  ];
  const restored = fromOnboardingResponse(stored, account);
  assert.deepEqual(restored.safeFoods, [
    { id: "601", name: "Potato", preparation: "", presentationNote: "" },
  ]);
  response = stored;
  assert.equal((await readOnboarding()).profile.safe_foods[0].preparation, null);
});

test("responses with unknown restriction values or the old shape are rejected", async () => {
  for (const restrictions of [["peanut"], ["ALLERGY.lupin"], ["UNKNOWN.EGGS"]]) {
    response = serverResponse();
    response.profile.restrictions = restrictions;
    await assert.rejects(readOnboarding());
  }
  response = serverResponse();
  delete response.profile.restrictions;
  response.profile.safety = { allergies: { status: "none_known", items: [] } };
  await assert.rejects(readOnboarding());
});

test("onboarding option ids equal the server enum values without their category", () => {
  const { optionsFor } = require("../../../src/util/strings.ts");
  const ids = (group) => optionsFor(group, "en").map((o) => o.id);
  assert.deepEqual(ids("age"), [
    "UNDER_2", "AGE_2_3", "AGE_4_5", "AGE_6_8", "AGE_9_12", "AGE_13_PLUS",
  ]);
  assert.deepEqual(ids("allergies"), [
    "PEANUTS", "TREE_NUTS", "MILK_DAIRY", "EGGS", "SOY", "WHEAT", "FISH", "SHELLFISH", "SESAME",
  ]);
  assert.deepEqual(ids("restrictions"), ["GLUTEN_FREE", "LACTOSE_FREE", "CASEIN_FREE"]);
  assert.deepEqual(ids("vegetarian"), [
    "DAIRY", "EGGS", "SEAFOOD", "POULTRY", "RED_MEAT", "LEGUMES_SOY", "NUTS_SEEDS",
  ]);
  assert.equal(optionsFor("allergies", "ko").find((o) => o.id === "EGGS").label, "달걀");
});


test('보관한 음식이 있어도 명시적 없음은 null로 보내고 미응답과 구분해 읽는다', async () => {
  const source = { ...profile, noSafeFoods: true };
  assert.equal(toOnboardingWrite(source).profile.safe_foods, null);
  assert.ok(source.safeFoods.length > 0);
  response = serverResponse();
  response.profile.safe_foods = null;
  const saved = await writeOnboarding(source);
  const restored = fromOnboardingResponse(saved, account);
  assert.equal(restored.noSafeFoods, true);
  assert.deepEqual(restored.safeFoods, []);
  response.profile.safe_foods = [];
  await assert.rejects(writeOnboarding(source), /Safe foods answer was not saved/);
  assert.equal(fromOnboardingResponse(response, account).noSafeFoods, false);
  assert.deepEqual(toOnboardingWrite({ ...profile, safeFoods: [] }).profile.safe_foods, []);
});
