// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
import { AppHeader, topBarStyles } from '../../../components/AppHeader';
import { useState } from "react";
import { Image } from "expo-image";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../../components/AppButton";
import { UiAssetIcon } from "../../../components/UiAssetIcon";
import { displayDate } from "../../../util/date";
import { colors } from "../../../util/colors";
import { fonts } from "../../../util/fonts";
import { abcCopyFor, copyFor } from "../../../util/strings";
import type { FoodItem } from "../../../types/meal";
import type { MealCheckinViewProps } from "./mealCheckinViewTypes";

type Props = Pick<
  MealCheckinViewProps,
  | "draft"
  | "childName"
  | "language"
  | "onEdit"
  | "onRemove"
  | "onGo"
  | "onFullPhoto"
  | "onConfirmFood"
  | "removedName"
  | "onUndoRemove"
  | "suggestions"
  | "suggestionLinking"
  | "suggestionsLoading"
  | "suggestionsError"
  | "onRetrySuggestions"
>;

export function MealFoodsStepView({ p }: { p: Props }) {
  const [expanded, setExpanded] = useState<string | null>(p.draft.foods[0]?.id ?? null);
  // AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
  const { step: linkStep, selectedSuggestion: suggestion, selectedFoodId: targetId } = p.suggestionLinking;
  const s = copyFor(p.language);
  const m = s.mealCheckin;
  const a = abcCopyFor(p.language);
  const d = p.draft;
  const emptyManual = !d.photo && !d.foods.length && !p.removedName;
  const sourceMeal = (item: Props['suggestions'][number]) => item.mealDate
    ? `${displayDate(item.mealDate, p.language, true)}${item.mealType && item.mealType in m.types ? ` · ${m.types[item.mealType as keyof typeof m.types]}` : ''}` : null;
  const openFood = (food: FoodItem) => {
    setExpanded(expanded === food.id ? null : food.id);
  };
  const card = (food: FoodItem, selecting = false) => {
    const open = selecting ? targetId === food.id : expanded === food.id;
    return (
      <View
        key={food.id}
        style={[
          styles.foodCard,
          selecting && targetId === food.id && styles.selectedCard,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            expanded: open,
            selected: selecting && targetId === food.id,
          }}
          onPress={() => (selecting ? p.suggestionLinking.onSelectFood(food.id) : openFood(food))}
          style={styles.foodHeading}
        >
          <View
            style={!open ? { transform: [{ rotate: "-90deg" }] } : undefined}
          >
            <UiAssetIcon name="abc-chevron" />
          </View>
          <Text style={styles.foodName}>{food.name}</Text>
          {selecting ? (
            <View style={[styles.linkRadio, targetId === food.id && styles.linkRadioSelected]}>{targetId === food.id && <View style={styles.linkRadioDot} />}</View>
          ) : null}
        </Pressable>
        {open && (
          <View style={styles.foodBody}>
            <Text style={styles.sectionLabel}>{m.ingredients}</Text>
            <View style={styles.tags}>
              {food.ingredients.map((ingredient) => (
                <Text
                  key={ingredient}
                  style={[
                    styles.ingredientTag,
                    styles.confirmedTag,
                  ]}
                >
                  {ingredient}
                </Text>
              ))}
            </View>
            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <Text style={styles.sectionLabel}>{a.cooking}</Text>
                <Text style={styles.fieldValue}>
                  {food.preparation || s.common.notEntered}
                </Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.sectionLabel}>{a.detail}</Text>
                <Text style={styles.fieldValue}>
                  {food.servingNote || s.common.notEntered}
                </Text>
              </View>
            </View>
            <View style={styles.acceptanceRow}>
              <Text style={styles.sectionLabel}>{a.acceptance}</Text>
              {food.acceptance == null ? (
                <Text style={styles.sectionLabel}>{s.common.notEntered}</Text>
              ) : (
                <View style={styles.acceptanceTrack}>
                  <View style={[styles.acceptanceFill, { width: `${(food.acceptance / 3) * 100}%` }]} />
                </View>
              )}
            </View>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => p.onRemove(food.id)}
                style={styles.action}
              >
                <UiAssetIcon name="abc-trash" />
                <Text style={styles.removeText}>{s.common.remove}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => p.onEdit(food)}
                style={styles.action}
              >
                <UiAssetIcon name="abc-edit" />
                <Text style={styles.link}>{s.common.edit}</Text>
              </Pressable>
            </View>
          </View>
        )}
        {(d.suggestionLinks ?? [])
          .filter((item) => item.foodId === food.id)
          .map((item) => (
            <Pressable
              key={item.suggestionId}
              accessibilityRole="button"
              accessibilityLabel={`${s.common.remove}: ${item.title}`}
              onPress={() => p.suggestionLinking.onUnlink(item.suggestionId)}
            >
              <Text style={styles.linked}>
                {item.title} · {a.linked} ×
              </Text>
            </Pressable>
          ))}
      </View>
    );
  };
  if (emptyManual) return <View style={styles.emptyManual}>
    <Text style={styles.emptyManualIntro}>{m.addFoodPrompt}</Text>
    <AppButton variant="meal" secondary label={m.addFood} icon={<UiAssetIcon name="meal-plus" />} style={styles.emptyAddButton} labelStyle={styles.emptyAddLabel} onPress={() => p.onEdit()} />
  </View>;
  return (
    <>
      <Text style={[styles.muted, { fontSize: 14, lineHeight: 20 } ]}>
        {p.childName} · {displayDate(d.mealDate, p.language)} · {d.mealType ? m.types[d.mealType] : ""}
        {d.setting ? ` · ${m.settings[d.setting]}` : ""}
      </Text>
      <View style={[styles.photoCard, !d.photo && styles.missingPhotoCard]}>
        {d.photo ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={m.fullPhoto}
            onPress={p.onFullPhoto}
            style={styles.photoOpen}
          >
            <Image
              source={{ uri: d.photo.uri }}
              style={styles.photoThumbnail}
              contentFit="cover"
            />
            <Text style={styles.photoTitle}>{m.beforePhoto}</Text>
          </Pressable>
        ) : (
          <Text style={[styles.photoTitle, { flex: 1, minWidth: 0 }]}>{a.missingPhoto}</Text>
        )}
        {!d.photo && <Pressable
          accessibilityRole="button"
          onPress={() => p.onGo("photo")}
          style={styles.addPhotoButton}
        >
          <Text style={styles.addPhotoLabel}>{s.common.add}</Text>
        </Pressable>}
      </View>
      <View style={styles.addRow}>
        <AppButton
          variant="meal"
          compact
          style={styles.addFoodButton}
          labelStyle={styles.addFoodLabel}
          icon={<UiAssetIcon name="abc-add-food" />}
          label={a.addFoodLabel}
          onPress={() => p.onEdit()}
        />
      </View>
      {p.removedName && (
        <View style={styles.removed}>
          <Text style={styles.removedText}>{a.removed(p.removedName)}</Text>
          <Pressable accessibilityRole="button" onPress={p.onUndoRemove}>
            <Text style={styles.undoText}>{a.undo}</Text>
          </Pressable>
        </View>
      )}
      {!d.foods.length && (
        <Text style={styles.emptyFoodText}>{m.emptyFoodBody}</Text>
      )}
      <View style={[styles.foodList, !d.foods.length && { flex: 1 }]}>{d.foods.map((food) => card(food))}</View>
      <Pressable
        accessibilityRole="button"
        onPress={p.suggestionLinking.onOpen}
        style={[styles.suggestionEntry, !!p.removedName && { marginTop: "auto", paddingTop: 20 }]}
      >
        <Text style={styles.suggestionTitle}>{a.previousSuggestion}</Text>
        <UiAssetIcon name="abc-open" />
      </Pressable>
      {!p.removedName && <Text style={[styles.muted, { fontSize: 13, opacity: 0.44, marginTop: "auto", paddingTop: 32, textAlign: 'center' }]}>{m.reviewAiReminder}</Text>}
      <Modal
        visible={linkStep !== 0}
        animationType="slide"
        onRequestClose={p.suggestionLinking.onBack}
      >
        <SafeAreaView style={styles.modal}>
          <AppHeader title={linkStep === 1 ? a.previousSuggestion : a.selectFood} backLabel={s.common.back} onBack={p.suggestionLinking.onBack} />
          <View style={topBarStyles.details}>
            <Text style={[styles.muted, { fontSize: linkStep === 1 ? 14 : 10 }]}>{p.childName} · {displayDate(d.mealDate, p.language)} · {d.mealType ? m.types[d.mealType] : ""} · {d.setting ? m.settings[d.setting] : ""}</Text>
            <View style={styles.linkProgress}>{[0,1,2,3,4].map(i => <View key={i} style={[styles.linkSegment, i < 4 && { backgroundColor: colors.homePrimary }]} />)}</View>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            {linkStep === 1 && <Text style={[styles.muted, { fontSize: 11 }]}>{a.chooseSuggestion}</Text>}
            <View style={styles.linkBadges}><Text style={styles.linkBadge}>{a.linkStep(linkStep)}</Text><Text style={[styles.linkBadge, { color: colors.mealReviewMuted }]}>{linkStep === 1 ? a.savedEarlier : m.optional}</Text></View>
            {linkStep === 1 &&
              (p.suggestionsLoading ? (
                <Text style={styles.muted}>{s.common.loading}</Text>
              ) : p.suggestionsError ? (
                <>
                  <Text style={styles.removeText}>{a.suggestionsFailed}</Text>
                  <AppButton
                    label={s.common.retry}
                    onPress={p.onRetrySuggestions}
                  />
                </>
              ) : p.suggestions.length ? (
                p.suggestions.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: item.id === suggestion?.id }}
                    onPress={() => p.suggestionLinking.onSelectSuggestion(item.id)}
                    style={[
                      styles.foodCard, styles.suggestionCard,
                      item.id === suggestion?.id && styles.selectedCard,
                    ]}
                  >
                    <View style={styles.linkCardHeading}><Text style={styles.suggestionName}>{item.title}</Text><View style={[styles.linkRadio, item.id === suggestion?.id && styles.linkRadioSelected]}>{item.id === suggestion?.id && <View style={styles.linkRadioDot} />}</View></View>
                    <Text style={styles.suggestionBody}>{item.description}</Text>
                    {item.ingredientName && <Text style={styles.suggestionDate}>{item.ingredientName}</Text>}
                    {sourceMeal(item) && <Text style={styles.suggestionDate}>{sourceMeal(item)}</Text>}
                  </Pressable>
                ))
              ) : (
                <Text style={styles.muted}>{a.noSuggestions}</Text>
              ))}
            {linkStep === 2 && (
              <>
                <Text style={styles.linkSection}>{a.selectedSuggestion}</Text>
                <View style={[styles.foodCard, styles.suggestionCard]}>
                  <Text style={styles.suggestionName}>{suggestion?.title}</Text>
                  <Text style={styles.suggestionBody}>
                    {suggestion?.description}
                  </Text>
                  {suggestion?.ingredientName && <Text style={styles.suggestionDate}>{suggestion.ingredientName}</Text>}
                  {suggestion && sourceMeal(suggestion) && <Text style={styles.suggestionDate}>{sourceMeal(suggestion)}</Text>}
                </View>
                <Text style={styles.linkSection}>{a.foodList}</Text>
                <Text style={[styles.muted, { fontSize: 11 }]}>{a.selectMealFood}</Text>
                {d.foods.map((food) => card(food, true))}
              </>
            )}
          </ScrollView>
          <View style={styles.modalFooter}>
            {linkStep === 1 && <View style={styles.linkHint}><Text style={styles.linkHintText}>{a.linkHint}</Text></View>}
            <AppButton
              variant="meal"
              label={linkStep === 1 ? s.common.continue : a.link}
              labelStyle={{ fontSize: 16 }}
              disabled={!p.suggestionLinking.canContinue}
              onPress={p.suggestionLinking.onContinue}
            />
            <AppButton
              secondary
              label={linkStep === 1 ? m.cancel : s.common.back}
              labelStyle={{ fontSize: 16, color: colors.homePrimary }}
              style={{ backgroundColor: colors.transparent, borderWidth: 0, minHeight: 48 }}
              onPress={p.suggestionLinking.onBack}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  suggestionCard: { padding: 15, borderRadius: 18, gap: 8 },
  suggestionDate: { color: colors.mealReviewMuted, fontSize: 13, fontFamily: fonts.poppinsMedium },
  linkProgress: { flexDirection: 'row', gap: 6 },
  linkSegment: { flex: 1, height: 4, borderRadius: 999, backgroundColor: colors.mealReviewBorder },
  linkBadges: { flexDirection: 'row', gap: 6 },
  linkBadge: { backgroundColor: colors.homeSelected, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, color: colors.homeText, fontSize: 9, fontFamily: fonts.poppinsRegular },
  linkSection: { color: colors.homeText, fontSize: 13, fontFamily: fonts.poppinsSemiBold, marginTop: 3 },
  linkCardHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  suggestionName: { flex: 1, color: colors.homeText, fontSize: 16, fontFamily: fonts.poppinsSemiBold, lineHeight: 24 },
  suggestionBody: { color: colors.homeText, fontSize: 14, fontFamily: fonts.poppinsRegular, lineHeight: 20 },
  linkRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: colors.mealReviewBorder, alignItems: 'center', justifyContent: 'center' },
  linkRadioSelected: { borderWidth: 2, borderColor: colors.homePrimary },
  linkRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.homePrimary },
  linkHint: { backgroundColor: colors.calendarEmpty, padding: 10, marginHorizontal: -24 },
  linkHintText: { color: colors.homeText, fontSize: 10, lineHeight: 15, fontFamily: fonts.poppinsRegular },
  emptyManual: { gap: 12 },
  emptyManualIntro: { color: colors.homeText, fontFamily: fonts.poppinsSemiBold, fontSize: 12, lineHeight: 18 },
  emptyAddButton: { minHeight: 46, height: 46 },
  emptyAddLabel: { fontSize: 13 },
  emptyFoodText: { color: colors.homeText, fontFamily: fonts.poppinsMedium, fontSize: 12, lineHeight: 18 },
  foodList: { gap: 12 },
  modal: { flex: 1, backgroundColor: colors.mealReviewBackground },
  modalContent: { paddingHorizontal: 24, paddingTop: 0, paddingBottom: 12, gap: 12 },
  modalFooter: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8, gap: 8 },
  photoCard: {
    minHeight: 54,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.homeBorder,
    borderRadius: 14,
    padding: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  missingPhotoCard: { minHeight: 57, paddingHorizontal: 10, paddingVertical: 13, gap: 10 },
  addPhotoButton: { width: 64, height: 29, flexShrink: 0, borderRadius: 10, backgroundColor: colors.onboardingPrimary, alignItems: 'center', justifyContent: 'center' },
  addPhotoLabel: { color: colors.surface, fontFamily: fonts.poppinsSemiBold, fontSize: 13 },
  removedText: { flex: 1, color: colors.surface, fontFamily: fonts.poppinsMedium, fontSize: 12, lineHeight: 17.4 },
  undoText: { color: colors.homePrimary, fontFamily: fonts.poppinsSemiBold, fontSize: 11 },
  photoOpen: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  photoThumbnail: { width: 50, height: 46, borderRadius: 8 },
  photoTitle: {
    color: colors.homeText,
    fontSize: 13,
    fontFamily: fonts.poppinsSemiBold,
  },
  legend: { flexDirection: "row", gap: 6 },
  aiBadge: {
    color: colors.suggestionText,
    backgroundColor: colors.suggestionSurface,
    borderRadius: 999,
    padding: 6,
    fontSize: 11,
  },
  parentBadge: {
    color: colors.success,
    backgroundColor: colors.successSurface,
    borderRadius: 999,
    padding: 6,
    fontSize: 11,
  },
  addFoodButton: { backgroundColor: colors.foodAddBackground, borderRadius: 10, minHeight: 32 },
  addFoodLabel: { color: colors.surface, fontSize: 13 },
  addRow: { alignItems: "flex-end" },
  foodCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.homeBorder,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  selectedCard: {
    borderColor: colors.homePrimary,
    backgroundColor: colors.homeSelected,
  },
  foodHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minHeight: 24,
  },
  foodName: {
    flex: 1,
    color: colors.homeText,
    fontSize: 14,
    fontFamily: fonts.poppinsSemiBold,
  },
  chevron: { color: colors.homeMuted, fontSize: 20 },
  foodBody: { gap: 10 },
  source: { color: colors.suggestionText, fontSize: 11 },
  confirmedText: { color: colors.success },
  sectionLabel: {
    color: colors.homeMuted,
    fontSize: 11,
    fontFamily: fonts.poppinsSemiBold,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  ingredientTag: {
    color: colors.homeText,
    backgroundColor: colors.suggestionSurface,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 13,
    fontFamily: fonts.poppinsMedium,
  },
  confirmedTag: { backgroundColor: colors.foodIngredientBackground },
  twoColumns: { flexDirection: "row", gap: 10 },
  column: { flex: 1, gap: 3 },
  fieldValue: {
    color: colors.homeText,
    fontSize: 13,
    fontFamily: fonts.interRegular,
  },
  acceptanceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  acceptanceTrack: {
    height: 8,
    flex: 1,
    backgroundColor: colors.homeSelected,
    borderRadius: 999,
    overflow: "hidden",
  },
  acceptanceFill: { height: 8, backgroundColor: colors.homePrimary },
  actions: { flexDirection: "row", gap: 16 },
  action: {
    flex: 1,
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  link: {
    color: colors.homePrimary,
    fontSize: 13,
    fontFamily: fonts.interMedium,
  },
  removeText: { color: colors.error, fontSize: 13 },
  muted: {
    color: colors.homeMuted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.poppinsRegular,
  },
  linked: { color: colors.success, fontSize: 11 },
  removed: { minHeight: 41, padding: 12, backgroundColor: colors.navy, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  suggestionEntry: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    marginTop: 20,
  },
  suggestionTitle: {
    color: colors.homeText,
    fontSize: 14,
    textDecorationLine: "underline",
    fontFamily: fonts.poppinsSemiBold,
  },
});
