// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: API·Provider를 대체한 보호자 계정 편집 검증을 auth Unit으로 이동
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename,
);

let active;
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === 'react') return {
    useState(initial) {
      const owner = active;
      const index = owner.cursor++;
      if (!(index in owner.slots)) owner.slots[index] = initial;
      return [owner.slots[index], (value) => { owner.slots[index] = value; }];
    },
  };
  if (name === '../../../providers/ProfileProvider') return {
    useProfile: () => ({ status: 'ready', language: 'en', profile: active.profile }),
  };
  if (name === '../../../providers/AuthProvider') return {
    useAuth: () => ({ replaceUser: async (user) => {
      active.users.push(user);
      active.profile = { caregiverName: user.fullName, caregiverEmail: user.email };
    } }),
  };
  if (name === '../../../data/api/authApi') return {
    authFailure: (error) => error.message,
    updateCurrentName: async (name) => {
      active.names.push(name);
      if (active.failSave) throw new Error('network');
      return { id: '1', fullName: name, email: active.profile.caregiverEmail };
    },
    requestEmailChange: async (email) => { active.emails.push(email); return '123456'; },
    confirmEmailChange: async (email, code) => {
      active.codes.push(code);
      if (code !== '123456') throw new Error('invalid-email-code');
      return { id: '1', fullName: active.profile.caregiverName, email };
    },
  };
  return originalLoad.call(this, name, ...args);
};

const { useCaregiverAccount } = require('../../../src/features/my-page/hooks/useCaregiverAccount.ts');
function mount() {
  const owner = {
    slots: [], cursor: 0, users: [], names: [], emails: [], codes: [], failSave: false,
    profile: { caregiverName: 'Parent', caregiverEmail: 'parent@example.com' },
    render() { active = owner; owner.cursor = 0; return useCaregiverAccount(); },
  };
  return owner;
}

test('보호자 이름 저장 실패 시 입력을 유지하고 나가기를 막으며 재시도 성공 시 공백을 제거한 이름으로 계정을 갱신한다', async () => {
  const owner = mount();
  let model = owner.render();
  model.changeName('  Updated parent  ');
  model = owner.render();
  owner.failSave = true;
  assert.equal(await model.goBack(), false);
  model = owner.render();
  assert.equal(model.saveError, true);
  assert.equal(model.name, '  Updated parent  ');
  assert.equal(model.busy, false);
  assert.equal(owner.users.length, 0);
  owner.failSave = false;
  assert.equal(await model.goBack(), true);
  assert.equal(owner.users[0].fullName, 'Updated parent');
  assert.equal(owner.render().saveError, false);
});

test('이메일 인증번호가 틀리면 계정을 유지하고 올바른 번호로 재시도하면 새 이메일로 갱신한다', async () => {
  const owner = mount();
  let model = owner.render();
  model.startEmailChange();
  model = owner.render();
  model.setNewEmail('new@example.com');
  model = owner.render();
  assert.equal(model.canSend, true);
  await model.sendCode();
  model = owner.render();
  assert.equal(model.mode, 'verify');
  assert.equal(model.code, '123456');
  model.changeCode('000000');
  await owner.render().verify();
  model = owner.render();
  assert.equal(model.mismatch, true);
  assert.equal(owner.users.length, 0);
  model.changeCode('123456');
  await owner.render().verify();
  model = owner.render();
  assert.equal(model.mode, 'account');
  assert.equal(model.updated, true);
  assert.equal(model.mismatch, false);
  assert.equal(model.profile.caregiverEmail, 'new@example.com');
  assert.equal(model.code, '');
});

test('잘못된 이메일은 인증 요청을 보내지 않고 뒤로가기는 인증·이메일 변경·계정 화면 순서로 돌아간다', async () => {
  const owner = mount();
  let model = owner.render();
  model.startEmailChange();
  model = owner.render();
  model.setNewEmail('not-an-email');
  model = owner.render();
  assert.equal(model.canSend, false);
  await model.sendCode();
  assert.deepEqual(owner.emails, []);
  model.setNewEmail('new@example.com');
  await owner.render().sendCode();
  assert.equal(await owner.render().goBack(), undefined);
  assert.equal(owner.render().mode, 'change-email');
  await owner.render().goBack();
  assert.equal(owner.render().mode, 'account');
  assert.equal(await owner.render().goBack(), true);
  assert.deepEqual(owner.names, []);
});
