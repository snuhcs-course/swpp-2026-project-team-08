// This Code is generated with AI

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
          icon={row.step === 'allergies' ? 'review-shield' : row.step === 'family' ? 'review-users' : row.step === 'approaches' ? 'review-filter' : row.step === 'texture' || row.step === 'taste' ? 'review-sparkles' : row.step === 'safe-foods' ? 'review-heart' : row.step === 'child' ? 'review-utensils' : row.step === 'temperature' ? 'review-calendar' : row.step === 'presentation' || row.step === 'familiarity' ? 'review-route' : 'review-info'}
          title={row.title}
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
