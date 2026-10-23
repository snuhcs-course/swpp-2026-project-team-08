// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const Module = require('node:module');
const { after } = require('node:test');

// Return undefined for unmocked modules. Install before loading the subject.
// The caller may restore early; otherwise the file's teardown restores it.
function mockModules(resolve) {
  const originalLoad = Module._load;
  function mockedLoad(name, ...args) {
    const replacement = resolve(name);
    return replacement === undefined
      ? originalLoad.call(this, name, ...args)
      : replacement;
  }
  Module._load = mockedLoad;
  const restore = () => {
    if (Module._load === mockedLoad) Module._load = originalLoad;
  };
  after(restore);
  return restore;
}

module.exports = { mockModules };
