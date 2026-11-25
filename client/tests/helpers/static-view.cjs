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
// AI-generated with GPT-6, 2026-11-12, reviewed by Seoyeon Heo
// Changed: 개인정보 링크의 네이티브 모듈 테스트 경계 추가
// AI-generated with Grok 4.6, 2026-11-13, reviewed by Doyeon Kim
// Changed: 음식 편집에서 저장 추천 연결 검증
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 행동별 테스트 분리 및 경로 수정
// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 조리법 열 가지의 편집 화면 표시 검증
// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 홈 추천 테스트 입력 현행화

// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 빈 초안 기본값 검증·사진 중복 제거 및 음식 편집기·추천 연결 테스트 분리
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 종합 UI 테스트를 기능별로 분리하고 정적 렌더링 경계를 공통화
// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: mock keyboard and dimension APIs used by views
const assert = require("node:assert/strict");
require("./register.cjs");

const { React, act, renderHook } = require("./react-harness.cjs");

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

const { mockModules } = require("./mock-modules.cjs");
mockModules((name) => {
  if (name === "expo-linking") return { openURL: async () => true };
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
      Keyboard: { addListener: () => ({ remove() {} }), isVisible: () => false },
      useWindowDimensions: () => ({ width: 390, height: 844, scale: 1, fontScale: 1 }),
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


function findElement(node, predicate) {
  if (!node || typeof node !== "object") return null;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props?.children)) {
    const found = findElement(child, predicate);
    if (found) return found;
  }
  return null;
}

function assertSegmentProgress(root, filled, total = 5) {
  const { ProgressBar } = require('../../src/components/ProgressBar.tsx');
  const shared = findElement(root, node => node.type === ProgressBar);
  if (shared) root = ProgressBar(shared.props);
  const bar = findElement(root, (node) => node.props?.accessibilityRole === "progressbar");
  if (filled === null) {
    assert.equal(bar, null);
    return;
  }
  assert.ok(bar);
  assert.deepEqual(bar.props.accessibilityValue, { min: 1, max: total, now: filled });
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(bar);
  const segments = Array.from(container.firstElementChild.children);
  const active = document.createElement("div");
  active.style.backgroundColor = require("../../src/util/colors.ts").colors.homePrimary;
  assert.equal(segments.length, total);
  assert.equal(segments.filter((segment) => segment.style.backgroundColor === active.style.backgroundColor).length, filled);
}
module.exports = { React, act, renderHook, renderToStaticMarkup, findElement, assertSegmentProgress, setBottomInset(value) { bottomInset = value; } };
