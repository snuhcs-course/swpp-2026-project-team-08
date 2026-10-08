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
