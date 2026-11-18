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
// Changed: 검토 테스트 분리 및 요약·미응답·명시적 없음·원본 보존 검증
const { test } = require("node:test");
const assert = require("node:assert/strict");
require("../../helpers/register.cjs");
const { emptyDraft } = require("../../../src/features/onboarding/types.ts");
const { reviewRows } = require("../../../src/features/onboarding/screens/reviewRows.ts");

test("현재 답변의 자녀 정보·제한·식생활·음식 상세를 네 카드에 표시하고 원본을 바꾸지 않는다", () => {
  const draft = {
    ...emptyDraft(),
    childName: "하늘",
    ageRange: "AGE_4_5",
    allergies: ["PEANUTS", "EGGS"],
    restrictions: ["GLUTEN_FREE", "LACTOSE_FREE"],
    dietaryPattern: "pescatarian",
    safeFoods: [
      { id: "rice", name: "Rice", preparation: "Steamed", presentationNote: "Blue bowl" },
      { id: "apple", name: "Apple", preparation: "Sliced", presentationNote: "White plate" },
    ],
  };
  const before = structuredClone(draft);
  const rows = reviewRows(draft, "en");
  assert.deepEqual(rows, [
    { step: "child", title: "Child basics", value: "하늘 · 4-5 years" },
    {
      step: "allergies", title: "Safety restrictions",
      value: "Allergies: Peanuts, Eggs · Other dietary restrictions: Gluten-free, Lactose-free",
    },
    { step: "family", title: "Dietary Pattern", value: "Pescatarian" },
    {
      step: "safe-foods", title: "Safe foods",
      value: "Rice · Steamed · Blue bowl, Apple · Sliced · White plate",
    },
  ]);
  assert.equal(reviewRows(draft, "ko")[1].value,
    "알레르기: 땅콩, 달걀 · 기타 식이 제한: 글루텐 제한, 유당 제한");
  assert.deepEqual(draft, before);
});

test("미응답 항목은 없음을 선택한 것으로 표시하지 않고 한·영 미입력 문구로 구분한다", () => {
  for (const [language, expected] of [
    ["ko", [
      "입력하지 않음 · 입력하지 않음",
      "알레르기: 입력하지 않음 · 기타 식이 제한: 미응답",
      "미응답", "입력하지 않음",
    ]],
    ["en", [
      "Not entered · Not entered",
      "Allergies: Not entered · Other dietary restrictions: Not answered",
      "Not answered", "Not entered",
    ]],
  ]) {
    assert.deepEqual(reviewRows(emptyDraft(), language).map(row => row.value), expected);
  }
});

test("명시적으로 없음에 답한 제한·식생활·음식은 한·영 요약에서 미응답과 구분된다", () => {
  const draft = {
    ...emptyDraft(), allergies: ["none"], restrictions: ["none"],
    dietaryPattern: "no_specific_pattern", noSafeFoods: true,
  };
  for (const [language, expected] of [
    ["ko", [
      "알레르기: 해당 없음 · 기타 식이 제한: 없음",
      "특정 식생활 유형 없음", "아직 익숙한 음식 없음",
    ]],
    ["en", [
      "Allergies: None · Other dietary restrictions: None",
      "No specific dietary pattern", "No Safe Foods Yet",
    ]],
  ]) {
    assert.deepEqual(reviewRows(draft, language).slice(1).map(row => row.value), expected);
  }
});

test("익숙한 음식 없음을 선택하면 보관 중인 음식 대신 없음만 요약하고 목록과 입력은 보존한다", () => {
  const draft = {
    ...emptyDraft(), noSafeFoods: true,
    safeFoods: [
      { id: "rice", name: "Rice", preparation: "Steamed", presentationNote: "Blue bowl" },
    ],
    safeFoodInput: { name: "Apple", preparation: "Sliced", presentationNote: "White plate" },
  };
  const before = structuredClone(draft);
  for (const [language, expected] of [["ko", "아직 익숙한 음식 없음"], ["en", "No Safe Foods Yet"]]) {
    assert.equal(reviewRows(draft, language)[3].value, expected);
    assert.deepEqual(draft, before);
  }
});

test("음식 요약에는 추가한 음식과 작성한 설명만 표시하고 빈 설명과 미추가 입력은 생략한다", () => {
  const draft = {
    ...emptyDraft(),
    safeFoods: [
      { id: "rice", name: "Rice", preparation: "", presentationNote: "" },
      { id: "apple", name: "Apple", preparation: "Sliced", presentationNote: "" },
      { id: "banana", name: "Banana", preparation: "", presentationNote: "Blue bowl" },
    ],
    safeFoodInput: { name: "Pear", preparation: "Warmed", presentationNote: "White plate" },
  };
  const before = structuredClone(draft);
  assert.equal(reviewRows(draft, "en")[3].value, "Rice, Apple · Sliced, Banana · Blue bowl");
  assert.deepEqual(draft, before);
});
