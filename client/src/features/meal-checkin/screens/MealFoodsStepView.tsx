// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; removed photo analysis flow
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung

import { useEffect, useRef, useState } from "react";
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
import { colors } from "../../../util/colors";
import { fonts } from "../../../util/fonts";
import { abcCopyFor, copyFor } from "../../../util/strings";
import type { FoodItem } from "../../../types/meal";
import type { MealCheckinViewProps } from "./mealCheckinViewTypes";

type Props = Pick<
  MealCheckinViewProps,
  | "draft"
  | "initialSuggestionId"
  | "childName"
  | "language"
  | "onEdit"
  | "onRemove"
  | "onGo"
  | "onFullPhoto"
  | "onUpdate"
  | "onConfirmFood"
  | "removedName"
  | "onUndoRemove"
  | "suggestions"
  | "suggestionsLoading"
  | "suggestionsError"
  | "onRetrySuggestions"
>;

export function MealFoodsStepView({ p }: { p: Props }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [linkStep, setLinkStep] = useState<0 | 1 | 2>(
    p.initialSuggestionId ? 1 : 0,
  );
  const [suggestionId, setSuggestionId] = useState(p.initialSuggestionId ?? "");
  const resumeLink = useRef(false);
  useEffect(() => {
    if (!p.draft.editingFood && resumeLink.current) {
      resumeLink.current = false;
      setLinkStep(2);
    }
  }, [p.draft.editingFood]);
  const [targetId, setTargetId] = useState("");
  const s = copyFor(p.language);
  const m = s.mealCheckin;
  const a = abcCopyFor(p.language);
  const d = p.draft;
  const suggestion = p.suggestions.find((item) => item.id === suggestionId);
  const openFood = (food: FoodItem) => {
    setExpanded(expanded === food.id ? null : food.id);
  };
  const editFood = (food: FoodItem) => {
    if (linkStep === 2) {
      resumeLink.current = true;
      setLinkStep(0);
    }
    p.onEdit(food);
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
          onPress={() => (selecting ? setTargetId(food.id) : openFood(food))}
          style={styles.foodHeading}
        >
          <View
            style={!open ? { transform: [{ rotate: "-90deg" }] } : undefined}
          >
            <UiAssetIcon name="abc-chevron" />
          </View>
          <Text style={styles.foodName}>{food.name}</Text>
          {selecting ? (
            <Text style={styles.link}>{targetId === food.id ? "◉" : "○"}</Text>
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
              <View style={styles.acceptanceTrack}>
                {food.acceptance != null && (
                  <View
                    style={[
                      styles.acceptanceFill,
                      { width: `${(food.acceptance / 3) * 100}%` },
                    ]}
                  />
                )}
              </View>
              {food.acceptance == null && (
                <Text style={styles.sectionLabel}>{s.common.notEntered}</Text>
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
                onPress={() => editFood(food)}
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
              onPress={() =>
                p.onUpdate({
                  suggestionLinks: d.suggestionLinks?.filter(
                    (link) => link.suggestionId !== item.suggestionId,
                  ),
                })
              }
            >
              <Text style={styles.linked}>
                {item.title} · {a.linked} ×
              </Text>
            </Pressable>
          ))}
      </View>
    );
  };
  return (
    <>
      <Text style={styles.muted}>
        {p.childName} · {d.mealDate} · {d.mealType ? m.types[d.mealType] : ""}
        {d.setting ? ` · ${m.settings[d.setting]}` : ""}
      </Text>
      <View style={styles.photoCard}>
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
          <Text style={styles.photoTitle}>{a.missingPhoto}</Text>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => p.onGo(d.photo ? "preview" : "photo")}
        >
          <Text style={styles.link}>
            {d.photo ? s.common.edit : s.common.add}
          </Text>
        </Pressable>
      </View>
      <View style={styles.addRow}>
        <AppButton
          variant="meal"
          compact
          secondary
          icon={<UiAssetIcon name="meal-plus" />}
          label={m.addFood}
          onPress={() => p.onEdit()}
        />
      </View>
      {p.removedName && (
        <View style={styles.removed}>
          <Text style={styles.muted}>{a.removed(p.removedName)}</Text>
          <Pressable accessibilityRole="button" onPress={p.onUndoRemove}>
            <Text style={styles.link}>{a.undo}</Text>
          </Pressable>
        </View>
      )}
      {!d.foods.length && (
        <View style={styles.foodCard}>
          <Text style={styles.foodName}>{m.emptyFoodTitle}</Text>
          <Text style={styles.muted}>{m.emptyFoodBody}</Text>
        </View>
      )}
      {d.foods.map((food) => card(food))}
      <Pressable
        accessibilityRole="button"
        onPress={() => setLinkStep(1)}
        style={styles.suggestionEntry}
      >
        <Text style={styles.suggestionTitle}>{a.previousSuggestion}</Text>
        <UiAssetIcon name="abc-open" />
      </Pressable>
      <Text style={styles.muted}>{m.reviewAiReminder}</Text>
      <Modal
        visible={linkStep !== 0}
        animationType="slide"
        onRequestClose={() => setLinkStep(linkStep === 2 ? 1 : 0)}
      >
        <SafeAreaView style={styles.modal}>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalTitle}>
              {linkStep === 1 ? a.previousSuggestion : a.selectFood}
            </Text>
            <Text style={styles.muted}>
              {p.childName} · {d.mealDate} ·{" "}
              {d.mealType ? m.types[d.mealType] : ""}
            </Text>
            <Text style={styles.muted}>{a.chooseSuggestion}</Text>
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
                    accessibilityState={{ checked: item.id === suggestionId }}
                    onPress={() => {
                      setSuggestionId(item.id);
                      setTargetId("");
                    }}
                    style={[
                      styles.foodCard,
                      item.id === suggestionId && styles.selectedCard,
                    ]}
                  >
                    <Text style={styles.foodName}>{item.title}</Text>
                    <Text style={styles.fieldValue}>{item.description}</Text>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.muted}>{a.noSuggestions}</Text>
              ))}
            {linkStep === 2 && (
              <>
                <View style={styles.foodCard}>
                  <Text style={styles.foodName}>{suggestion?.title}</Text>
                  <Text style={styles.fieldValue}>
                    {suggestion?.description}
                  </Text>
                </View>
                {d.foods.map((food) => card(food, true))}
              </>
            )}
          </ScrollView>
          <View style={styles.modalFooter}>
            <Text style={styles.muted}>{a.linkHint}</Text>
            <AppButton
              variant="meal"
              label={linkStep === 1 ? s.common.continue : a.link}
              disabled={
                !suggestion ||
                (linkStep === 2 &&
                  !d.foods.some((food) => food.id === targetId))
              }
              onPress={() => {
                if (linkStep === 1) setLinkStep(2);
                else if (suggestion) {
                  p.onUpdate({
                    suggestionLinks: [
                      ...(d.suggestionLinks ?? []).filter(
                        (item) => item.suggestionId !== suggestion.id,
                      ),
                      {
                        suggestionId: suggestion.id,
                        foodId: targetId,
                        title: suggestion.title,
                        description: suggestion.description,
                        servingTip: suggestion.servingTip,
                      },
                    ],
                  });
                  setLinkStep(0);
                }
              }}
            />
            <AppButton
              secondary
              label={linkStep === 1 ? m.cancel : s.common.back}
              onPress={() => setLinkStep(linkStep === 1 ? 0 : 1)}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: colors.homeBackground },
  modalContent: { padding: 24, gap: 14 },
  modalFooter: { padding: 24, gap: 12 },
  modalTitle: {
    fontSize: 18,
    color: colors.homeText,
    fontFamily: fonts.poppinsSemiBold,
  },
  photoCard: {
    minHeight: 54,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.homeBorder,
    borderRadius: 14,
    padding: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  photoOpen: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  photoThumbnail: { width: 50, height: 44, borderRadius: 9 },
  photoTitle: {
    color: colors.homeText,
    fontSize: 12,
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
    fontSize: 12,
  },
  confirmedTag: { backgroundColor: colors.homeBackground },
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
  removed: {
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  suggestionEntry: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    marginTop: 14,
  },
  suggestionTitle: {
    color: colors.homeText,
    fontSize: 13,
    textDecorationLine: "underline",
    fontFamily: fonts.poppinsSemiBold,
  },
});
