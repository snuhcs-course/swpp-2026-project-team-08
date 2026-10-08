import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { AppIcon } from '../../../components/AppIcon';
import { formStyles as ui } from '../../../components/formStyles';
import type { PhotoSource } from '../../../data/api/mealPhotoApi';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import type { MealCheckinViewProps } from './mealCheckinViewTypes';
import { styles } from './mealCheckinStyles';

export function MealPhotoStepsView({
  p,
  replace,
  imageError,
  onReplace,
  onImageError,
  onPick,
  onRemovePhoto,
}: {
  p: MealCheckinViewProps;
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
    <View style={ui.stack}>
      {(['camera', 'gallery', 'files'] as const).map((source) => (
        <Pressable
          key={source}
          accessibilityRole="button"
          disabled={p.picking}
          onPress={() => onPick(source)}
          style={ui.choice}
        >
          <View style={ui.icon}><AppIcon name={source} size={18} /></View>
          <View style={{ flex: 1 }}>
            <Text style={ui.label}>{m[source]}</Text>
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
        contentFit="cover"
        onError={onImageError}
      />
    </Pressable>
  );

  if (d.step === 'photo') return (
    <>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{m.addPhoto}</Text>
        <Text style={styles.heroText}>{m.photoTip}</Text>
        <View style={ui.row}>
          <Image
            source={require('../../../../assets/meal/example-plate.png')}
            accessibilityLabel={m.example}
            style={styles.example}
            contentFit="cover"
          />
          <View style={{ flex: 1, gap: 10 }}>
            {m.photoTips.map((tip) => <Text key={tip} style={styles.heroText}>{tip}</Text>)}
          </View>
        </View>
      </View>
      {sources}
      <AppButton variant="meal" secondary label={m.noPhoto} onPress={() => p.onGo('foods')} />
    </>
  );

  if (d.step === 'preview') return (
    <>
      {photo}
      <View style={ui.row}>
        <AppButton secondary style={{ flex: 1 }} label={m.replace} onPress={onReplace} />
        <AppButton secondary style={{ flex: 1 }} label={m.removePhoto} onPress={onRemovePhoto} />
      </View>
      {replace && sources}
      <View style={ui.info}><Text style={ui.text}>{m.localPhoto}</Text></View>
    </>
  );

  if (d.step === 'method') return (
    <>
      {photo}
      <View style={ui.card}>
        <Text style={ui.text}>{m.consent}</Text>
        <Pressable accessibilityRole="link" onPress={() => p.onSheet('privacy')}>
          <Text style={ui.link}>{m.privacy}</Text>
        </Pressable>
      </View>
      <AppButton variant="meal" label={m.analyze} onPress={p.onAnalyze} disabled={!d.photo || imageError} />
      <AppButton variant="meal" secondary label={m.manual} onPress={() => p.onGo('foods')} />
    </>
  );

  if (d.step === 'analyzing') return (
    <>
      {photo}
      <ActivityIndicator color={colors.homePrimary} />
      <Text accessibilityLiveRegion="polite" style={ui.text}>{m.analyzing}</Text>
      <AppButton variant="meal" secondary label={m.cancelAnalysis} onPress={p.onCancelAnalysis} />
    </>
  );

  return (
    <>
      {photo}
      <Text accessibilityRole="alert" style={ui.error}>{m.analysisFailed}</Text>
      <AppButton variant="meal" label={s.common.retry} onPress={p.onAnalyze} />
      <AppButton variant="meal" secondary label={m.manual} onPress={() => p.onGo('foods')} />
    </>
  );
}
