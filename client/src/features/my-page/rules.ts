// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 채식 제한 요약으로 변경, 안심 음식 없음 인자 제거
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형 카드 복원에 따라 채식 제한 요약 제거
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 프로필의 익숙한 음식 없음 응답 표시
// AI-generated with GPT-6, 2026-11-26, reviewed by Seoyeon Heo
// Changed: 사용하지 않는 익숙한 음식 요약 제거

import type { Language } from '../../types/profile';
import { copyFor, labelFor, type OptionGroup } from '../../util/strings';
import { validEmail } from '../onboarding/rules';

export function optionSummary(ids: string[], group: OptionGroup, language: Language): string {
  const labels = ids
    .filter((id) => id && id !== 'none')
    .map((id) => labelFor(group, id, language));
  return labels.length ? labels.join(', ') : copyFor(language).myPage.nothing;
}

export function safetySummary(allergies: string[], restrictions: string[], language: Language): string {
  const labels = [
    ...allergies.filter((id) => id && id !== 'none').map((id) => labelFor('allergies', id, language)),
    ...restrictions.filter((id) => id && id !== 'none').map((id) => labelFor('restrictions', id, language)),
  ];
  return labels.length ? labels.join(', ') : copyFor(language).myPage.nothing;
}

export function caregiverLine(name: string, email: string): string {
  if (name.trim() && email.trim()) return `${name.trim()} - ${email.trim()}`;
  return name.trim() || email.trim();
}

export function canSendEmailCode(current: string, next: string): boolean {
  const email = next.trim();
  return validEmail(email) && email.toLocaleLowerCase() !== current.trim().toLocaleLowerCase();
}
