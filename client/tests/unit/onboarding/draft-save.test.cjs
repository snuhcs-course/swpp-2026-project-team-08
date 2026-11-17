// AI-generated with GPT-6, 2026-11-16, reviewed by Haechan Jung
// Changed: 초안 저장 순서·최신 요청 보존·실패 후 저장 재개 경계 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { createDraftSaveGate } = require('../../../src/features/onboarding/draftSaveGate.ts');

test('저장 중 들어온 변경은 순서대로 처리하고 대기 중인 오래된 값 대신 최신 값을 남긴다', async () => {
  const gate = createDraftSaveGate();
  const writes = [];
  const started = Promise.withResolvers();
  const release = Promise.withResolvers();
  let stored;
  const first = gate.persist(async () => {
    writes.push('first');
    started.resolve();
    await release.promise;
    stored = 'first';
  });
  await started.promise;
  const superseded = gate.persist(async () => { writes.push('superseded'); stored = 'superseded'; });
  const latest = gate.persist(async () => { writes.push('latest'); stored = 'latest'; });
  assert.deepEqual(writes, ['first']);
  assert.equal(stored, undefined);
  release.resolve();
  await Promise.all([first, superseded, latest]);
  assert.deepEqual(writes, ['first', 'latest']);
  assert.equal(stored, 'latest');
});

test('앞선 저장이 실패해도 다음 저장은 실행되어 최신 값을 남긴다', async () => {
  const gate = createDraftSaveGate();
  const started = Promise.withResolvers();
  const release = Promise.withResolvers();
  const failure = new Error('Disk full');
  const first = gate.persist(async () => {
    started.resolve();
    await release.promise;
    throw failure;
  });
  const rejected = assert.rejects(first, error => error === failure);
  await started.promise;
  let stored = 'previous';
  const next = gate.persist(async () => { stored = 'latest'; });
  release.resolve();
  await rejected;
  await next;
  assert.equal(stored, 'latest');
});
