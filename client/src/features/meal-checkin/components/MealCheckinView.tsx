import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import {
  mealSettings,
  mealTypes,
  type FoodItem,
  type FoodTraits,
  type MealDraft,
  type MealStep,
} from '../../../types/meal';
import type { Language } from '../../../types/profile';
import type { PhotoSource } from '../../../data/api/mealPhotoApi';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { FoodEditor, FoodTraitsTags } from './FoodEditor';
import { MealDateField } from './MealDateField';
import { MealChoice, MealIcon, MealSheet, styles as ui } from './MealControls';
type Props = {
  draft: MealDraft;
  language: Language;
  saveStatus: 'saving' | 'saved' | 'error';
  error: 'permission' | 'image' | 'save' | null;
  picking: boolean;
  saving: boolean;
  traits: FoodTraits | null;
  sheet: 'help' | 'privacy' | null;
  onUpdate: (value: Partial<MealDraft>) => void;
  onGo: (step: MealStep) => void;
  onBack: () => void;
  onPick: (source: PhotoSource) => void;
  onFullPhoto: () => void;
  onAnalyze: () => void;
  onCancelAnalysis: () => void;
  onEdit: (food?: FoodItem) => void;
  onRemove: (id: string) => void;
  onChangeFood: (value: Partial<FoodItem>) => void;
  onSaveFood: () => void;
  onConfirm: () => void;
  onSave: (skip: boolean) => void;
  onAfterMeal: () => void;
  onHome: () => void;
  onSheet: (sheet: 'help' | 'privacy' | null) => void;
  onTraits: (value: FoodTraits | null) => void;
  onSaveTraits: () => void;
  onRetryDraft: () => void;
  onLanguage: () => void;
};
export function MealCheckinView(p: Props) {
  const s = copyFor(p.language);
  const m = s.mealCheckin;
  const d = p.draft;
  const [replace, setReplace] = useState(false);
  const [imageError, setImageError] = useState(false);
  const review = d.step === 'foods' || d.step === 'goal';
  const segment =
    d.step === 'details'
      ? 0
      : ['photo', 'preview'].includes(d.step)
        ? 1
        : ['method', 'analyzing', 'analysis-error'].includes(d.step)
          ? 2
          : d.step === 'foods'
            ? 3
            : 4;
  const sources = (
    <View style={ui.stack}>
      {(['camera', 'gallery', 'files'] as const).map((source) => (
        <Pressable
          key={source}
          accessibilityRole="button"
          disabled={p.picking}
          onPress={() => {
            setImageError(false);
            setReplace(false);
            p.onPick(source);
          }}
          style={ui.choice}
        >
          <View style={ui.icon}>
            <MealIcon name={source} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ui.label}>{m[source]}</Text>
            {source === 'files' && <Text style={ui.muted}>{m.fileHint}</Text>}
          </View>
          <MealIcon name="next" size={16} />
        </Pressable>
      ))}
      {p.picking && <ActivityIndicator color={colors.homePrimary} />}
    </View>
  );
  const photo = d.photo && (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={m.fullPhoto}
      onPress={p.onFullPhoto}
    >
      <Image
        source={{ uri: d.photo.uri }}
        style={styles.photo}
        contentFit="cover"
        onError={() => setImageError(true)}
      />
    </Pressable>
  );
  const help = (
    <>
      <Text style={ui.text}>{m.trackerBody}</Text>
      {m.ladder.map((name, i) => (
        <View key={name} style={ui.row}>
          <View style={ui.tag}>
            <Text style={ui.label}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ui.label}>{name}</Text>
            <Text style={ui.muted}>{m.ladderDetails[i]}</Text>
          </View>
        </View>
      ))}
      <AppButton
        variant="meal"
        secondary
        label={s.common.back}
        onPress={() => p.onSheet(null)}
      />
    </>
  );
  return (
    <SafeAreaView
      style={[styles.root, review && styles.reviewRoot]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={s.common.back}
            disabled={p.saving}
            onPress={p.onBack}
            style={styles.back}
          >
            <MealIcon name="back" size={18} />
          </Pressable>
          <Text style={[ui.heading, { flex: 1 }]}>{m.titles[d.step]}</Text>
          <Pressable accessibilityRole="button" onPress={p.onLanguage}>
            <Text style={ui.link}>{s.common.language}</Text>
          </Pressable>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: 5, now: segment + 1 }}
          style={styles.progress}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[styles.segment, i <= segment && styles.activeSegment]}
            />
          ))}
        </View>
        <View style={{ flex: 1 }} pointerEvents={p.saving ? 'none' : 'auto'}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {d.step === 'details' && (
              <>
                <Text style={ui.title}>{m.settingTitle}</Text>
                <MealDateField
                  value={d.mealDate}
                  language={p.language}
                  onChange={(mealDate) => p.onUpdate({ mealDate })}
                />
                <Text style={ui.label}>{m.mealType}</Text>
                <View style={ui.grid}>
                  {mealTypes.map((value) => (
                    <MealChoice
                      key={value}
                      label={m.types[value]}
                      tile
                      icon={value}
                      selected={d.mealType === value}
                      onPress={() => p.onUpdate({ mealType: value })}
                    />
                  ))}
                </View>
                <Text style={[ui.label, { fontSize: 14 }]}>{m.setting}</Text>
                <View style={ui.grid}>
                  {mealSettings.map((value) => (
                    <MealChoice
                      key={value}
                      label={m.settings[value]}
                      tile
                      icon={value}
                      selected={d.setting === value}
                      onPress={() => p.onUpdate({ setting: value })}
                    />
                  ))}
                </View>
              </>
            )}
            {d.step === 'photo' && (
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
                      {m.photoTips.map((tip) => (
                        <Text key={tip} style={styles.heroText}>
                          {tip}
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>
                {sources}
                <AppButton
                  variant="meal"
                  secondary
                  label={m.noPhoto}
                  onPress={() => p.onGo('foods')}
                />
              </>
            )}
            {d.step === 'preview' && (
              <>
                {photo}
                <View style={ui.row}>
                  <AppButton
                    secondary
                    style={{ flex: 1 }}
                    label={m.replace}
                    onPress={() => setReplace(!replace)}
                  />
                  <AppButton
                    secondary
                    style={{ flex: 1 }}
                    label={m.removePhoto}
                    onPress={() => {
                      setImageError(false);
                      p.onUpdate({
                        photo: null,
                        step: 'photo',
                        foods: d.foods.filter((f) => f.source === 'parent'),
                        exposureFoodId: null,
                      });
                    }}
                  />
                </View>
                {replace && sources}
                <View style={ui.info}>
                  <Text style={ui.text}>{m.localPhoto}</Text>
                </View>
              </>
            )}
            {d.step === 'method' && (
              <>
                {photo}
                <View style={ui.card}>
                  <Text style={ui.text}>{m.consent}</Text>
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => p.onSheet('privacy')}
                  >
                    <Text style={ui.link}>{m.privacy}</Text>
                  </Pressable>
                </View>
                <AppButton
                  variant="meal"
                  label={m.analyze}
                  onPress={p.onAnalyze}
                  disabled={!d.photo || imageError}
                />
                <AppButton
                  variant="meal"
                  secondary
                  label={m.manual}
                  onPress={() => p.onGo('foods')}
                />
              </>
            )}
            {d.step === 'analyzing' && (
              <>
                {photo}
                <ActivityIndicator color={colors.homePrimary} />
                <Text accessibilityLiveRegion="polite" style={ui.text}>
                  {m.analyzing}
                </Text>
                <AppButton
                  variant="meal"
                  secondary
                  label={m.cancelAnalysis}
                  onPress={p.onCancelAnalysis}
                />
              </>
            )}
            {d.step === 'analysis-error' && (
              <>
                {photo}
                <Text accessibilityRole="alert" style={ui.error}>
                  {m.analysisFailed}
                </Text>
                <AppButton
                  variant="meal"
                  label={s.common.retry}
                  onPress={p.onAnalyze}
                />
                <AppButton
                  variant="meal"
                  secondary
                  label={m.manual}
                  onPress={() => p.onGo('foods')}
                />
              </>
            )}
            {review && (
              <>
                <Text style={ui.label}>
                  {d.foods.some((f) => f.source === 'ai')
                    ? m.aiCount(d.foods.filter((f) => f.source === 'ai').length)
                    : m.foodCount(d.foods.length)}
                </Text>
                <Text style={ui.muted}>{m.reviewRequired}</Text>
                {!d.foods.length && <Text style={ui.text}>{m.empty}</Text>}
                {d.foods.map((food) => (
                  <View key={food.id} style={ui.card}>
                    <View style={ui.row}>
                      <Text style={[ui.label, { flex: 1, fontSize: 13 }]}>
                        {food.name}
                      </Text>
                      <Text
                        style={[
                          ui.muted,
                          {
                            color:
                              food.source === 'ai'
                                ? colors.error
                                : colors.success,
                          },
                        ]}
                      >
                        {food.source === 'ai' ? m.ai : m.parent}
                      </Text>
                    </View>
                    <Text style={ui.muted}>{m.ingredients}</Text>
                    <Text style={ui.text}>
                      {food.ingredients.join(', ') || s.common.notEntered}
                    </Text>
                    <View style={ui.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={ui.muted}>{m.preparation}</Text>
                        <Text style={ui.text}>
                          {food.preparation || s.common.notEntered}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={ui.muted}>{m.servingNote}</Text>
                        <Text style={ui.text}>
                          {food.servingNote || s.common.notEntered}
                        </Text>
                      </View>
                    </View>
                    <Text style={ui.muted}>{m.traits}</Text>
                    <FoodTraitsTags
                      traits={food.traits}
                      language={p.language}
                    />
                    <Text style={ui.muted}>{m.history}</Text>
                    <Text style={ui.text}>
                      {food.history
                        ? m.histories[food.history]
                        : s.common.notEntered}
                    </Text>
                    <View style={ui.row}>
                      <AppButton
                        style={{ flex: 1 }}
                        secondary
                        label={s.common.edit}
                        onPress={() => p.onEdit(food)}
                      />
                      <AppButton
                        style={{ flex: 1 }}
                        secondary
                        label={s.common.remove}
                        onPress={() => p.onRemove(food.id)}
                      />
                    </View>
                  </View>
                ))}
                <AppButton
                  variant="meal"
                  secondary
                  label={m.addFood}
                  onPress={() => p.onEdit()}
                />
                <View style={ui.info}>
                  <Text style={ui.text}>{m.aiNote}</Text>
                </View>
              </>
            )}
            {d.step === 'complete' && (
              <>
                <Text style={ui.title}>{m.titles.complete}</Text>
                <Text style={ui.text}>{m.done}</Text>
                <Text style={ui.muted}>
                  {d.mealDate} · {d.mealType && m.types[d.mealType]} ·{' '}
                  {d.setting && m.settings[d.setting]}
                </Text>
                <Text style={ui.text}>{m.foodCount(d.foods.length)}</Text>
                <AppButton
                  variant="meal"
                  label={m.afterMeal}
                  disabled={!d.savedMealId}
                  onPress={p.onAfterMeal}
                />
                <AppButton
                  variant="meal"
                  secondary
                  label={s.common.home}
                  onPress={p.onHome}
                />
              </>
            )}
            {(p.error || imageError) && (
              <Text accessibilityRole="alert" style={ui.error}>
                {p.error === 'save'
                  ? m.saveFailed
                  : p.error === 'permission'
                    ? m.permission
                    : m.imageError}
              </Text>
            )}
          </ScrollView>
        </View>
        {d.step !== 'complete' && (
          <View style={styles.footer}>
            {d.step === 'details' && (
              <AppButton
                variant="meal"
                label={m.toPhoto}
                disabled={!d.mealType || !d.setting}
                onPress={() => p.onGo('photo')}
              />
            )}
            {d.step === 'preview' && (
              <AppButton
                variant="meal"
                label={m.usePhoto}
                disabled={!d.photo || imageError || p.picking}
                onPress={() => p.onGo('method')}
              />
            )}
            {d.step === 'foods' && (
              <AppButton
                variant="meal"
                label={m.confirmFoods}
                disabled={!d.foods.length || p.saving}
                onPress={p.onConfirm}
              />
            )}
            <Text accessibilityLiveRegion="polite" style={ui.muted}>
              {p.saveStatus === 'saving'
                ? s.common.saving
                : p.saveStatus === 'error'
                  ? s.common.saveFailed
                  : s.common.saved}
            </Text>
            {p.saveStatus === 'error' && (
              <AppButton
                label={s.common.retry}
                secondary
                onPress={p.onRetryDraft}
              />
            )}
          </View>
        )}
        {d.editingFood && (
          <FoodEditor
            key={d.editingFood.id}
            food={d.editingFood}
            language={p.language}
            traits={p.traits}
            onChange={p.onChangeFood}
            onSave={p.onSaveFood}
            onCancel={() => p.onUpdate({ editingFood: null })}
            onEditTraits={() => p.onTraits(d.editingFood!.traits)}
            onTraits={p.onTraits}
            onSaveTraits={p.onSaveTraits}
            onCancelTraits={() => p.onTraits(null)}
          />
        )}
        {d.step === 'goal' && (
          <MealSheet
            title={p.sheet === 'help' ? m.tracker : m.titles.goal}
            closeLabel={s.common.back}
            onClose={() => {
              if (!p.saving) {
                if (p.sheet) p.onSheet(null);
                else p.onGo('foods');
              }
            }}
          >
            {p.sheet === 'help' ? (
              help
            ) : (
              <View pointerEvents={p.saving ? 'none' : 'auto'} style={ui.stack}>
                <View style={ui.row}>
                  <Text style={[ui.text, { flex: 1 }]}>{m.goalOptional}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={m.tracker}
                    onPress={() => p.onSheet('help')}
                    style={ui.close}
                  >
                    <Text style={ui.link}>?</Text>
                  </Pressable>
                </View>
                {d.foods.map((food) => (
                  <MealChoice
                    key={food.id}
                    label={food.name}
                    selected={d.exposureFoodId === food.id}
                    onPress={() => p.onUpdate({ exposureFoodId: food.id })}
                  />
                ))}
                {p.error === 'save' && (
                  <Text accessibilityRole="alert" style={ui.error}>
                    {m.saveFailed}
                  </Text>
                )}
                <AppButton
                  variant="meal"
                  label={p.saving ? s.common.saving : m.selectGoal}
                  disabled={!d.exposureFoodId || p.saving}
                  onPress={() => p.onSave(false)}
                />
                <AppButton
                  variant="meal"
                  secondary
                  label={m.skipGoal}
                  disabled={p.saving}
                  onPress={() => p.onSave(true)}
                />
              </View>
            )}
          </MealSheet>
        )}
        {p.sheet === 'privacy' && (
          <MealSheet
            title={m.privacy}
            closeLabel={s.common.close}
            onClose={() => p.onSheet(null)}
          >
            <Text style={ui.text}>{m.privacyBody}</Text>
          </MealSheet>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.homeBackground },
  reviewRoot: { backgroundColor: colors.mealReviewBackground },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  progress: { flexDirection: 'row', gap: 6, marginHorizontal: 24 },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.homeBorder,
  },
  activeSegment: { backgroundColor: colors.homePrimary },
  content: { paddingHorizontal: 24, paddingVertical: 14, gap: 10, flexGrow: 1 },
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16, gap: 10 },
  photo: {
    height: 300,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.homeBorder,
  },
  hero: {
    backgroundColor: colors.navy,
    padding: 18,
    borderRadius: 20,
    gap: 10,
  },
  heroTitle: {
    ...ui.title,
    fontSize: 20,
    lineHeight: 26,
    color: colors.homeBorder,
  },
  heroText: { ...ui.text, color: colors.surface },
  example: { width: 112, height: 112, borderRadius: 18 },
});
