// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
// Changed: 클라이언트 모델, DTO, DB Schema 통합 및 일관화
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Align the previous-suggestion action above the bottom save buttons
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 추천 카드의 재료 이름 표시 제거
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: 추천 모달 안전 여백 및 음식이 있을 때만 추천 연결 표시
// AI-generated with Grok 4.6, 2026-11-13, reviewed by Doyeon Kim
// Changed: 식전 사진 배치·높이 및 음식별 저장 추천 연결

import { useState } from "react";
import { Image } from "expo-image";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  | "onFullPhoto"
  | "removedName"
  | "onUndoRemove"
  | "suggestionLinking"
>;

export function MealFoodsStepView({ p }: { p: Props }) {
  const [expanded, setExpanded] = useState<string | null>(p.draft.foods[0]?.id ?? null);
  const s = copyFor(p.language);
  const m = s.mealCheckin;
  const a = abcCopyFor(p.language);
  const d = p.draft;
  const openFood = (food: FoodItem) => {
    setExpanded(expanded === food.id ? null : food.id);
  };
  const linkedChip = (food: FoodItem) => (d.suggestionLinks ?? [])
    .filter((item) => item.foodId === food.id)
    .map((item) => (
      <View key={item.suggestionId} style={styles.linkedBlock}>
        <Text style={styles.sectionLabel}>{m.linkedSuggestion}</Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{item.title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${s.common.remove}: ${item.title}`}
            onPress={() => p.suggestionLinking?.onUnlink(item.suggestionId)}
            style={styles.chipRemove}
          >
            <Text accessible={false} style={styles.chipRemoveText}>×</Text>
          </Pressable>
        </View>
      </View>
    ));
  const card = (food: FoodItem) => {
    const open = expanded === food.id;
    return (
      <View key={food.id} style={styles.foodCard}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => openFood(food)}
          style={styles.foodHeading}
        >
          <View
            style={!open ? { transform: [{ rotate: "-90deg" }] } : undefined}
          >
            <UiAssetIcon name="abc-chevron" />
          </View>
          <Text style={styles.foodName}>{food.name}</Text>
        </Pressable>
        {!open && linkedChip(food)}
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
            {linkedChip(food)}
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
      </View>
    );
  };
  return (
    <>
      <Text style={[styles.muted, { fontSize: 14, lineHeight: 20 } ]}>
        {p.childName} · {displayDate(d.mealDate, p.language)} · {d.mealType ? m.types[d.mealType] : ""}
        {d.setting ? ` · ${m.settings[d.setting]}` : ""}
      </Text>
      {d.photo ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={m.fullPhoto}
          onPress={p.onFullPhoto}
          style={styles.hero}
        >
          <Image
            source={{ uri: d.photo.uri }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{m.beforeMealBadge}</Text>
          </View>
        </Pressable>
      ) : null}
      <View style={styles.listHeader}>
        <Text style={styles.foodCount}>{m.foodCount(d.foods.length)}</Text>
        <AppButton
          variant="meal"
          compact
          accessibilityLabel={m.addFood}
          style={styles.addFoodButton}
          labelStyle={styles.addFoodLabel}
          label={`+ ${s.common.add}`}
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
    </>
  );
}
const styles = StyleSheet.create({
  emptyFoodText: { color: colors.homeText, fontFamily: fonts.poppinsMedium, fontSize: 12, lineHeight: 18 },
  foodList: { gap: 12 },
  hero: { height: 90, borderRadius: 14, overflow: "hidden" },
  heroImage: { width: "100%", height: "100%" },
  heroBadge: {
    position: "absolute",
    left: 10,
    bottom: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  heroBadgeText: { color: colors.homeText, fontSize: 11, fontFamily: fonts.poppinsMedium },
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  foodCount: { color: colors.homeText, fontSize: 14, fontFamily: fonts.poppinsSemiBold },
  addFoodButton: { backgroundColor: colors.homePrimary, borderRadius: 10, minHeight: 32, height: 32, paddingHorizontal: 12 },
  addFoodLabel: { color: colors.surface, fontSize: 13 },
  foodCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.homeBorder,
    borderRadius: 14,
    padding: 12,
    gap: 10,
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
  foodBody: { gap: 10 },
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
  linkedBlock: { gap: 6 },
  chip: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.homeSelected,
    borderRadius: 999,
    paddingLeft: 10,
    paddingRight: 2,
    minHeight: 30,
  },
  chipText: { flexShrink: 1, color: colors.homePrimary, fontSize: 12, fontFamily: fonts.poppinsMedium },
  chipRemove: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  chipRemoveText: { color: colors.homePrimary, fontSize: 18, lineHeight: 20, fontFamily: fonts.poppinsMedium },
  removed: { minHeight: 41, padding: 12, backgroundColor: colors.navy, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  removedText: { flex: 1, color: colors.surface, fontFamily: fonts.poppinsMedium, fontSize: 12, lineHeight: 17.4 },
  undoText: { color: colors.homePrimary, fontFamily: fonts.poppinsSemiBold, fontSize: 11 },
});
