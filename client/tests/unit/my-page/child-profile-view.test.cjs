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
const { render, reset, choose, menus, ChildProfileView, copyFor, optionsFor } = require('../../helpers/native-menu.cjs');

test('프로필 연령 메뉴는 선택한 언어로 항목을 표시하고 iOS·Android에서 같은 연령 ID를 전달한다', () => {
  for (const os of ['android', 'ios']) for (const language of ['en', 'ko']) {
    reset(os);
    const changes = [], ages = optionsFor('age', language);
    const nodes = render(ChildProfileView, { language, editing: true, childName: 'Luna', ageRange: ages[0].id,
      allergies: '', vegetarian: '', safeFoods: '', onAge: value => changes.push(value) });
    const [menu] = menus(nodes);
    assert.equal(menu.props.title, copyFor(language).myPage.ageGroup);
    assert.deepEqual(menu.props.actions.map(action => action.title), ages.map(option => option.label));
    choose(menu, ages[1].id);
    assert.deepEqual(changes, [ages[1].id]);
  }
});
