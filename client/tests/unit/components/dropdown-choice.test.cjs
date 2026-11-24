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
const { render, reset, choose, menus, DropdownChoice } = require('../../helpers/native-menu.cjs');

test('연령·조리법 드롭다운은 iOS·Android 메뉴를 사용하고 목록에 없는 기존 값도 표시한다', () => {
  for (const os of ['android', 'ios']) for (const variant of ['onboarding', 'editor']) {
    reset(os);
    const changes = [];
    const nodes = render(DropdownChoice, { variant, value: 'legacy', displayFallback: 'Previously saved value',
      options: [{ id: 'steamed', label: 'Steamed' }], placeholder: 'Choose', onChange: value => changes.push(value) });
    const [menu] = menus(nodes);
    assert.ok(menu);
    assert.ok(nodes.some(node => node.type === 'Text' && node.props.children === 'Previously saved value'));
    assert.deepEqual(changes, []);
    choose(menu, 'steamed');
    assert.deepEqual(changes, ['steamed']);
    assert.equal(nodes.filter(node => node.type === 'Pressable').length, 0);
  }
});

test('웹 드롭다운에서 항목을 선택하면 해당 ID를 전달하고 목록을 닫는다', () => {
  reset('web');
  const changes = [];
  const props = { value: '', options: [{ id: '4-5', label: '4–5 years' }],
    placeholder: 'Choose age', onChange: value => changes.push(value) };
  let nodes = render(DropdownChoice, props);
  assert.equal(menus(nodes).length, 0);
  nodes.find(node => node.type === 'Pressable').props.onPress();
  nodes = render(DropdownChoice, props);
  nodes.filter(node => node.type === 'Pressable')[1].props.onPress();
  assert.deepEqual(changes, ['4-5']);
  assert.equal(render(DropdownChoice, props).filter(node => node.type === 'Pressable').length, 1);
});

test('웹 편집 드롭다운은 화면 아래에서 위로 펼쳐지고 닫기나 항목 선택 후 목록이 사라진다', () => {
  for (const y of [300, 700]) {
    reset('web');
    const changes = [];
    const props = { variant: 'editor', value: 'a', placeholder: 'Method',
      options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], onChange: v => changes.push(v) };
    let nodes = render(DropdownChoice, props);
    nodes.find(n => n.props.ref).props.ref.current = {
      measureInWindow: callback => callback(26, y, 166, 38),
    };
    nodes.find(n => n.type === 'Pressable').props.onPress();
    nodes = render(DropdownChoice, props);
    const modal = nodes.find(n => n.type === 'Modal');
    assert.ok(modal.props.transparent);
    const list = nodes.find(n => n.type === 'ScrollView');
    const style = Object.assign({}, ...list.props.style);
    assert.equal(style.position, 'absolute');
    assert.equal(style.width, 166);
    assert.equal(style.top, y + 43);
    assert.equal(style.maxHeight, 74);
    modal.props.onRequestClose();
    assert.equal(render(DropdownChoice, props).some(n => n.type === 'Modal'), false);
    nodes = render(DropdownChoice, props);
    nodes.find(n => n.props.ref).props.ref.current = { measureInWindow: cb => cb(26, 810, 166, 38) };
    nodes.find(n => n.type === 'Pressable').props.onPress();
    nodes = render(DropdownChoice, props);
    assert.equal(Object.assign({}, ...nodes.find(n => n.type === 'ScrollView').props.style).top, 731);
    nodes.find(n => n.type === 'Pressable' && n.props.accessibilityState?.selected === false).props.onPress();
    assert.deepEqual(changes, ['b']);
    assert.equal(render(DropdownChoice, props).some(n => n.type === 'Modal'), false);
  }
});
