<<<<<<< HEAD
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
=======
// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가

>>>>>>> a902dcbc5a996c2df4f204d9955a76945e895f03
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
