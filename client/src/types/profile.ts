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
  approaches: string[];
  texture: string[];
  smell: string;
  taste: string[];
  presentation: string[];
  temperature: string;
  familiarity: string;
  safeFoods: SafeFood[];
  noSafeFoods: boolean;
  updatedAt: string;
};
