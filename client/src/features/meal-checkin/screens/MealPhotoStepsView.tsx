// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; removed photo analysis flow
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
// This Code is generated with AI

import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { AppIcon } from '../../../components/AppIcon';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import { formStyles as ui } from '../../../components/formStyles';
import type { PhotoSource } from '../../../types/meal';
import { colors } from '../../../util/colors';
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
  onImageError,
  onPick,
  onRemovePhoto,
}: {
  p: PhotoStepProps;
  replace: boolean;
  imageError: boolean;
  onReplace: () => void;
  onImageError: () => void;
  onPick: (source: PhotoSource) => void;
  onRemovePhoto: () => void;
}) {
  const d = p.draft;
  const s = copyFor(p.language);
  const m = s.mealCheckin;
  const sources = (
    <View style={styles.sourceList}>
      {(['camera', 'gallery', 'files'] as const).map((source) => (
        <Pressable
          key={source}
          accessibilityRole="button"
          disabled={p.picking}
          onPress={() => onPick(source)}
          style={styles.sourceAction}
        >
          <View style={styles.sourceIcon}><AppIcon name={source} size={18} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sourceLabel}>{m[source]}</Text>
            {source === 'files' && <Text style={ui.muted}>{m.fileHint}</Text>}
          </View>
          <AppIcon name="next" size={16} />
        </Pressable>
      ))}
      {p.picking && <ActivityIndicator color={colors.homePrimary} />}
    </View>
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
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{m.addPhoto}</Text>
        <Text style={styles.heroText}>{m.photoTip}</Text>
        <View style={styles.heroVisual}>
          <View style={styles.exampleWrap}>
            <Image
              source={require('../../../../assets/meal/example-plate.png')}
              accessibilityLabel={m.example}
              style={styles.example}
              contentFit="contain"
            />
            <Text style={styles.exampleBadge}>{m.previewBadge}</Text>
          </View>
          <View style={styles.heroGuidance}>
            {m.photoTips.map((tip, i) => (
              <View key={tip} style={styles.heroTip}>
                <View style={styles.heroTipIcon}>
                  <AppIcon name={(['camera', 'gallery', 'files'] as const)[i]} size={14} />
                </View>
                <Text style={styles.heroTipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      {sources}
      <Pressable accessibilityRole="button" onPress={() => p.onGo('foods')} style={styles.manualRoute}>
        <View style={styles.sourceIcon}><UiAssetIcon name="meal-manual" /></View>
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
      <View style={styles.photoActions}>
        <AppButton variant="meal" secondary style={{ flex: 1 }} icon={<UiAssetIcon name="meal-refresh" />} label={m.replace} onPress={onReplace} />
        <Pressable accessibilityRole="button" onPress={onRemovePhoto} style={styles.removePhotoButton}>
          <UiAssetIcon name="meal-trash" />
          <Text style={styles.removePhotoText}>{m.removePhoto}</Text>
        </Pressable>
      </View>
      {replace && sources}
      <View style={styles.localPhotoInfo}>
        <UiAssetIcon name="meal-lock" />
        <Text style={[ui.text, { flex: 1 }]}>{m.localPhoto}</Text>
      </View>
    </>
  );

  return null;
}
