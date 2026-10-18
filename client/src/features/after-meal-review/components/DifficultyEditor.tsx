// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung

import { UiAssetIcon } from "../../../components/UiAssetIcon";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type {
  DifficultyCategory,
  DifficultyTag,
} from "../../../types/afterMealReview";
import { difficultyColorDots, colors } from "../../../util/colors";
import { fonts } from "../../../util/fonts";

type Labels = {
  categoryPlaceholder: string;
  valuePlaceholder: string;
  note: string;
  add: string;
  remove: string;
  categories: Partial<Record<DifficultyCategory, string>>;
  values: Record<string, string>;
  questions: Record<string, string>;
  textureQuestion: string;
  textureCause: string;
  textureTrait: string;
  examples: Record<string, string>;
  close: string;
};
export function DifficultyEditor({
  foodName,
  category,
  value,
  note,
  subcategory,
  tags,
  options,
  labels,
  canAdd,
  showNote,
  onCategory,
  onSubcategory,
  onValue,
  onNote,
  onAdd,
  onRemove,
}: {
  foodName: string;
  category: DifficultyCategory | null;
  value: string;
  note: string;
  subcategory?: string;
  tags: DifficultyTag[];
  options: readonly string[];
  labels: Labels;
  canAdd: boolean;
  showNote: boolean;
  onCategory: (category: DifficultyCategory) => void;
  onSubcategory: (value: string) => void;
  onValue: (value: string) => void;
  onNote: (value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const [menu, setMenu] = useState<"category" | "value" | "question" | null>(
    null,
  );
  const isTexture = category === "texture";
  const menuOptions =
    menu === "category"
      ? Object.keys(labels.categories)
      : menu === "question"
        ? Object.keys(labels.questions)
        : options;
  const textFor = (item: string) =>
    menu === "category"
      ? labels.categories[item as DifficultyCategory]
      : menu === "question"
        ? labels.questions[item]
        : (labels.values[item] ?? item);
  const valueSelect = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={labels.valuePlaceholder}
      accessibilityState={{
        expanded: menu === "value",
        disabled: !category || (isTexture && !subcategory),
      }}
      disabled={!category || (isTexture && !subcategory)}
      onPress={() => setMenu("value")}
      style={[styles.select, !isTexture && styles.valueSelect]}
    >
      <Text style={styles.selectText}>
        {value ? (labels.values[value] ?? value) : labels.valuePlaceholder}
      </Text>
      <UiAssetIcon name="abc-select" />
    </Pressable>
  );
  return (
    <View style={styles.root}>
      <Text style={styles.foodName}>{foodName}</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: menu === "category" }}
          onPress={() => setMenu("category")}
          style={[styles.select, styles.categorySelect]}
        >
          <Text style={styles.selectText}>
            {category
              ? (labels.categories[category] ?? category)
              : labels.categoryPlaceholder}
          </Text>
          <UiAssetIcon name="abc-select" />
        </Pressable>
        {!isTexture && valueSelect}
        {isTexture && <View style={styles.spacer} />}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canAdd }}
          disabled={!canAdd}
          onPress={onAdd}
          style={[styles.addButton, !canAdd && styles.disabled]}
        >
          <Text style={styles.addText}>{labels.add}</Text>
        </Pressable>
      </View>
      {isTexture && (
        <View style={styles.sentence}>
          <View style={styles.sentenceRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: menu === "question" }}
              onPress={() => setMenu("question")}
              style={styles.select}
            >
              <Text style={styles.selectText}>
                {subcategory
                  ? (labels.questions[subcategory] ?? subcategory)
                  : labels.textureQuestion}
              </Text>
              <UiAssetIcon name="abc-select" />
            </Pressable>
            <Text style={styles.sentenceText}>{labels.textureCause}</Text>
          </View>
          <View style={styles.sentenceRow}>
            {valueSelect}
            <Text style={styles.sentenceText}>{labels.textureTrait}</Text>
          </View>
        </View>
      )}
      {showNote && (
        <TextInput
          accessibilityLabel={labels.note}
          placeholder={labels.note}
          placeholderTextColor={colors.mealReviewMuted}
          value={note}
          onChangeText={onNote}
          multiline
          style={styles.note}
        />
      )}
      {!!tags.length && (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <Pressable
              key={tag.id}
              accessibilityRole="button"
              accessibilityLabel={`${labels.remove}: ${labels.values[tag.value] ?? tag.value}`}
              onPress={() => onRemove(tag.id)}
              style={styles.tag}
            >
              {tag.category === "color" && tag.value in difficultyColorDots && (
                <View
                  style={[
                    styles.colorDot,
                    {
                      backgroundColor:
                        difficultyColorDots[
                          tag.value as keyof typeof difficultyColorDots
                        ],
                    },
                  ]}
                />
              )}
              <Text style={styles.tagText}>
                {tag.subcategory
                  ? `${labels.questions[tag.subcategory] ?? tag.subcategory}: `
                  : ""}
                {labels.values[tag.value] ?? tag.value}
                {tag.note ? ` · ${tag.note}` : ""} ×
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <Modal
        visible={menu !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenu(null)}
      >
        <View style={styles.backdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={labels.close}
            onPress={() => setMenu(null)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.menu}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {menuOptions.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  onPress={() => {
                    if (menu === "category")
                      onCategory(item as DifficultyCategory);
                    else if (menu === "question") onSubcategory(item);
                    else onValue(item);
                    setMenu(null);
                  }}
                  style={styles.menuItem}
                >
                  {menu === "value" &&
                    category === "color" &&
                    item in difficultyColorDots && (
                      <View
                        style={[
                          styles.colorDot,
                          {
                            backgroundColor:
                              difficultyColorDots[
                                item as keyof typeof difficultyColorDots
                              ],
                          },
                        ]}
                      />
                    )}
                  <View style={styles.menuCopy}>
                    <Text style={styles.menuText}>{textFor(item)}</Text>
                    {menu === "value" && labels.examples[item] && (
                      <Text style={styles.example}>
                        {labels.examples[item]}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              onPress={() => setMenu(null)}
              style={styles.menuItem}
            >
              <Text style={styles.menuText}>{labels.close}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { gap: 7, marginBottom: 15 },
  foodName: {
    color: colors.homeText,
    fontFamily: fonts.interBold,
    fontSize: 14,
  },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  spacer: { flex: 1 },
  select: {
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.mealReviewBorder,
    borderRadius: 12,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: "100%",
  },
  categorySelect: { flex: 1.7 },
  valueSelect: { flex: 1 },
  selectText: {
    flexShrink: 1,
    color: colors.homeText,
    fontSize: 12,
    fontFamily: fonts.interRegular,
  },
  chevron: { color: colors.homeText, fontSize: 15 },
  addButton: {
    width: 72,
    minHeight: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.homePrimary,
  },
  disabled: { opacity: 0.45 },
  addText: { color: colors.surface, fontFamily: fonts.interBold, fontSize: 12 },
  sentence: {
    backgroundColor: colors.textureSentence,
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  sentenceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  sentenceText: {
    color: colors.homeText,
    fontSize: 12,
    fontFamily: fonts.poppinsRegular,
  },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: colors.overlay,
  },
  menu: {
    maxHeight: "70%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.mealReviewBorder,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.mealReviewBorder,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuCopy: { flex: 1, gap: 4 },
  menuText: {
    color: colors.homeText,
    fontFamily: fonts.interRegular,
    fontSize: 13,
  },
  example: { color: colors.homeMuted, fontSize: 11 },
  colorDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.mealReviewBorder,
  },
  note: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.mealReviewBorder,
    backgroundColor: colors.surface,
    padding: 10,
    color: colors.homeText,
    fontSize: 12,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  tag: {
    maxWidth: "100%",
    borderRadius: 999,
    backgroundColor: colors.successSurface,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tagText: {
    flexShrink: 1,
    color: colors.success,
    fontSize: 12,
    fontFamily: fonts.interMedium,
  },
});
