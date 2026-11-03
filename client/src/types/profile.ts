// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Dietary Pattern 선택 및 저장
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 채식 제한 필드 이름 변경, 안심 음식 없음 플래그 제거
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 식생활 유형을 vegetarianRestrictions 와 함께 두고 familyFoods 제거

import type { DietaryPattern } from './dietaryPattern';

export type Language = 'ko' | 'en';

export type SafeFood = {
  id: string;
  name: string;
  preparation: string;
  presentationNote: string;
};

export type ChildProfile = {
  id: string;
  caregiverName: string;
  caregiverEmail: string;
  childName: string;
  ageRange: string;
  consent: {
    accountPrivacy: boolean;
    photoAnalysis: boolean;
    aiTraining: boolean;
  };
  allergies: string[];
  restrictions: string[];
  // 채식 제한은 입력 화면이 없다. 서버에 이미 저장된 값이 저장할 때 사라지지 않도록 보존만 한다.
  vegetarianRestrictions: string[];
  dietaryPattern?: DietaryPattern | null;
  safeFoods: SafeFood[];
  updatedAt: string;
};
