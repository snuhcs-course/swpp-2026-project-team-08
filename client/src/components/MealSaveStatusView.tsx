// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
// Changed: 클라이언트 모델, DTO, DB Schema 통합 및 일관화
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: 식후 검토 저장 상태 버튼 디자인 통일

import { AppHeader, topBarStyles } from './AppHeader';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MealSavedPanel } from './MealSavedPanel';
import { AppButton } from './AppButton';
import { MealFlowButton } from './MealFlowButton';
import { MealTextButton } from './MealTextButton';
import { abcCopyFor, copyFor } from '../util/strings';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
import { displayDate } from '../util/date';
import type { FoodItem, Meal } from '../types/meal';
import type { Language } from '../types/profile';

export function MealSaveStatusView({ status, review = false, language, photos, mealDate, mealType, foods, onRetry, onSaveExit, onReturn }: {
  status: 'saving' | 'error'; review?: boolean; language: Language; photos: string[];
  mealDate: string; mealType: Meal['mealType'] | null; foods: FoodItem[];
  onRetry: () => void; onSaveExit: () => void; onReturn: () => void;
}) {
  const s=copyFor(language), a=abcCopyFor(language), failed=status==='error';
  return <SafeAreaView style={styles.root} edges={['top','bottom']}>
    <AppHeader title={review ? a.reviewSavedHeader : a.saveCheckinHeader} backLabel={s.common.back} onBack={onReturn} />
    <View style={topBarStyles.details}>
      <View style={styles.progress}>{[0,1,2,3,4].map(i=><View key={i} style={styles.segment}/>)}</View>
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <MealSavedPanel status={status} title={failed?(review?a.reviewSaveFailed:a.mealSaveFailed):(review?a.savingReview:a.savingMeal)}
        message={failed?a.entriesKept:a.saveWait} photos={photos} date={`${mealType?s.mealCheckin.types[mealType]:''}, ${displayDate(mealDate,language)}`} foodNames={foods.map(f=>f.name).join(', ')}
        note={failed&&review?a.retrySameMeal:undefined} actions={<>
          {!failed && <Text style={styles.kept}>{a.draftKept}</Text>}
          {review ? <>
            <MealFlowButton label={failed?s.common.retry:s.common.saving} disabled={!failed} onPress={onRetry}
              style={!failed&&styles.savingButton} labelStyle={!failed&&styles.savingText} />
            <MealTextButton label={failed?a.saveExit:a.returnEdit} onPress={failed?onSaveExit:onReturn} />
          </> : <>
            <AppButton variant="meal" label={failed?s.common.retry:s.common.saving} disabled={!failed} onPress={onRetry} style={[styles.button,!failed&&styles.savingButton]} labelStyle={[styles.buttonText,!failed&&styles.savingText]} />
            <AppButton variant="meal" secondary={failed} label={failed?s.common.saveExit:a.returnEdit} onPress={failed?onSaveExit:onReturn} style={styles.button} labelStyle={[styles.buttonText,failed&&{color:colors.homePrimary}]} />
          </>}
        </>} />
    </ScrollView>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:colors.afterMealBackground},progress:{flexDirection:'row',gap:6},
  segment:{height:4,flex:1,borderRadius:999,backgroundColor:colors.homePrimary},
  content:{...topBarStyles.content,paddingBottom:16,flexGrow:1},
  button:{minHeight:48},buttonText:{fontSize:16},savingButton:{opacity:1,backgroundColor:colors.editorDisabled},savingText:{color:colors.mealReviewMuted,opacity:1},
  kept:{textAlign:'center',fontSize:11,lineHeight:16,fontFamily:fonts.poppinsRegular,color:colors.mealReviewMuted,marginBottom:4},
});
