// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 거절 확인 버튼 배치 및 추가 생성 중 기존 로딩 카드 표시

import { ScrollView, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import type { Language } from '../../../types/profile';
import type { DismissReason } from '../../../types/suggestionRecord';
import { suggestionCopyFor } from '../../../util/strings';
import { suggestionStyles as s } from '../screens/suggestionStyles';
import { RecommendationStateCard } from './RecommendationStateCard';

export function RegenerationPrompt({ foodName, reasons, language, busy, generating, failed,
  onGenerate, onContinue }: {
  foodName: string;
  reasons: DismissReason[];
  language: Language;
  busy: boolean;
  generating: boolean;
  failed: boolean;
  onGenerate: () => void;
  onContinue: () => void;
}) {
  const c = suggestionCopyFor(language);
  if (generating) return <RecommendationStateCard language={language} onRetry={onGenerate} />;
  return <View style={s.cardStack}>
    <View style={[s.stackLayer, s.stackBack]} />
    <View style={[s.stackLayer, s.stackMiddle]} />
    <View style={[s.stackFace, s.dismissCard]}>
      <Text style={s.savedFoodName}>{foodName}</Text>
      <ScrollView style={s.grow} contentContainerStyle={s.regenerationBody}>
        <Text accessibilityRole="header" style={s.heading}>{c.dismissedNotice}</Text>
        {reasons.map(reason => <Text key={reason} style={s.savedIntro}>{c.reasons[reason]}</Text>)}
        <Text style={s.text}>{c.regenerationQuestion}</Text>
        {failed && <Text accessibilityRole="alert" style={s.error}>{c.regenerationFailed}</Text>}
      </ScrollView>
      <View style={s.regenerationActions}>
        <AppButton variant="suggestion" style={s.regenerationButton} disabled={busy}
          label={failed ? c.retry : c.regenerate} onPress={onGenerate} />
        <AppButton variant="suggestion" style={s.regenerationButton} secondary disabled={busy}
          label={c.continueWithoutRegeneration} onPress={onContinue} />
      </View>
    </View>
  </View>;
}
