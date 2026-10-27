// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { after } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
const saved = new Map();
for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true })) {
  saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
}
const React = require('react');
const { createRoot } = require('react-dom/client');
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
const { act } = React;

after(() => {
  dom.window.close();
  for (const [key, descriptor] of saved) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
});

async function renderHook(t, hook, { wrapper, client, props } = {}) {
  const queryClient = client ?? new QueryClient({ defaultOptions: {
    queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
    mutations: { retry: false, gcTime: Infinity },
  } });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let current;
  function Probe({ input }) { current = hook(input); return null; }
  async function rerender(input = props) {
    props = input;
    const probe = React.createElement(Probe, { input });
    const child = wrapper ? wrapper(probe) : probe;
    await act(async () => root.render(React.createElement(QueryClientProvider, { client: queryClient }, child)));
  }
  t.after(async () => {
    await act(async () => { root.unmount(); await queryClient.cancelQueries(); });
    queryClient.clear();
    container.remove();
  });
  await rerender();
  return { get current() { return current; }, client: queryClient, rerender };
}

async function waitFor(check) {
  let last;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { assert.ok(await check()); return; } catch (error) { last = error; }
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 5)); });
  }
  throw last;
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
module.exports = { React, act, renderHook, waitFor, deferred };
