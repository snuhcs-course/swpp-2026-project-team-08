// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
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
  safeFoods: SafeFood[];
  noSafeFoods: boolean;
  updatedAt: string;
};
