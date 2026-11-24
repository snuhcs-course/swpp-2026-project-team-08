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
const { render, reset, choose, menus, elements, noop, DateField } = require('../../helpers/native-menu.cjs');

test('연도 메뉴는 iOS·Android에서 최신 연도부터 표시하고 웹에서는 현재 연도 위치로 스크롤하며 선택한 연도·월을 전달한다', t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 10, 3, 12).getTime() });
  for (const os of ['android', 'ios', 'web']) {
    reset(os);
    const changes = [];
    const props = { variant: 'month-year', year: 2026, month: 10,
      labels: { year: 'Year', month: 'Month', locale: 'en-US' },
      onChange: (...value) => changes.push(value) };
    let nodes = render(DateField, props);
    if (os !== 'web') {
      const [month, year] = menus(nodes);
      assert.equal(month.props.actions.length, 11);
      assert.equal(month.props.actions[9].title, 'Oct');
      assert.equal(month.props.actions[9].state, 'on');
      choose(month, '2');
      assert.deepEqual(changes, [[2026, 2]]);
      assert.equal(year.props.actions.length, 127);
      assert.equal(year.props.actions[0].id, '2026');
      assert.equal(year.props.actions[0].state, 'on');
      assert.equal(year.props.actions.at(-1).id, '1900');
      choose(year, '2024');
      assert.deepEqual(changes.at(-1), [2024, 10]);
      assert.equal(nodes.filter(node => node.type === 'ScrollView').length, 0);
      continue;
    }
    nodes.find(node => node.props.testID === 'date-part-0').props.onPress();
    nodes = render(DateField, props);
    const list = nodes.find(node => node.type === 'ScrollView');
    assert.ok(list.props.contentOffset.y > 4000);
    const options = elements(list).filter(node => node.type === 'Pressable');
    assert.equal(options.length, 127);
    assert.equal(elements(options.at(-1)).find(node => node.type === 'Text').props.children, '2026');
    options.at(-3).props.onPress();
    assert.deepEqual(changes.at(-1), [2024, 10]);
    assert.equal(render(DateField, props).filter(node => node.type === 'ScrollView').length, 0);
  }
});

test('과거 연도의 네이티브 월 메뉴에는 12월까지 표시되고 12월을 선택할 수 있다', t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 10, 3, 12).getTime() });
  for (const os of ['android', 'ios']) {
    reset(os);
    const changes = [];
    const nodes = render(DateField, { variant: 'month-year', year: 2024, month: 11,
      labels: { year: 'Year', month: 'Month', locale: 'en-US' },
      onChange: (...value) => changes.push(value) });
    const [month] = menus(nodes);
    assert.equal(month.props.actions.length, 12);
    assert.deepEqual(month.props.actions.at(-1), { id: '12', title: 'Dec', state: 'off' });
    choose(month, '12');
    assert.deepEqual(changes, [[2024, 12]]);
  }
});

test('달력의 지난 12월에서 올해로 바꾸면 현재 월까지로 선택을 제한한다', t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 10, 3, 12).getTime() });
  reset('web');
  let selected;
  const props = { variant: 'month-year', year: 2025, month: 12,
    labels: { year: 'Year', month: 'Month', locale: 'en-US' },
    onChange: (...value) => { selected = value; } };
  let nodes = render(DateField, props);
  nodes.find(node => node.props.testID === 'date-part-0').props.onPress();
  nodes = render(DateField, props);
  const options = nodes.find(node => node.props.testID === 'date-options-0');
  elements(options).filter(node => node.type === 'Pressable').at(-1).props.onPress();
  assert.deepEqual(selected, [2026, 11]);
});

test('과거 연도의 월 메뉴는 한글·영문 월 이름과 1~12월 값을 같은 순서로 표시한다', () => {
  const english = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (const os of ['ios', 'android']) for (const year of [1900, 1908, 1912, 1954]) {
    for (const locale of ['ko-KR', 'en-US']) {
      reset(os);
      const [month] = menus(render(DateField, { variant: 'month-year', year, month: 3,
        labels: { year: 'Year', month: 'Month', locale }, onChange: noop }));
      assert.deepEqual(month.props.actions.map(action => action.title),
        locale === 'ko-KR' ? Array.from({ length: 12 }, (_, i) => `${i + 1}월`) : english);
      assert.equal(month.props.actions[2].state, 'on');
    }
  }
});
