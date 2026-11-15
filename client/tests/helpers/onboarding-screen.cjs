// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 실제 Expo Router를 연결한 온보딩 입력 화면 실행 환경
const { beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
require('./register.cjs');

// Use the installed web implementations in jsdom; device layout/gestures remain out of scope.
const environment = { NODE_ENV: 'test', EXPO_OS: 'web', EXPO_ROUTER_IMPORT_MODE: 'sync' };
const savedEnvironment = new Map(Object.keys(environment).map(key => [key, process.env[key]]));
Object.assign(process.env, environment);
const { React, act, waitFor } = require('./react-harness.cjs');
const globals = {
  ShadowRoot: window.ShadowRoot,
  HTMLElement: window.HTMLElement,
  MutationObserver: window.MutationObserver,
  __DEV__: false,
  requestAnimationFrame: callback => setTimeout(() => callback(performance.now()), 0),
  cancelAnimationFrame: clearTimeout,
};
const savedGlobals = new Map(Object.keys(globals)
  .map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
for (const [key, value] of Object.entries(globals)) {
  Reflect.defineProperty(globalThis, key, { value, configurable: true, writable: true });
}

// Match Metro's web resolution. Transpile Expo Linking's shipped ESM without changing its logic.
const originalJs = require.extensions['.js'];
require.extensions['.js'] = (module, filename) => {
  if (filename.includes('/node_modules/expo-linking/')) {
    return module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
        esModuleInterop: true },
    }).outputText, filename);
  }
  return originalJs(module, filename);
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...args) {
  if (request.startsWith('.') && /\/node_modules\/(expo-router|expo-linking)\//.test(parent?.filename ?? '')) {
    const webFile = path.resolve(path.dirname(parent.filename), request).replace(/\.js$/, '') + '.web.js';
    if (fs.existsSync(webFile)) return webFile;
  }
  return originalResolve.call(this, request, parent, ...args);
};
after(() => {
  require.extensions['.js'] = originalJs;
  Module._resolveFilename = originalResolve;
  for (const [key, descriptor] of savedGlobals) {
    if (descriptor) Reflect.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
  for (const [key, value] of savedEnvironment) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const native = require('react-native-web');
const insets = { top: 0, right: 0, bottom: 0, left: 0 };
const safeArea = {
  SafeAreaView: native.View,
  SafeAreaProvider: ({ children }) => children,
  SafeAreaFrameContext: React.createContext({ x: 0, y: 0, width: 0, height: 0 }),
  SafeAreaInsetsContext: React.createContext(insets),
  useSafeAreaInsets: () => insets,
};
const { values } = require('./native-boundaries.cjs').nativeBoundaries(name => {
  if (name === 'react-native') return native;
  if (name === 'react-native-safe-area-context') return safeArea;
  if (name === 'expo') return { Platform: native.Platform, requireOptionalNativeModule: () => null,
    isRunningInExpoGo: () => false };
  if (name === 'expo-modules-core') return { UnavailabilityError: class extends Error {} };
  if (name === 'expo-glass-effect') return { GlassView: native.View, isLiquidGlassAvailable: () => false };
  if (name === 'react-native-screens') return { featureFlags: { experiment: {} } };
  if (name === 'react-native-screens/experimental') return {};
  if (name === '@expo/vector-icons/Feather') return () => null;
  if (name === '@expo/vector-icons') return { Feather: () => null };
  if (name === 'expo-image') return { Image: () => null };
  if (/\.(svg|png)$/.test(name)) return name;
});

const { createRoot } = require('react-dom/client');
const { ExpoRoot } = require('expo-router/build/ExpoRoot');
const { Slot, usePathname } = require('expo-router');
const { AuthProvider } = require('../../src/providers/AuthProvider.tsx');
const { ProfileProvider } = require('../../src/providers/ProfileProvider.tsx');
const { OnboardingProvider } = require('../../src/features/onboarding/OnboardingProvider.tsx');
const { useOnboarding } = require('../../src/features/onboarding/hooks/useOnboarding.ts');
const { FontReadyContext } = require('../../src/components/FontReadyContext.tsx');
const onboardingRoute = require('../../src/app/onboarding/[step].tsx');
const { emptyDraft } = require('../../src/features/onboarding/types.ts');
const { saveDraft } = require('../../src/data/storage/onboardingDraftStorage.ts');
const { saveSession, clearSession } = require('../../src/data/storage/authStorage.ts');

beforeEach(async () => {
  await clearSession();
  values.clear();
  window.history.replaceState({}, '', '/');
});

async function mountOnboarding(t, draft) {
  await saveSession({ accessToken: 'access', refreshToken: 'refresh',
    user: { id: '1', email: 'parent@example.com', fullName: 'Parent' } });
  await saveDraft(draft);
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    assert.equal(new URL(url).pathname, '/api/v1/onboarding');
    assert.equal(init.method ?? 'GET', 'GET');
    return Response.json({ profile: null, consents: [] });
  });

  let current, pathname;
  function Layout() {
    current = useOnboarding();
    pathname = usePathname();
    return React.createElement(Slot);
  }
  // Only the feature's route is mounted; app-wide authentication redirects are separate tests.
  const routes = { './_layout.tsx': { default: Layout }, './onboarding/[step].tsx': onboardingRoute };
  const context = Object.assign(key => routes[key], {
    keys: () => Object.keys(routes), resolve: key => key, id: 'onboarding-test',
  });
  function Providers({ children }) {
    return React.createElement(AuthProvider, null,
      React.createElement(ProfileProvider, null,
        React.createElement(OnboardingProvider, null,
          React.createElement(FontReadyContext.Provider, { value: true }, children))));
  }
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  t.after(async () => {
    await act(async () => root.unmount());
    container.remove();
  });
  const initialPath = `/onboarding/${draft.step}`;
  await act(async () => root.render(React.createElement(ExpoRoot, {
    context, location: initialPath, wrapper: Providers,
  })));
  await waitFor(() => current?.ready && pathname === initialPath
    && container.querySelector('[role="heading"]'));
  return { container, get current() { return current; }, get pathname() { return pathname; } };
}

function mountConsent(t) {
  return mountOnboarding(t, { ...emptyDraft(), step: 'consent' });
}

function mountChildBasics(t) {
  return mountOnboarding(t, {
    ...emptyDraft(), step: 'child', caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
  });
}

function mountAllergies(t) {
  return mountOnboarding(t, {
    ...emptyDraft(), step: 'allergies', caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    childName: '나루', ageRange: 'AGE_4_5',
  });
}

function mountDietaryPattern(t) {
  return mountOnboarding(t, {
    ...emptyDraft(), step: 'family', caregiverName: 'Parent', caregiverEmail: 'parent@example.com',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    childName: '나루', ageRange: 'AGE_4_5', allergies: ['EGGS'], restrictions: ['GLUTEN_FREE'],
  });
}

module.exports = { act, waitFor, mountConsent, mountChildBasics, mountAllergies, mountDietaryPattern };
