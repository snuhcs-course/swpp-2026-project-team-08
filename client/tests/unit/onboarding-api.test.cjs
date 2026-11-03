// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 restrictions 목록·대문자 enum 계약 기준으로 변환 테스트 재작성
const { test } = require("node:test");
const assert = require("node:assert/strict");
require("../helpers/register.cjs");

let response;

let request;

const { mockModules } = require("../helpers/mock-modules.cjs");
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
} = require("../../src/data/api/onboardingApi.ts");

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
