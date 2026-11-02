// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Dietary Pattern 선택 및 저장
// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가

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
  familyFoods: string[];
  dietaryPattern?: DietaryPattern | null;
  safeFoods: SafeFood[];
  noSafeFoods: boolean;
  updatedAt: string;
};
