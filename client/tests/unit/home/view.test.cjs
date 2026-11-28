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
// Changed: 종합 UI 검증을 담당 기능·컴포넌트별 파일로 분리
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 홈 식사 기록·추천 버튼 표시 검증

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { React, renderToStaticMarkup } = require('../../helpers/static-view.cjs');
const { copyFor, abcCopyFor } = require("../../../src/util/strings.ts");

const { newFood } = require("../../../src/rules/foodDraft.ts");

const { newDraft } = require("../../../src/features/meal-checkin/rules.ts");

const s = copyFor("en"),
  a = abcCopyFor("en"),
  noop = () => {};

function homeProps() {
  return {
    profile: { id: "home-child", childName: "Luna", caregiverName: "Alex" },
    language: "en",
    now: new Date(2026, 9, 8, 9),
    draft: null,
    draftLoading: false,
    draftError: false,
    pendingMeals: [],
    suggestionDisabled: false,
    suggestionRequirement: null,
    onGetSuggestion: noop,
    meals: [],
    data: { loggedDates: new Set(), suggestions: [] },
    loading: false,
    error: false,
    refreshing: false,
    onRefresh: noop,
    onLogMeal: noop,
    onReviewDraft: noop,
    onReviewMeal: noop,
    onSavedSuggestions: noop,
    onMealHistory: noop,
    onTrySuggestion: noop,
    suggestionText: {},
  };
}

test("saved-meal home renders real pending-review metadata and current Figma sections", () => {
  const { HomeView } = require("../../../src/features/home/screens/HomeView.tsx");
  const meal = {
    ...newDraft("home-child"),
    id: "real-meal",
    mealType: "lunch",
    mealDate: "2026-10-08",
    foods: [
      { ...newFood(), name: "Soup" },
      { ...newFood(), name: "Rice" },
    ],
  };
  const p = {
    ...homeProps(),
    meals: [meal],
    pendingMeals: [meal],
    data: {
      loggedDates: new Set(),
      suggestions: [{ id: "idea", title: "Actual saved idea" }],
    },
  };
  const html = renderToStaticMarkup(React.createElement(HomeView, p));
  for (const text of [
    "Good morning, Alex",
    "THURSDAY",
    "Get a suggestion",
    "Log new meal",
    "After-meal Review",
    "Luna · Lunch",
    "Oct 8, 2026",
    "2 foods",
    "Awaiting review",
    "Saved Suggestions",
    "Actual saved idea",
    "View saved suggestions",
  ])
    assert.ok(html.includes(text), text);
  assert.doesNotMatch(
    html,
    /SOS Progress|Recommended action goals|Meal Log Calendar|Put carrot next to fish/,
  );
});

test("fresh home shows Sunday-first calendar and honest empty saved-suggestion state", () => {
  const { HomeView } = require("../../../src/features/home/screens/HomeView.tsx");
  const html = renderToStaticMarkup(React.createElement(HomeView, homeProps()));
  assert.match(html, /Log this meal/);
  assert.match(html, /Meal Log Calendar/);
  assert.match(html, /No saved suggestions yet/);
  assert.match(html, /View meal history/);
  assert.ok(html.indexOf(">Sun<") < html.indexOf(">Mon<"));
  assert.doesNotMatch(html, /Awaiting review|Actual saved idea/);
});

test("home record read errors show retry instead of declaring a fresh account", () => {
  const { HomeView } = require("../../../src/features/home/screens/HomeView.tsx");
  const html = renderToStaticMarkup(
    React.createElement(HomeView, { ...homeProps(), error: true }),
  );
  assert.match(html, /Could not load your records/);
  assert.match(html, /Retry/);
  assert.doesNotMatch(html, /No saved suggestions yet|Meal Log Calendar/);
});

test("pressing a pending home card passes the existing meal ID without creating a new meal", () => {
  const { HomeView } = require("../../../src/features/home/screens/HomeView.tsx");
  let opened;
  const meal = {
    ...newDraft("home-child"),
    id: "existing-meal",
    mealType: "dinner",
    mealDate: "2026-10-08",
    foods: [{ ...newFood(), name: "Soup" }],
  };
  const root = HomeView({
    ...homeProps(),
    meals: [meal],
    pendingMeals: [meal],
    onReviewMeal: (id) => {
      opened = id;
    },
  });
  const walk = (node) => {
    if (!node || typeof node !== "object") return null;
    if (node.props?.accessibilityLabel?.endsWith("Awaiting review"))
      return node;
    for (const child of React.Children.toArray(node.props?.children)) {
      const found = walk(child);
      if (found) return found;
    }
    return null;
  };
  const card = walk(root);
  assert.ok(card);
  assert.equal(opened, undefined);
  card.props.onPress();
  assert.equal(opened, "existing-meal");
});
