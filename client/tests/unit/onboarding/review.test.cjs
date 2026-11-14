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
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 행동별 테스트 분리 및 경로 수정
const { test } = require("node:test");
const assert = require("node:assert/strict");
require("../../helpers/register.cjs");

test("onboarding review has the four summary cards without changing profile answers", () => {
  const { emptyDraft } = require("../../../src/features/onboarding/types.ts");
  const {
    reviewRows,
  } = require("../../../src/features/onboarding/screens/reviewRows.ts");
  const draft = {
    ...emptyDraft(),
    allergies: ["PEANUTS"],
    restrictions: ["GLUTEN_FREE"],
  };
  const before = JSON.stringify(draft);
  const rows = reviewRows(draft, "en");
  assert.deepEqual(
    rows.map((row) => row.step),
    ["child", "allergies", "family", "safe-foods"],
  );
  assert.match(rows[1].value, /Peanuts/);
  assert.equal(JSON.stringify(draft), before);
});
