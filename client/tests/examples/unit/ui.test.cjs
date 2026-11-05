// AI-generated with GPT-6, 2026-10-31, reviewed by Haechan Jung
// Changed: 레이어별 Unit 테스트와 입력값 선정 예시

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');

const { mockModules } = require('../../helpers/mock-modules.cjs');
// RN 요소만 대체한다. 버튼 컴포넌트는 실제 코드를 실행한다.
mockModules(name => name === 'react-native' ? {
  Pressable: 'pressable', Text: 'text', StyleSheet: { create: styles => styles },
} : undefined);
const { MealTextButton } = require('../../../src/components/MealTextButton.tsx');

const cases = [
  { title: 'disabled를 생략하면 제목과 누름 콜백을 전달한다', disabled: undefined, expectedDisabled: false },
  { title: 'disabled가 false이면 제목과 누름 콜백을 전달한다', disabled: false, expectedDisabled: false },
  { title: 'disabled가 true이면 접근성에도 비활성 상태를 전달한다', disabled: true, expectedDisabled: true },
];

for (const { title, disabled, expectedDisabled } of cases) {
  test(title, (t) => {
    // 준비
    const onPress = t.mock.fn();

    // 실행
    const button = MealTextButton({ label: '저장', disabled, onPress });

    // 검증: RN에 전달하는 속성을 검사하며 실제 기기 터치 차단은 검사하지 않는다.
    assert.equal(button.props.accessibilityRole, 'button');
    assert.equal(button.props.children[1].props.children, '저장');
    assert.equal(button.props.disabled, disabled);
    assert.equal(button.props.accessibilityState.disabled, expectedDisabled);
    assert.equal(button.props.onPress, onPress);
    assert.equal(onPress.mock.callCount(), 0);
    if (!expectedDisabled) {
      button.props.onPress();
      assert.equal(onPress.mock.callCount(), 1);
    }
  });
}
