import type { Language } from '../types/profile';

const en = {
  common: {
    brand: 'NurtureBites',
    previous: 'Previous', continue: 'Continue', add: 'Add', remove: 'Remove', edit: 'Edit',
    retry: 'Retry', saveExit: 'Save & exit', saved: 'Auto-saved', saving: 'Saving…',
    saveFailed: 'Could not save. Retry before leaving.', loading: 'Getting things ready…',
    notEntered: 'Not entered', none: 'None', other: 'Other', all: 'All',
    close: 'Close', back: 'Go back', home: 'Home', language: '한국어',
    unavailable: 'This area is not ready yet.', empty: 'No records yet',
  },
  onboarding: {
    progress: (step: number, total: number) => `STEP ${step} OF ${total}`,
    titles: {
      account: 'Create your account', consent: 'Your privacy choices', child: 'Tell us about your child',
      allergies: 'Food allergies', restrictions: 'Other dietary restrictions', family: 'Foods in family meals',
      approaches: 'Dietary approaches', texture: 'Food textures', smell: 'Food smells',
      taste: 'Taste preferences', presentation: 'How food is served', temperature: 'Serving temperature',
      familiarity: 'New foods', 'safe-foods': 'Safe foods', review: 'Review your profile',
    },
    subtitles: {
      account: 'Welcome! Let’s take this one step at a time.', consent: 'Consent is needed to personalize your experience.',
      child: 'We only need an age range, not a birth date.',
      allergies: 'Select every known allergy. Help avoid foods that should not be suggested to the child.', restrictions: 'Select other required limits or choose None.',
      family: 'What foods are part of family meals? This step is optional.',
      approaches: 'Choose your family’s dietary approach or None.',
      texture: 'Which textures are difficult?', smell: 'Are strong food smells difficult?',
      taste: 'Which tastes are difficult? These answers are not a diagnosis.',
      presentation: 'How does your child prefer food to look or be arranged?',
      temperature: 'Actual accepted temperatures can be checked in meal records later.',
      familiarity: 'This is a general starting point, not an exposure stage for any food.',
      'safe-foods': 'Add foods your child consistently accepts in a familiar form.',
      review: 'Check the details before saving your profile.',
    },
    caregiverName: 'Your name', email: 'Email address', password: 'Password',
    passwordHint: 'Use at least 8 characters.', emailHint: 'Enter a valid email address.',
    childName: 'Child nickname', ageRange: 'Age range',
    accountPrivacy: 'Account and care privacy', photoAnalysis: 'Photo analysis and personalization',
    aiTraining: 'AI training and model research', required: 'Required', optional: 'Optional',
    consentDescriptions: {
      accountPrivacy: 'Account details and child profile are kept to support your care setup.',
      photoAnalysis: 'Meal photos and food details are used when you choose to analyze a meal.',
      aiTraining: 'Your information is not used for model research without this choice.',
    },
    viewDetail: 'View detail', consentNote: 'Prototype only: no account is created. The profile is saved on this device; passwords are not stored. Accept both required choices to continue.',
    consentPanelTitle: 'Consent to Collection and Use of Personal Information',
    consentPanelSubtitle: 'Required choices must be accepted to continue.',
    consentSafetyTitle: 'Safety and trust',
    searchCatalog: 'Search the catalog', noMatches: 'No matching catalog items',
    addOther: 'Other', otherAllergy: 'Other allergy', otherRestrictions: 'Other restrictions',
    otherFood: 'Other food', otherApproach: 'Other approach',
    otherHint: 'Add one item at a time.', selectedItems: 'Selected items',
    allergySafetyTitle: 'Safety-critical',
    allergySafetyBody: 'Always check labels, preparation and cross-contact yourself. The app does not replace medical advice.',
    treeNutsHint: 'almonds, walnuts, or cashews',
    noTexture: 'No clear texture difficulty', noTaste: 'No clear taste difficulty',
    noKnownAllergies: 'No known food allergies', noOtherRestrictions: 'No other dietary restrictions',
    noPresentation: 'No presentation preferences', noSafeFoods: 'No safe foods yet',
    foodName: 'Food name', preparation: 'Preparation', presentationNote: 'Presentation note (optional)',
    addSafeFood: 'Add safe food', safeFoodIncomplete: 'Enter a food name and preparation.',
    reviewChild: 'Child basics', reviewSafety: 'Safety restrictions', reviewFamily: 'Family practices',
    reviewApproaches: 'Dietary approaches', reviewSensory: 'Sensory tendencies',
    reviewSafeFoods: 'Safe foods', reviewFamiliarity: 'New-food familiarity',
    conflict: 'A safe food name matches a listed restriction. Review it before relying on that food.',
    looksGood: 'Looks good', localOnly: 'Prototype only: no account is created. Your profile is saved on this device; the password is not stored.',
    start: 'Start setup', resume: 'Resume setup', editProfile: 'Edit profile',
  },
  home: {
    today: 'Today', mealLog: 'Meal Log', sos: 'SOS', ideas: 'Ideas', insight: 'Insight', profile: 'Profile',
    greetingMorning: (name: string) => `Good morning, ${name}`,
    greetingAfternoon: (name: string) => `Good afternoon, ${name}`,
    greetingEvening: (name: string) => `Good evening, ${name}`,
    nextUp: 'NEXT UP · MEAL',
    nextTitle: 'Ready when you are', nextBody: 'A meal record helps you notice what made today easier.',
    logMeal: 'Log this meal', sosTitle: 'SOS Progress',
    sosBody: 'Food experience steps you have recorded', noExposure: 'No foods are being tracked yet.',
    itemCount: (count: number) => `${count} items`,
    recommendations: 'Recommended action goals', goalsSubtitle: 'Small steps to make meals easier', noRecommendations: 'No saved suggestions yet.',
    try: 'Try', calendar: 'Meal Log Calendar', calendarSubtitle: 'Logged days in dark blue, unlogged days in light blue', logged: 'Logged', unlogged: 'Unlogged',
    calendarDayStatus: (day: number, logged: boolean) => `${day}: ${logged ? 'Logged' : 'Unlogged'}`,
    noMeals: 'No meals logged this month.', profileTitle: 'Profile',
    caregiver: 'Caregiver', child: 'Child', editProfile: 'Edit profile',
    mealUnavailable: 'Meal Check-in will be available when that feature is implemented.',
    sectionUnavailable: 'This section will be available when its feature is implemented.',
    refreshFailed: 'Could not load your records.',
  },
};

