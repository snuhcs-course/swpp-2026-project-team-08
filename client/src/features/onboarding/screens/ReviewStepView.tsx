// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 채식 단계 이름 변경

import { Pressable, Text, View } from 'react-native';
import { ReviewCard } from '../../../components/ReviewCard';
import type { OnboardingStep } from '../types';
import type { ReviewRow } from './reviewRows';
import { styles } from './onboardingStyles';

export function ReviewStepView({
  rows,
  conflicts,
  editLabel,
  conflictLabel,
  onEditStep,
}: {
  rows: ReviewRow[];
  conflicts: string[];
  editLabel: string;
  conflictLabel: string;
  onEditStep: (step: OnboardingStep) => void;
}) {
  return (
    <View>
      {rows.map((row) => (
        <ReviewCard
          key={row.step}
          icon={row.step === 'allergies' ? 'review-shield' : row.step === 'vegetarian' ? 'review-users' : row.step === 'safe-foods' ? 'review-heart' : row.step === 'child' ? 'review-utensils' : 'review-info'}
          title={row.title}
          titleSize={row.step === 'allergies' ? 13 : 15}
          value={row.value}
          editLabel={editLabel}
          onEdit={() => onEditStep(row.step)}
        />
      ))}
      {conflicts.length > 0 && (
        <Pressable onPress={() => onEditStep('allergies')} accessibilityRole="button">
          <Text style={styles.warning}>{conflictLabel} {conflicts.join(', ')} · {editLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
