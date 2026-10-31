// AI-generated with GPT-6, 2026-10-31, reviewed by Haechan Jung
// Changed: 레이어별 Unit 테스트와 입력값 선정 예시

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');

const { validDate } = require('../../../src/util/date.ts');

// 허용 범위의 양 끝·바로 바깥, 달력 경계, 잘못된 형식·타입을 나눈다.
const dateCases = [
  ['윤년이 아닌 해의 2월 29일은 유효하지 않다', '2026-02-29', false],
  ['일반적인 날짜는 유효하다', '2026-10-31', true],
  ['최소 연도 1900년의 첫날은 유효하다', '1900-01-01', true],
  ['최소 연도 직전 날짜는 유효하지 않다', '1899-12-31', false],
  ['최대 연도 2200년의 마지막 날은 유효하다', '2200-12-31', true],
  ['최대 연도 다음 날짜는 유효하지 않다', '2201-01-01', false],
  ['윤년의 2월 29일은 유효하다', '2024-02-29', true],
  ['30일까지 있는 달의 31일은 유효하지 않다', '2026-04-31', false],
  ['0월은 유효하지 않다', '2026-00-01', false],
  ['13월은 유효하지 않다', '2026-13-01', false],
  ['0일은 유효하지 않다', '2026-01-00', false],
  ['월이 한 자리인 문자열은 유효하지 않다', '2026-1-01', false],
  ['앞뒤에 공백이 있는 날짜는 유효하지 않다', ' 2026-01-01 ', false],
  ['빈 문자열은 유효하지 않다', '', false],
  ['null은 유효하지 않다', null, false],
  ['숫자는 유효하지 않다', 20260101, false],
];

for (const [title, input, expected] of dateCases) {
  test(title, () => {
    // 실행
    const result = validDate(input);

    // 검증: 기대값은 사례 표에 직접 적는다.
    assert.equal(result, expected);
  });
}