const ko = {
  common: {
    brand: 'NurtureBites',
    previous: '이전', continue: '계속', add: '추가', remove: '삭제', edit: '수정',
    retry: '다시 시도', saveExit: '저장하고 나가기', saved: '자동 저장됨', saving: '저장 중…',
    saveFailed: '저장하지 못했습니다. 나가기 전에 다시 시도해 주세요.', loading: '준비하고 있어요…',
    notEntered: '입력하지 않음', none: '해당 없음', other: '기타', all: '모두',
    close: '닫기', back: '뒤로', home: '홈', language: 'English',
    unavailable: '아직 준비 중인 영역입니다.', empty: '기록이 없습니다',
  },
  onboarding: {
    progress: (step: number, total: number) => `${total}단계 중 ${step}단계`,
    titles: {
      account: '보호자 정보 입력', consent: '개인정보 동의', child: '아이에 대해 알려주세요',
      allergies: '식품 알레르기', restrictions: '기타 식이 제한', family: '가족 식단의 식품',
      approaches: '식이 접근 방식', texture: '음식의 식감', smell: '음식의 냄새',
      taste: '맛 선호', presentation: '음식 제공 형태', temperature: '음식의 온도',
      familiarity: '새로운 음식', 'safe-foods': '안심하고 먹는 음식', review: '프로필 검토',
    },
    subtitles: {
      account: '환영합니다! 한 단계씩 진행해 볼게요.', consent: '맞춤 경험을 위한 동의가 필요합니다.',
      child: '정확한 생년월일 대신 연령대만 입력합니다.',
      allergies: '알고 있는 알레르기를 모두 선택해 주세요. 아이에게 추천하면 안 되는 음식을 피하는 데 사용합니다.', restrictions: '필수 제한을 선택하거나 해당 없음을 선택하세요.',
      family: '가족 식단에 포함하는 식품을 선택하세요. 건너뛸 수 있습니다.',
      approaches: '가족의 식이 방식을 선택하거나 해당 없음을 선택하세요.',
      texture: '어려워하는 식감이 있나요?', smell: '강한 음식 냄새가 어려운가요?',
      taste: '어려워하는 맛이 있나요? 이 답변은 진단이 아닙니다.',
      presentation: '음식의 모양이나 배치에 선호가 있나요?',
      temperature: '실제로 받아들인 온도는 이후 식사 기록에서 확인할 수 있습니다.',
      familiarity: '일반적인 시작점이며 음식별 경험 단계로 자동 설정되지 않습니다.',
      'safe-foods': '익숙한 형태로 꾸준히 먹는 음식을 추가하세요.',
      review: '저장하기 전에 내용을 확인해 주세요.',
    },
    caregiverName: '보호자 이름', email: '이메일 주소', password: '비밀번호',
    passwordHint: '8글자 이상 입력해 주세요.', emailHint: '올바른 이메일 주소를 입력해 주세요.',
    childName: '아이의 별명', ageRange: '연령대',
    accountPrivacy: '계정 및 돌봄 정보', photoAnalysis: '사진 분석 및 개인화',
    aiTraining: 'AI 학습 및 모델 연구', required: '필수', optional: '선택',
    consentDescriptions: {
      accountPrivacy: '돌봄 설정을 위해 계정 정보와 아동 프로필을 보관합니다.',
      photoAnalysis: '식사 분석을 선택했을 때 사진과 음식 정보를 사용합니다.',
      aiTraining: '이 항목을 선택하지 않으면 모델 연구에 정보를 사용하지 않습니다.',
    },
    viewDetail: '자세히 보기', consentNote: '프로토타입에서는 계정이 생성되지 않습니다. 프로필은 기기에 저장하며 비밀번호는 저장하지 않습니다. 계속하려면 필수 항목에 동의해 주세요.',
    consentPanelTitle: '개인정보 수집 및 이용 동의',
    consentPanelSubtitle: '필수 항목에 동의해야 계속할 수 있습니다.',
    consentSafetyTitle: '안전과 신뢰',
    searchCatalog: '목록 검색', noMatches: '검색 결과가 없습니다',
    addOther: '기타', otherAllergy: '기타 알레르기', otherRestrictions: '기타 식이 제한',
    otherFood: '기타 식품', otherApproach: '기타 식이 방식',
    otherHint: '한 번에 한 항목씩 추가하세요.', selectedItems: '선택한 항목',
    allergySafetyTitle: '안전 주의',
    allergySafetyBody: '식품 표시, 조리 과정, 교차 접촉 가능성을 직접 확인하세요. 앱은 의학적 조언을 대신하지 않습니다.',
    treeNutsHint: '아몬드, 호두, 캐슈넛',
    noTexture: '뚜렷하게 어려운 식감 없음', noTaste: '뚜렷하게 어려운 맛 없음',
    noKnownAllergies: '알려진 식품 알레르기 없음', noOtherRestrictions: '기타 식이 제한 없음',
    noPresentation: '제공 형태 선호 없음', noSafeFoods: '아직 안심 음식 없음',
    foodName: '음식 이름', preparation: '조리 방법', presentationNote: '제공 메모 (선택)',
    addSafeFood: '안심 음식 추가', safeFoodIncomplete: '음식 이름과 조리 방법을 입력해 주세요.',
    reviewChild: '아이 기본 정보', reviewSafety: '안전 관련 제한', reviewFamily: '가족 식단',
    reviewApproaches: '식이 방식', reviewSensory: '감각 경향',
    reviewSafeFoods: '안심 음식', reviewFamiliarity: '새 음식 친숙도',
    conflict: '안심 음식 이름이 제한 항목과 겹칩니다. 해당 음식을 다시 확인해 주세요.',
    looksGood: '확인했어요', localOnly: '프로토타입에서는 계정이 생성되지 않습니다. 프로필은 이 기기에 저장하며 비밀번호는 저장하지 않습니다.',
    start: '설정 시작하기', resume: '설정 이어하기', editProfile: '프로필 수정',
  },
  home: {
    today: '오늘', mealLog: '식사 기록', sos: 'SOS', ideas: '아이디어', insight: '인사이트', profile: '프로필',
    greetingMorning: (name: string) => `좋은 아침이에요, ${name}님`,
    greetingAfternoon: (name: string) => `좋은 오후예요, ${name}님`,
    greetingEvening: (name: string) => `좋은 저녁이에요, ${name}님`,
    nextUp: '다음 식사', nextTitle: '준비됐을 때 시작하세요', nextBody: '식사 기록으로 오늘 편했던 점을 살펴볼 수 있어요.',
    logMeal: '식사 기록하기', sosTitle: 'SOS 진행', sosBody: '기록한 음식 경험 단계',
    noExposure: '아직 추적 중인 음식이 없습니다.', itemCount: (count: number) => `${count}개`,
    recommendations: '추천 목표', goalsSubtitle: '식사를 더 편하게 만드는 작은 시도', noRecommendations: '저장한 제안이 없습니다.',
    try: '살펴보기', calendar: '식사 기록 달력', calendarSubtitle: '기록한 날은 진한 파랑, 그 외 날짜는 연한 파랑', logged: '기록 있음', unlogged: '기록 없음',
    calendarDayStatus: (day: number, logged: boolean) => `${day}일: ${logged ? '기록 있음' : '기록 없음'}`,
    noMeals: '이번 달 식사 기록이 없습니다.', profileTitle: '프로필',
    caregiver: '보호자', child: '아이', editProfile: '프로필 수정',
    mealUnavailable: '식사 기록 기능이 구현되면 이곳에서 시작할 수 있습니다.',
    sectionUnavailable: '이 영역은 해당 기능이 구현되면 사용할 수 있습니다.',
    refreshFailed: '기록을 불러오지 못했습니다.',
  },
};

