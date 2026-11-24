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
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { React, act, renderHook, findElement } = require('../../helpers/static-view.cjs');
const { copyFor, abcCopyFor } = require("../../../src/util/strings.ts");

const s = copyFor("en"),
  a = abcCopyFor("en"),
  noop = () => {};

test("difficulty Continue and Skip save directly without a suggestion confirmation step", async (t) => {
  const {
    AfterMealReviewView,
  } = require("../../../src/features/after-meal-review/screens/AfterMealReviewView.tsx");
  const { MealFlowButton } = require("../../../src/components/MealFlowButton.tsx");
  const { MealTextButton } = require("../../../src/components/MealTextButton.tsx");

  let saves = 0;
  const transitions = [];
  const harness = await renderHook(t, () =>
    AfterMealReviewView({
      language: "en",
      draft: { step: "difficulties" },
      meal: { foods: [] },
      canContinueOutcomes: true,
      saving: false,
      saveStatus: "saved",
      onSave: () => saves++,
      onGo: (step) => transitions.push(step),
    }),
  );
  const buttons = [];
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === MealFlowButton || node.type === MealTextButton) buttons.push(node);
    React.Children.forEach(node.props?.children, visit);
  }
  visit(harness.current);
  for (const label of [s.common.continue, s.afterMealReview.skip]) {
    const button = buttons.find((item) => item.props.label === label);
    assert.ok(button, label);
    await act(async () => button.props.onPress());
  }
  assert.equal(saves, 2);
  assert.deepEqual(transitions, []);
});

test('all-eaten review completion offers Home without a suggestion action', () => {
  const { AfterMealFollowUpView } = require('../../../src/features/after-meal-review/screens/AfterMealFollowUpView.tsx');
  const { MealFlowButton } = require('../../../src/components/MealFlowButton.tsx');
  const p = { language: 'en', meal: { photo: null, foods: [], mealDate: '2026-11-04', mealType: 'lunch' },
    draft: { outcomes: [{ decision: { confirmed: 'eaten' } }] }, onRecommend() {}, onHome() {} };
  assert.equal(!!findElement(AfterMealFollowUpView({ p }).props.actions, n => n.type === MealFlowButton), false);
  p.draft.outcomes[0].decision.confirmed = 'tasted';
  assert.ok(findElement(AfterMealFollowUpView({ p }).props.actions, n => n.type === MealFlowButton));
});
