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
const { React, renderToStaticMarkup } = require('../../helpers/static-view.cjs');
const { HeightFitPhoto } = require("../../../src/components/HeightFitPhoto.tsx");

test("height-fit photo reserves the full frame height and clips horizontal overflow", () => {
  const html = renderToStaticMarkup(
    React.createElement(HeightFitPhoto, { uri: "photo", height: 228 }),
  );
  assert.match(html, /overflow:hidden;height:228px/);
  assert.match(html, /height:228px/);
});
