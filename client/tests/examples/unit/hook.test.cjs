// AI-generated with GPT-6, 2026-10-31, reviewed by Haechan Jung
// Changed: 레이어별 Unit 테스트와 입력값 선정 예시

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');

const { act, renderHook } = require('../../helpers/react-harness.cjs');
const { completeDraft } = require('../../fixtures/meal-checkin.cjs');
const { useMealCheckinInputs } = require('../../../src/features/meal-checkin/hooks/useMealCheckinInputs.ts');

// 월 선택 → 날짜 확정 흐름을 공유하고, 기존 날짜·선택할 월·기대 날짜만 바꾼다.
const cases = [
  { title: '선택한 월로 날짜를 확정하고 선택창을 닫는다', mealDate: '2026-09-30', month: 10, expectedParts: [2026, 10, 30], expectedDate: '2026-10-30' },
  { title: '31일에서 30일까지 있는 달로 바꾸면 30일로 조정한다', mealDate: '2026-01-31', month: 4, expectedParts: [2026, 4, 30], expectedDate: '2026-04-30' },
  { title: '평년의 2월로 바꾸면 28일로 조정한다', mealDate: '2026-01-31', month: 2, expectedParts: [2026, 2, 28], expectedDate: '2026-02-28' },
  { title: '윤년의 2월로 바꾸면 29일로 조정한다', mealDate: '2024-01-31', month: 2, expectedParts: [2024, 2, 29], expectedDate: '2024-02-29' },
  { title: '새 달에 존재하는 날짜는 유지한다', mealDate: '2026-01-15', month: 2, expectedParts: [2026, 2, 15], expectedDate: '2026-02-15' },
];

for (const { title, mealDate, month, expectedParts, expectedDate } of cases) {
  test(title, async (t) => {
    // 준비: React는 실제로 실행하고, Hook 바깥의 콜백은 mock으로 받는다.
    const draft = { ...completeDraft('1'), mealDate };
    const onUpdate = t.mock.fn();
    const hook = await renderHook(t, () => useMealCheckinInputs({
      draft, onUpdate, onEditFood: t.mock.fn(), onChangeFood: t.mock.fn(),
    }));
    await act(async () => hook.current.date.onToggle());
    assert.equal(hook.current.date.open, true);
    await act(async () => hook.current.date.onFieldChange(1));

    // 실행·검증: 월 선택만으로는 초안을 확정하지 않는다.
    await act(async () => hook.current.date.onNumberSelect(month));
    assert.deepEqual(hook.current.date.parts, expectedParts);
    assert.equal(hook.current.date.field, null);
    assert.equal(onUpdate.mock.callCount(), 0);

    // 확정 후에는 변경 날짜를 전달하고 선택창을 닫는다.
    await act(async () => hook.current.date.onConfirm());
    assert.equal(onUpdate.mock.callCount(), 1);
    assert.deepEqual(onUpdate.mock.calls[0].arguments, [{ mealDate: expectedDate }]);
    assert.equal(hook.current.date.open, false);
  });
}
