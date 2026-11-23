// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 마이페이지 채식 제한 prop 이름 변경
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: 날짜 상한·네이티브 메뉴 및 과거 연도의 월 이름 검증
// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 웹 편집 드롭다운 오버레이 위치·닫기·선택 검증

// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 식사 날짜 테스트에서 공통 월·연도 선택 검증 이동
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 네이티브·웹 메뉴 검증을 담당 컴포넌트·기능으로 분리
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { render, reset, choose, menus, NativeDropdown } = require('../../helpers/native-menu.cjs');

test('iOS·Android 메뉴는 선택 상태와 이름을 표시하고 유효한 항목 ID만 전달한다', () => {
  for (const os of ['android', 'ios']) {
    reset(os);
    const changes = [];
    const nodes = render(NativeDropdown, { options: [{ id: '4-5', label: '4–5 years' }, { id: '6-7', label: '6–7 years' }],
      value: '4-5', label: 'Age group', onChange: value => changes.push(value), children: null });
    const [menu] = menus(nodes);
    assert.equal(menu.props.shouldOpenOnLongPress, false);
    assert.deepEqual(menu.props.actions.map(action => action.state), ['on', 'off']);
    assert.deepEqual(changes, []); // Rendering or dismissing without an action never edits a value.
    choose(menu, '6-7');
    choose(menu, 'unknown');
    assert.deepEqual(changes, ['6-7']);
    assert.equal(nodes.find(node => node.props.accessible).props.accessibilityValue.text, '4–5 years');
  }
});

test('비활성 드롭다운이나 빈 선택지는 네이티브 메뉴 없이 비활성 상태를 표시한다', () => {
  for (const props of [{ disabled: true, options: [{ id: 'x', label: 'X' }] }, { options: [] }]) {
    reset('android');
    const nodes = render(NativeDropdown, { ...props, value: '', label: 'Choose', onChange: assert.fail, children: null });
    assert.equal(menus(nodes).length, 0);
    assert.equal(nodes.find(node => node.props.accessible).props.accessibilityState.disabled, true);
  }
});
