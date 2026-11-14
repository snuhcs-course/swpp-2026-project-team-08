// AI-generated with GPT-6, 2026-11-03, reviewed by Seoyeon Heo
// Changed: Verify meal flow actions and shared three-step after-meal progress
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 선택지 id·채식 단계 기준으로 테스트 수정, 카탈로그 검색 테스트 교체
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: 추천 모달 안전 여백 및 추천 연결·언어 버튼 및 공통 Outcome 헤더 검증
// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: Eaten 단계 생략 및 언어 버튼 숨김 검증
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 애니메이션 바텀시트의 네이티브 컴포넌트 대체 지원
// AI-generated with Grok 4.6, 2026-11-13, reviewed by Doyeon Kim
// Changed: 음식 편집에서 저장 추천 연결 검증
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Repair onboarding imports and connect the shared storage mock; Dietary Pattern
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: family 단계를 vegetarian 으로, 채식 제한을 선택 사항으로 수정
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 단계(family)를 선택 사항으로 되돌려 수정
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 행동별 테스트 분리 및 경로 수정
const { test } = require("node:test");
const assert = require("node:assert/strict");
require("../../helpers/register.cjs");

const { React, act, renderHook } = require("../../helpers/react-harness.cjs");

const { renderToStaticMarkup } = require("react-dom/server");

for (const ext of [".svg", ".png"])
  require.extensions[ext] = (m, file) => {
    m.exports = file;
  };

const flatten = (value) =>
  Object.assign({}, ...[value].flat(Infinity).filter(Boolean));

let bottomInset = 0;

function primitive(tag) {
  return function Primitive({
    children,
    style,
    accessibilityLabel,
    accessibilityState,
    accessibilityRole,
    testID,
    onPress,
    onChangeText,
    value,
    placeholder,
    ...props
  }) {
    const css = flatten(
      typeof style === "function" ? style({ pressed: false }) : style,
    );
    const safeProps = {
      style: css,
      role: accessibilityRole,
      "aria-label": accessibilityLabel,
      "data-testid": testID,
    };
    if (accessibilityState)
      for (const [key, v] of Object.entries(accessibilityState))
        safeProps[`aria-${key}`] = v;
    if (tag === "input")
      Object.assign(safeProps, { value, placeholder, readOnly: true });
    return React.createElement(tag, safeProps, children);
  };
}

const { mockModules } = require("../../helpers/mock-modules.cjs");
mockModules((name) => {
  if (name === "react-native")
    return {
      Animated: { createAnimatedComponent: component => component },
      RefreshControl: () => null,
      ActivityIndicator: primitive("progress"),
      View: primitive("div"),
      Text: primitive("span"),
      Pressable: primitive("button"),
      TextInput: primitive("input"),
      ScrollView: primitive("section"),
      KeyboardAvoidingView: primitive("div"),
      Modal: ({ visible = true, children }) => (visible ? children : null),
      Platform: { OS: "web" },
      StyleSheet: { create: (v) => v, absoluteFill: {} },
    };
  if (name === "react-native-safe-area-context")
    return {
      SafeAreaView: primitive("main"),
      SafeAreaProvider: primitive("aside"),
      useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: bottomInset, left: 0 }),
    };
  if (name === "expo-image") return { Image: primitive("img") };
  if (name === "@expo/vector-icons") return { Feather: primitive("i"), Ionicons: primitive("i") };
  if (name.startsWith("@expo/vector-icons/")) return primitive("i");
  return undefined;
});

const { copyFor, abcCopyFor } = require("../../../src/util/strings.ts");

const { steps, nextStep, previousStep } = require("../../../src/features/onboarding/types.ts");
const noop = () => {};

test("the dietary pattern step leads directly to safe foods in both directions", () => {
  assert.equal(nextStep("family"), "safe-foods");
  assert.equal(previousStep("safe-foods"), "family");
  assert.equal(steps.length, 8);
});

test("onboarding progress follows the eight remaining screens in both languages", () => {
  const {
    OnboardingFlowView,
  } = require("../../../src/features/onboarding/screens/OnboardingFlowView.tsx");
  const { steps } = require("../../../src/features/onboarding/types.ts");
  for (const language of ["en", "ko"]) {
    steps.forEach((step, stepIndex) => {
      const html = renderToStaticMarkup(
        React.createElement(OnboardingFlowView, {
          language,
          step,
          stepIndex,
          stepCount: steps.length,
          childName: "Luna",
          saveStatus: "saved",
          submitting: false,
          canContinue: true,
          content: null,
          onPrevious: noop,
          onContinue: noop,
          onSaveExit: noop,
          onRetrySave: noop,
        }),
      );
      assert.ok(
        html.includes(copyFor(language).onboarding.progress(stepIndex + 1, 8)),
      );
      if (step === "review") assert.match(html, /width:100%/);
    });
  }
});
