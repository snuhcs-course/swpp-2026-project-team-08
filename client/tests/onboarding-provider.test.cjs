// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');

for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
      },
    }).outputText, filename,
  );
}

const values = new Map();
let activeHarness;
const sameDependencies = (previous, next) => previous && next
  && previous.length === next.length && next.every((value, index) => Object.is(value, previous[index]));

// Exercise the provider's real loading and autosave effects without a native renderer.
const react = {
  createContext: () => ({ Provider: 'Provider' }),
  useState(initial) {
    const owner = activeHarness;
    const index = owner.cursor++;
    if (!(index in owner.slots)) owner.slots[index] = typeof initial === 'function' ? initial() : initial;
    return [owner.slots[index], (value) => {
      const next = typeof value === 'function' ? value(owner.slots[index]) : value;
      if (!Object.is(next, owner.slots[index])) {
        owner.slots[index] = next;
        owner.dirty = true;
      }
    }];
  },
  useRef(initial) {
    const owner = activeHarness;
    const index = owner.cursor++;
    return owner.slots[index] ??= { current: initial };
  },
  useMemo(factory, dependencies) {
    const owner = activeHarness;
    const index = owner.cursor++;
    if (!sameDependencies(owner.slots[index]?.dependencies, dependencies)) {
      owner.slots[index] = { dependencies, value: factory() };
    }
    return owner.slots[index].value;
  },
  useCallback(callback, dependencies) { return react.useMemo(() => callback, dependencies); },
  useEffect(effect, dependencies) {
    const owner = activeHarness;
    const index = owner.cursor++;
    const previous = owner.slots[index];
    if (!sameDependencies(previous?.dependencies, dependencies)) {
      owner.slots[index] = { dependencies };
      owner.effects.push(() => {
        previous?.cleanup?.();
        owner.slots[index].cleanup = effect();
      });
    }
  },
};

const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === 'react') return react;
  if (name === 'react/jsx-runtime') return { jsx: (_type, props) => props.value };
  if (name === '../../providers/AuthProvider') return { useAuth: () => activeHarness.auth };
  if (name === '../../providers/ProfileProvider') return { useProfile: () => activeHarness.profileState };
  if (name === '@react-native-async-storage/async-storage') return {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
    removeItem: async (key) => { values.delete(key); },
  };
  return originalLoad.call(this, name, ...args);
};
const { OnboardingProvider } = require('../src/features/onboarding/OnboardingProvider.tsx');
const { emptyDraft } = require('../src/features/onboarding/types.ts');
const { readDraft, saveDraft } = require('../src/data/storage/onboardingDraftStorage.ts');
Module._load = originalLoad;

const account = { user: { id: '12', fullName: 'Parent', email: 'parent@example.com' } };

function mount(session = account, profile = null) {
  const harness = {
    slots: [], cursor: 0, effects: [], dirty: true,
    auth: { status: 'ready', session },
    profileState: { status: 'ready', profile, commitProfile: async () => {} },
    async flush() {
      for (let pass = 0; pass < 25; pass++) {
        activeHarness = harness;
        harness.cursor = 0;
        harness.dirty = false;
        harness.model = OnboardingProvider({ children: null });
        for (const effect of harness.effects.splice(0)) effect();
        await new Promise((resolve) => setImmediate(resolve));
        if (!harness.dirty) return harness.model;
      }
      assert.fail('Provider did not settle');
    },
    unmount() {
      for (const slot of harness.slots) slot?.cleanup?.();
    },
  };
  return harness;
}

test('a fresh signed-in draft is prefilled once and cleared account fields stay empty through autosave and remount', async () => {
  values.clear();
  const harness = mount();
  let model = await harness.flush();
  assert.equal(model.ready, true);
  assert.equal(model.draft.caregiverName, account.user.fullName);
  assert.equal(model.draft.caregiverEmail, account.user.email);
  model.setField('caregiverEmail', '');
  model = await harness.flush();
  assert.equal(model.draft.caregiverEmail, '');
  assert.equal(model.canContinue('account'), false);
  assert.equal((await readDraft()).caregiverEmail, '');

  model.setField('caregiverName', '');
  model.setField('childName', 'Child');
  model.setField('smell', 'sometimes');
  model.setStep('child');
  model = await harness.flush();
  assert.equal(model.draft.caregiverName, '');
  assert.equal(model.draft.caregiverEmail, '');
  assert.equal((await readDraft()).childName, 'Child');
  harness.unmount();

  const restored = await mount().flush();
  assert.equal(restored.draft.step, 'child');
  assert.equal(restored.draft.caregiverName, '');
  assert.equal(restored.draft.caregiverEmail, '');
});

test('restoration preserves empty and whitespace account fields alongside later answers', async () => {
  for (const email of ['', '   ']) {
    values.clear();
    const draft = { ...emptyDraft(), caregiverEmail: email, step: 'safe-foods', childName: 'Child' };
    await saveDraft(draft);
    const harness = mount();
    const model = await harness.flush();
    assert.deepEqual(model.draft, draft);
    assert.equal(model.hasDraft, true);
    assert.equal(model.canContinue('account'), false);
    harness.unmount();
  }
});

test('signing in after fresh signed-out initialization still prefills the account once', async () => {
  values.clear();
  const harness = mount(null);
  let model = await harness.flush();
  assert.equal(model.draft.caregiverEmail, '');
  harness.profileState.status = 'loading';
  harness.auth.session = account;
  model = await harness.flush();
  assert.equal(model.ready, false);
  harness.profileState.status = 'ready';
  model = await harness.flush();
  assert.equal(model.draft.caregiverEmail, account.user.email);
  model.setField('caregiverEmail', '');
  await harness.flush();
  harness.auth.session = { ...account, user: { ...account.user } };
  model = await harness.flush();
  assert.equal(model.draft.caregiverEmail, '');
  assert.equal((await readDraft()).caregiverEmail, '');
});

test('signing in preserves restored blanks and account fields already edited while signed out', async () => {
  for (const restored of [true, false]) {
    values.clear();
    if (restored) await saveDraft({ ...emptyDraft(), step: 'child' });
    const harness = mount(null);
    let model = await harness.flush();
    if (!restored) {
      model.setField('caregiverEmail', 'temporary@example.com');
      model.setField('caregiverEmail', '');
      await harness.flush();
    }
    harness.auth.session = account;
    model = await harness.flush();
    assert.equal(model.draft.caregiverEmail, '');
    assert.equal(model.draft.caregiverName, '');
    harness.unmount();
  }
});

test('profile editing cannot restore a cleared account field when another answer changes', async () => {
  values.clear();
  const draft = { ...emptyDraft(), caregiverName: 'Parent', caregiverEmail: account.user.email };
  await saveDraft(draft);
  const harness = mount(account, { ...draft, id: '12', updatedAt: '2026-10-27T00:00:00Z' });
  let model = await harness.flush();
  assert.equal(model.editing, true);
  model.setField('caregiverEmail', '');
  model = await harness.flush();
  model.setField('childName', 'Edited child');
  model = await harness.flush();
  assert.equal(model.draft.caregiverEmail, '');
  assert.equal((await readDraft()).caregiverEmail, '');
});
