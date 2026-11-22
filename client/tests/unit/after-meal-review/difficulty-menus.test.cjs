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
const { render, reset, choose, menus, noop, DifficultyEditor, copyFor, abcCopyFor } = require('../../helpers/native-menu.cjs');

test('어려움 메뉴에서 Texture를 고르면 세부 질문이 열리고 질문을 고른 뒤에만 값을 선택할 수 있다', () => {
  for (const os of ['android', 'ios']) {
    reset(os);
    const events = [];
    const s = copyFor('en'), a = abcCopyFor('en'), m = s.afterMealReview;
    const props = { foodName: 'Apple', category: null, value: '', note: '', tags: [], options: [],
      labels: { categoryPlaceholder: m.selectCategory, valuePlaceholder: m.selectValue, note: m.note,
        add: m.addTag, remove: s.common.remove, close: s.common.close, categories: a.difficultyCategories,
        questions: a.subcategories, textureQuestion: a.textureQuestion, textureCause: a.textureCause,
        textureTrait: a.textureTrait, examples: a.examples, values: { ...m.values, ...a.values } },
      canAdd: false, showNote: false,
      onCategory: value => events.push(['category', value]), onSubcategory: value => events.push(['question', value]),
      onValue: value => events.push(['value', value]), onNote: noop, onAdd: noop, onRemove: noop };
    let nodes = render(DifficultyEditor, props);
    assert.equal(menus(nodes).length, 1);
    choose(menus(nodes)[0], 'texture');
    nodes = render(DifficultyEditor, { ...props, category: 'texture' });
    assert.equal(menus(nodes).length, 2); // Value stays disabled until the texture question is answered.
    const question = menus(nodes)[1];
    const questionId = question.props.actions[0].id;
    choose(question, questionId);
    nodes = render(DifficultyEditor, { ...props, category: 'texture', subcategory: questionId, options: ['hard'], value: 'hard' });
    assert.equal(menus(nodes).length, 3);
    choose(menus(nodes)[2], 'hard');
    assert.deepEqual(events, [['category', 'texture'], ['question', questionId], ['value', 'hard']]);
    assert.equal(menus(nodes)[2].props.actions[0].state, 'on');
  }
});
