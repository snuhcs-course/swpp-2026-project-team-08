// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
// Changed: 클라이언트 모델, DTO, DB Schema 통합 및 일관화
// AI-generated with GPT-6, 2026-11-03, reviewed by Seoyeon Heo
// Changed: 식후 검토 저장 상태 버튼 디자인 통일; 공통 진행 바 사용
// AI-generated with Grok 4.7, 2026-11-14, reviewed by Doyeon Kim
// Changed: 저장 중·실패 화면을 같은 식사 카드로 표시

import { ProgressBar } from './ProgressBar';
import { AppHeader, topBarStyles } from './AppHeader';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MealSavedPanel, type SavedMealPhoto } from './MealSavedPanel';
import { MealFlowButton } from './MealFlowButton';
import { MealTextButton } from './MealTextButton';
import { abcCopyFor, copyFor } from '../util/strings';
import { colors } from '../util/colors';
import { displayDate } from '../util/date';
import type { FoodItem, Meal } from '../types/meal';
import type { Language } from '../types/profile';

export function MealSaveStatusView({ status, review = false, language, photos, mealDate, mealType, foods, onRetry, onSaveExit, onReturn }: {
  status: 'saving' | 'error'; review?: boolean; language: Language; photos: readonly SavedMealPhoto[];
  mealDate: string; mealType: Meal['mealType'] | null; foods: FoodItem[];
  onRetry: () => void; onSaveExit: () => void; onReturn: () => void;
}) {
  const s = copyFor(language), a = abcCopyFor(language), failed = status === 'error';
  const background = failed ? colors.saveErrorBackground : colors.saveSavingBackground;
  return <SafeAreaView style={[styles.root, { backgroundColor: background }]} edges={['top', 'bottom']}>
    <AppHeader title={review ? a.reviewSavedHeader : a.saveCheckinHeader} backLabel={s.common.back} onBack={onReturn}
      style={{ backgroundColor: background }} />
    <View style={topBarStyles.details}>
      <ProgressBar current={5} total={5} style={styles.progress} trackStyle={styles.segment} accessible={false} />
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <MealSavedPanel status={status}
        title={failed ? (review ? a.reviewSaveFailed : a.mealSaveFailed) : (review ? a.savingReview : a.savingMeal)}
        message={failed ? a.entriesKept : a.saveWait}
        photos={photos}
        mealTypeLabel={mealType ? s.mealCheckin.types[mealType] : ''}
        date={displayDate(mealDate, language)}
        foodNames={foods.map((food) => food.name)}
        note={failed ? (review ? a.retrySameMeal : undefined) : a.draftKept}
        actions={<>
          <MealFlowButton label={failed ? s.common.retry : s.common.saving} disabled={!failed} onPress={onRetry}
            icon={failed ? null : <ActivityIndicator color={colors.homePrimary} />}
            style={!failed && styles.savingButton} labelStyle={[styles.buttonText, !failed && styles.savingText]} />
          <MealTextButton label={failed ? s.common.saveExit : a.returnEdit} onPress={failed ? onSaveExit : onReturn} />
        </>} />
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.saveSavingBackground },
  progress: { flexDirection: 'row', gap: 6 },
  segment: { height: 4, flex: 1, borderRadius: 999, backgroundColor: colors.homePrimary },
  content: { ...topBarStyles.content, paddingBottom: 16, flexGrow: 1 },
  buttonText: { fontSize: 16 },
  savingButton: { opacity: 1, backgroundColor: colors.saveLoadingButton },
  savingText: { color: colors.homePrimary, opacity: 1 },
});
