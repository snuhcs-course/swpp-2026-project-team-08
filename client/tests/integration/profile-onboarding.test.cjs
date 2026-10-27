// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Repair onboarding imports and connect the shared storage mock
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require("node:test");

const assert = require("node:assert/strict");

require("../helpers/register.cjs");

const { values, failNextWrite } = require("../helpers/native-boundaries.cjs").nativeBoundaries();

const {
  emptyDraft,
  steps,
  nextStep,
  previousStep,
} = require("../../src/features/onboarding/types.ts");
const {
  canFinish,
  isDraft,
  restoreDraft,
} = require("../../src/features/onboarding/rules.ts");
const {
  readProfile,
  saveProfile,
} = require("../../src/data/storage/profileStorage.ts");
const {
  readDraft,
  saveDraft,
  clearDraft,
} = require("../../src/data/storage/onboardingDraftStorage.ts");
const {
  readLanguage,
  saveLanguage,
} = require("../../src/data/storage/languageStorage.ts");

function completedDraft() {
  return {
    ...emptyDraft(),
    caregiverName: "Parent",
    caregiverEmail: "parent@example.com",
    childName: "Child",
    ageRange: "toddler",
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ["none"],
    restrictions: ["none"],
    familyFoods: ["dairy"],
  };
}

test("family foods leads directly to safe foods in both directions", () => {
  assert.equal(nextStep("family"), "safe-foods");
  assert.equal(previousStep("safe-foods"), "family");
  assert.equal(steps.length, 8);
});

test("a retired saved step preserves answers and removes obsolete draft fields", () => {
  const draft = completedDraft();
  assert.deepEqual(
    restoreDraft({
      ...draft,
      step: "retired-step",
      obsoleteSelections: ["old"],
    }),
    { ...draft, step: "family" },
  );
  for (const step of [
    "texture",
    "smell",
    "taste",
    "presentation",
    "temperature",
    "familiarity",
  ]) {
    assert.deepEqual(
      restoreDraft({
        ...draft,
        step,
        texture: ["soft"],
        smell: "yes",
        taste: ["sour"],
        presentation: ["separate"],
        temperature: "warm",
        familiarity: "plate",
      }),
      { ...draft, step: "family" },
    );
  }
  assert.deepEqual(
    restoreDraft({
      ...draft,
      step: "safe-foods",
      texture: ["soft"],
      familiarity: "plate",
    }),
    { ...draft, step: "safe-foods" },
  );
  assert.equal(restoreDraft({ step: "retired-step" }), null);
});

test("saved profile, language, and in-progress draft remain independent", async () => {
  values.clear();
  const draft = completedDraft();
  const profile = {
    ...draft,
    id: "child-1",
    updatedAt: "2026-10-08T00:00:00.000Z",
  };
  delete profile.step;
  delete profile.safeFoodInput;
  assert.equal(canFinish({ ...draft, familyFoods: [] }), false);
  assert.equal(canFinish(draft), true);
  await saveProfile(profile);
  await saveLanguage("ko");
  await saveDraft({ ...draft, step: "review" });
  assert.equal((await readProfile()).id, "child-1");
  assert.equal(await readLanguage(), "ko");
  assert.equal(isDraft(await readDraft()), true);
  await clearDraft();
  assert.equal(await readDraft(), null);
  assert.deepEqual(await readProfile(), profile);
});

test("failed profile write preserves the previous profile and recoverable draft", async () => {
  values.clear();
  const draft = completedDraft();
  const oldProfile = {
    ...draft,
    id: "child-1",
    updatedAt: "2026-10-08T00:00:00.000Z",
  };
  delete oldProfile.step;
  delete oldProfile.safeFoodInput;
  await saveProfile(oldProfile);
  await saveDraft({ ...draft, step: "review" });
  failNextWrite("nurturebites.profile.v1");
  await assert.rejects(saveProfile({ ...oldProfile, childName: "Edited" }));
  assert.deepEqual(await readProfile(), oldProfile);
  assert.equal((await readDraft()).step, "review");
});
