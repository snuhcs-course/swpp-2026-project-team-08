// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: 익숙한 음식 추가·삭제·선택 정보 초안 복원 검증
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 안심 음식 없음 선택이 사라진 구조에 맞춰 검증 수정
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 행동별 테스트 분리와 실행 환경 추출
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
const { OnboardingProvider } = require('../../src/features/onboarding/OnboardingProvider.tsx');
const { emptyDraft } = require('../../src/features/onboarding/types.ts');
const { readDraft, saveDraft } = require('../../src/data/storage/onboardingDraftStorage.ts');
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

module.exports = { values, mount, account, emptyDraft, readDraft, saveDraft };
