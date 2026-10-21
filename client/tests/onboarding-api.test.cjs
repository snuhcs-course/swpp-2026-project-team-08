const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText,
  filename,
);

let response;
let request;
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === '../network/apiClient') return {
    apiRequest: async (path, init) => { request = { path, init }; return response; },
  };
  if (name === '../storage/authStorage') return {
    isUserId: (value) => typeof value === 'string' && /^[1-9][0-9]*$/.test(value),
  };
  return originalLoad.call(this, name, ...args);
};

const { toOnboardingWrite, fromOnboardingResponse, readOnboarding, writeOnboarding } =
  require('../src/data/api/onboardingApi.ts');

const account = { id: '12', email: 'parent@example.com', fullName: 'Parent' };
const profile = {
  id: '12', caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
  childName: 'Child', ageRange: '4-5',
  consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
  allergies: ['egg', 'custom-allergen'], restrictions: ['none'], familyFoods: ['eggs'],
  approaches: ['none'], texture: ['soft'], smell: 'sometimes', taste: [],
  presentation: ['separate'], temperature: 'warm', familiarity: 'plate',
  safeFoods: [
    { id: 'local-1', name: 'Potato', preparation: 'Boiled', presentationNote: '' },
    { id: '501', name: 'Egg', preparation: 'Steamed', presentationNote: 'Small pieces' },
  ],
  noSafeFoods: false, updatedAt: '2026-10-21T00:00:00Z',
};

function serverResponse() {
  return {
    profile: {
      user_id: '12', child_name: 'Child', age_group: '4-5',
      safety: {
        allergies: { status: 'specified', items: [
          { code: 'egg', custom_name: null }, { code: null, custom_name: 'custom-allergen' },
        ] },
        restrictions: { status: 'none', items: [] },
      },
      food_preferences: {
        family_foods: [{ code: 'eggs', custom_name: null }], dietary_approaches: [],
        difficult_textures: [{ code: 'soft', custom_name: null }], smell_sensitivity: 'sometimes',
        difficult_tastes: [], presentation_preferences: [{ code: 'separate', custom_name: null }],
        preferred_temperature: 'warm', new_food_response: 'plate',
      },
      safe_foods: { status: 'listed', items: [
        { id: '502', name: 'Potato', preparation: 'Boiled', presentation_note: null },
        { id: '501', name: 'Egg', preparation: 'Steamed', presentation_note: 'Small pieces' },
      ] },
      updated_at: '2026-10-21T12:00:00+09:00',
    },
    consents: [
      { id: '1', user_id: '12', kind: 'account_privacy', granted: true, document_version: '2026-10-21', recorded_at: '2026-10-21T12:00:00+09:00' },
      { id: '2', user_id: '12', kind: 'photo_analysis', granted: true, document_version: '2026-10-21', recorded_at: '2026-10-21T12:00:00+09:00' },
      { id: '3', user_id: '12', kind: 'ai_training', granted: false, document_version: '2026-10-21', recorded_at: '2026-10-21T12:00:00+09:00' },
    ],
  };
}

test('onboarding write maps codes, custom choices, consents, and safe food IDs', () => {
  const body = toOnboardingWrite(profile);
  assert.deepEqual(body.profile.safety.allergies, { status: 'specified', items: [
    { code: 'egg', custom_name: null }, { code: null, custom_name: 'custom-allergen' },
  ] });
  assert.deepEqual(body.profile.safety.restrictions, { status: 'none', items: [] });
  assert.deepEqual(body.profile.food_preferences.dietary_approaches, []);
  assert.equal(body.profile.safe_foods.items[0].id, undefined);
  assert.equal(body.profile.safe_foods.items[1].id, '501');
  assert.deepEqual(body.consents.map((item) => item.granted), [true, true, false]);
});

test('server profile restores app shape with server IDs', () => {
  const restored = fromOnboardingResponse(serverResponse(), account);
  assert.equal(restored.id, '12');
  assert.deepEqual(restored.allergies, ['egg', 'custom-allergen']);
  assert.deepEqual(restored.restrictions, ['none']);
  assert.deepEqual(restored.safeFoods.map((item) => item.id), ['502', '501']);
  assert.equal(restored.caregiverEmail, account.email);
  assert.throws(() => fromOnboardingResponse(serverResponse(), { ...account, id: '13' }));
});

test('onboarding API reads and writes the authenticated account path', async () => {
  response = serverResponse();
  assert.equal((await readOnboarding()).profile.user_id, '12');
  assert.deepEqual(request, { path: '/api/v1/onboarding', init: undefined });
  assert.equal((await writeOnboarding(profile)).profile.safe_foods.items[0].id, '502');
  assert.equal(request.path, '/api/v1/onboarding');
  assert.equal(request.init.method, 'PUT');
  assert.equal(JSON.parse(request.init.body).profile.safe_foods.items[0].id, undefined);
  response = { profile: { user_id: 'not-an-id' }, consents: [] };
  await assert.rejects(readOnboarding());
});
