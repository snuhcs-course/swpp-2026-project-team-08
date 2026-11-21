// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 실제 식사·홈 화면과 라우터 연결, HTTP·기기 경계 대체
const assert = require('node:assert/strict');
const { after } = require('node:test');
const base = require('./onboarding-screen.cjs');
const React = require('react');
const { mockModules } = require('./mock-modules.cjs');

// jsdom은 기기 레이아웃과 OS 날짜 위젯을 제공하지 않는다.
const resizeObserver = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver');
Reflect.defineProperty(globalThis, 'ResizeObserver', { configurable: true, writable: true,
  value: class { observe() {} unobserve() {} disconnect() {} } });
after(() => {
  if (resizeObserver) Reflect.defineProperty(globalThis, 'ResizeObserver', resizeObserver);
  else delete globalThis.ResizeObserver;
});
const nativeDatePicker = { props: null };
mockModules(name => {
  if (name === '@expo/vector-icons') return {
    Feather: () => null, Ionicons: () => null, MaterialCommunityIcons: () => null,
  };
  if (name.startsWith('@expo/vector-icons/')) return () => null;
  if (name === 'expo/dom') return { IS_DOM: false };
  if (name === 'expo-status-bar') return { useVerticalBarEdgeIOS: () => undefined };
  if (name === './NativeDatePicker') {
    return require('../../src/components/NativeDatePicker.native.tsx');
  }
  if (name === '@react-native-community/datetimepicker') return props => {
    nativeDatePicker.props = props;
    return React.createElement('div', { 'data-testid': props.testID });
  };
});

const { createRoot } = require('react-dom/client');
const { ExpoRoot } = require('expo-router/build/ExpoRoot');
const { Stack, usePathname } = require('expo-router');
const { QueryClient, QueryClientProvider, notifyManager } = require('@tanstack/react-query');
const { AuthProvider } = require('../../src/providers/AuthProvider.tsx');
const { ProfileProvider } = require('../../src/providers/ProfileProvider.tsx');
const { FontReadyContext } = require('../../src/components/FontReadyContext.tsx');
const { saveSession } = require('../../src/data/storage/authStorage.ts');
const { profileResponse } = require('../fixtures/account-profile.cjs');

async function mountMeal(t) {
  await saveSession({ accessToken: 'test-access', refreshToken: 'test-refresh',
    user: { id: '1', email: 'parent@example.com', fullName: 'Parent' } });
  const unexpectedRequests = [];
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const path = new URL(url).pathname, method = init.method ?? 'GET';
    if (method === 'GET') {
      if (path === '/api/v1/onboarding') return Response.json(profileResponse());
      if (['/api/v1/meals', '/api/v1/suggestions'].includes(path)) return Response.json([]);
    }
    unexpectedRequests.push({ method, path });
    throw new Error(`예상 밖 요청: ${method} ${path}`);
  });
  // 앱이 요청 실패를 처리해도 잘못된 요청을 정상 흐름으로 숨기지 않는다.
  t.after(() => assert.deepEqual(unexpectedRequests, []));
  const client = new QueryClient({ defaultOptions: {
    queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
    mutations: { retry: false, gcTime: Infinity },
  } });
  let pathname;
  function Layout() {
    pathname = usePathname();
    return React.createElement(Stack, { screenOptions: { headerShown: false, animation: 'none' } });
  }
  function Providers({ children }) {
    return React.createElement(QueryClientProvider, { client }, React.createElement(AuthProvider, null,
      React.createElement(ProfileProvider, null,
        React.createElement(FontReadyContext.Provider, { value: true }, children))));
  }
  const routes = {
    './_layout.tsx': { default: Layout },
    './meal-checkin.tsx': require('../../src/app/meal-checkin.tsx'),
    './(main)/home.tsx': require('../../src/app/(main)/home.tsx'),
  };
  for (const [path, route] of Object.entries(routes)) {
    if (path.endsWith('_layout.tsx')) continue;
    routes[path] = { ...route, default: function Screen() {
      return React.createElement('div', { 'data-meal-test-screen': path },
        React.createElement(route.default));
    } };
  }
  const context = Object.assign(key => routes[key], {
    keys: () => Object.keys(routes), resolve: key => key, id: 'meal-checkin-test',
  });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let mounted = true;
  async function unmount() {
    if (!mounted) return;
    mounted = false;
    await base.waitFor(() => window.location.pathname === pathname);
    await base.act(async () => {
      root.unmount();
      await client.cancelQueries();
      await new Promise(resolve => notifyManager.schedule(resolve));
    });
    client.clear(); container.remove();
  }
  t.after(unmount);
  window.history.replaceState({}, '', '/meal-checkin');
  await base.act(async () => root.render(React.createElement(ExpoRoot, {
    context, location: '/meal-checkin', wrapper: Providers,
  })));
  await base.waitFor(() => pathname === '/meal-checkin' && container.querySelector('[role="heading"]'));
  // Stack이 숨긴 이전 화면을 조작하거나 검증하지 않는다.
  function visibleScreen() {
    return [...container.querySelectorAll('[data-meal-test-screen]')]
      .find(element => !element.closest('[aria-hidden="true"]')) ?? container;
  }
  return { get container() { return visibleScreen(); }, modal: { container: document.body },
    unmount, get pathname() { return pathname; } };
}
module.exports = { ...base, mountMeal, nativeDatePicker };
