// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Use the shared compact meal photo introduction card
// AI-generated with GPT-6.2 Astra, 2026-11-22, reviewed by Haechan Jung
// Changed: 식전·식후 공통 사진 선택·교체·삭제 UI 사용

import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';
import { MealPhotoActions } from '../../../components/MealPhotoActions';
import { MealPhotoSourcePicker } from '../../../components/MealPhotoSourcePicker';
import { AppIcon } from '../../../components/AppIcon';
import { MealPhotoIntroCard } from '../../../components/MealPhotoIntroCard';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import { formStyles as ui } from '../../../components/formStyles';
import type { PhotoSource } from '../../../types/meal';
import { copyFor } from '../../../util/strings';
import type { MealCheckinViewProps } from './mealCheckinViewTypes';
import { styles } from './mealCheckinStyles';

type PhotoStepProps = Pick<MealCheckinViewProps,
  'draft' | 'language' | 'picking' | 'onFullPhoto' | 'onGo' |
  'onSheet' | 'onSaveExit'>;

export function MealPhotoStepsView({
  p,
  replace,
  imageError,
  onReplace,
  onCloseReplace,
  onImageError,
  onPick,
  onRemovePhoto,
}: {
  p: PhotoStepProps;
  replace: boolean;
  imageError: boolean;
  onReplace: () => void;
  onCloseReplace: () => void;
  onImageError: () => void;
  onPick: (source: PhotoSource) => void;
  onRemovePhoto: () => void;
}) {
  const d = p.draft;
  const s = copyFor(p.language);
  const m = s.mealCheckin;
  const sources = (
    <MealPhotoSourcePicker labels={m} fileHint={m.fileHint} picking={p.picking} inSheet={replace} onPick={onPick} />
  );
  const photo = d.photo && (
    <Pressable accessibilityRole="button" accessibilityLabel={m.fullPhoto} onPress={p.onFullPhoto}>
      <Image
        source={{ uri: d.photo.uri }}
        style={styles.photo}
        contentFit={d.step === 'preview' ? 'contain' : 'cover'}
        onError={onImageError}
      />
    </Pressable>
  );

  if (d.step === 'photo') return (
    <>
      <MealPhotoIntroCard title={m.addPhoto} subtitle={m.photoTip} />
      {sources}
      <Pressable accessibilityRole="button" onPress={() => p.onGo('foods')} style={styles.manualRoute}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.manualRouteLabel}>{m.skipPhoto}</Text>
          <Text style={ui.muted}>{m.skipPhotoHint}</Text>
        </View>
        <AppIcon name="next" size={16} />
      </Pressable>
    </>
  );

  if (d.step === 'preview') return (
    <>
      {photo}
      <Pressable onPress={p.onFullPhoto} accessibilityRole="button" style={styles.fullPhotoHint}>
        <UiAssetIcon name="meal-maximize" />
        <Text style={styles.fullPhotoHintText}>{m.fullPhoto}</Text>
      </Pressable>
      <MealPhotoActions language={p.language} sheetTitle={m.replaceSourceTitle} sheetOpen={replace}
        onReplace={onReplace} onClose={onCloseReplace} onRemove={onRemovePhoto}>
        {sources}
      </MealPhotoActions>
      <View style={styles.localPhotoInfo}>
        <UiAssetIcon name="meal-lock" />
        <Text style={[ui.text, { flex: 1 }]}>{m.localPhoto}</Text>
      </View>
    </>
  );

  return null;
}