export const strings = { en, ko };
export function copyFor(language: Language) { return strings[language]; }

type Label = { en: string; ko: string };
type Option = { id: string; label: Label };
export type OptionGroup = 'age' | 'allergies' | 'allergyCatalog' | 'restrictions' | 'restrictionCatalog' |
  'family' | 'familyCatalog' | 'approaches' | 'approachCatalog' | 'texture' | 'smell' |
  'taste' | 'presentation' | 'temperature' | 'familiarity';

const options: Record<OptionGroup, Option[]> = {
  age: [
    ['toddler', '1–3 years', '1–3세'], ['preschool', '4–6 years', '4–6세'],
    ['school', '7–12 years', '7–12세'], ['teen', '13–17 years', '13–17세'],
  ].map(([id, en, ko]) => ({ id, label: { en, ko } })),
  allergies: [
    ['peanut', 'Peanuts', '땅콩'], ['tree-nut', 'Tree nuts', '견과류'],
    ['milk', 'Milk / Dairy', '우유 / 유제품'], ['egg', 'Eggs', '달걀'],
    ['soy', 'Soy', '대두'], ['wheat', 'Wheat', '밀'],
    ['fish', 'Fish', '생선'], ['shellfish', 'Shellfish', '갑각류'], ['sesame', 'Sesame', '참깨'],
  ].map(([id, en, ko]) => ({ id, label: { en, ko } })),
  allergyCatalog: [
    ['coconut', 'Coconut', '코코넛'], ['buckwheat', 'Buckwheat', '메밀'],
    ['kiwi', 'Kiwi', '키위'], ['strawberry', 'Strawberry', '딸기'],
  ].map(([id, en, ko]) => ({ id, label: { en, ko } })),
  restrictions: [
    ['gluten-free', 'Gluten free', '글루텐 제한'], ['lactose-free', 'Lactose free', '유당 제한'],
    ['low-sodium', 'Low sodium', '저염식'],
  ].map(([id, en, ko]) => ({ id, label: { en, ko } })),
  restrictionCatalog: [
    ['no-pork', 'No pork', '돼지고기 제외'], ['no-beef', 'No beef', '소고기 제외'],
  ].map(([id, en, ko]) => ({ id, label: { en, ko } })),
  family: [
    ['vegetables', 'Vegetables', '채소'], ['fruits', 'Fruits', '과일'],
    ['grains', 'Grains', '곡류'], ['meat', 'Meat', '육류'],
    ['fish', 'Fish', '생선'], ['dairy', 'Dairy', '유제품'],
  ].map(([id, en, ko]) => ({ id, label: { en, ko } })),
  familyCatalog: [
    ['legumes', 'Legumes', '콩류'], ['eggs', 'Eggs', '달걀'], ['seaweed', 'Seaweed', '해조류'],
  ].map(([id, en, ko]) => ({ id, label: { en, ko } })),
  approaches: [
    ['vegetarian', 'Vegetarian', '채식'], ['vegan', 'Vegan', '비건'],
    ['halal', 'Halal', '할랄'], ['kosher', 'Kosher', '코셔'],
  ].map(([id, en, ko]) => ({ id, label: { en, ko } })),
  approachCatalog: [
    ['pescatarian', 'Pescatarian', '페스코'], ['mediterranean', 'Mediterranean', '지중해식'],
  ].map(([id, en, ko]) => ({ id, label: { en, ko } })),
  texture: [
    ['smooth', 'Smooth or creamy', '부드럽거나 크림 같은'],
    ['lumpy', 'Lumpy', '덩어리가 있는'], ['crunchy', 'Crunchy', '바삭한'],
    ['chewy', 'Chewy', '질긴'], ['slippery', 'Slippery', '미끄러운'],
  ].map(([id, en, ko]) => ({ id, label: { en, ko } })),
  smell: [
    ['yes', 'Yes', '네'], ['sometimes', 'Sometimes', '가끔'],
    ['no', 'No', '아니요'], ['unsure', 'Not sure', '잘 모르겠어요'],
  ].map(([id, en, ko]) => ({ id, label: { en, ko } })),
  taste: [
    ['sweet', 'Sweet', '단맛'], ['salty', 'Salty', '짠맛'],
    ['sour', 'Sour', '신맛'], ['bitter', 'Bitter', '쓴맛'], ['spicy', 'Spicy', '매운맛'],
  ].map(([id, en, ko]) => ({ id, label: { en, ko } })),
  presentation: [
    ['color', 'Color', '색'], ['shape', 'Shape and size', '모양과 크기'],
    ['separate', 'Foods kept separate', '음식이 닿지 않게'],
    ['visible', 'Ingredients visible', '재료가 보이게'],
  ].map(([id, en, ko]) => ({ id, label: { en, ko } })),
  temperature: [
    ['none', 'No clear preference', '뚜렷한 선호 없음'], ['warm', 'Warm', '따뜻하게'],
    ['cool', 'Cool / chilled', '차갑게'], ['room', 'Room temperature', '상온'],
    ['depends', 'It depends on the food', '음식마다 달라요'],
  ].map(([id, en, ko]) => ({ id, label: { en, ko } })),
  familiarity: [
    ['tastes', 'Usually tastes a new food', '새 음식을 보통 맛봐요'],
    ['plate', 'Okay on the plate, may not taste', '접시에 놓여도 괜찮지만 먹지 않을 수 있어요'],
    ['nearby', 'Prefers it nearby but separate', '가까이 두되 분리하는 편이에요'],
    ['removed', 'Wants it removed', '치워 주길 원해요'],
    ['varies', 'Varies by food', '음식마다 달라요'], ['unsure', 'Not sure', '잘 모르겠어요'],
  ].map(([id, en, ko]) => ({ id, label: { en, ko } })),
};

export function optionsFor(group: OptionGroup, language: Language) {
  return options[group].map(({ id, label }) => ({ id, label: label[language] }));
}

export function labelFor(group: OptionGroup, id: string, language: Language): string {
  if (id === 'none') return strings[language].common.none;
  const catalog: Partial<Record<OptionGroup, OptionGroup>> = {
    allergies: 'allergyCatalog', restrictions: 'restrictionCatalog',
    family: 'familyCatalog', approaches: 'approachCatalog',
  };
  return options[group].find((option) => option.id === id)?.label[language]
    ?? (catalog[group] ? options[catalog[group]].find((option) => option.id === id)?.label[language] : undefined)
    ?? id;
}
