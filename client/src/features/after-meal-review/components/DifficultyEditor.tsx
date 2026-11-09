// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: 네이티브 어려움 선택기·글자 확대 및 추가 버튼 디자인 통일
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; align picker chevrons with the right inset
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; match inline difficulty menus
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: 활성 여부와 무관하게 네이티브 선택 필드 너비 유지
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 어려움 태그에 항목명과 식감 세부 항목 표시

import { DifficultyReasonTag } from '../../../components/DifficultyReasonTag';
import { UiAssetIcon, type UiAssetIconName } from "../../../components/UiAssetIcon";
import { MealFlowButton } from "../../../components/MealFlowButton";
import { useState } from "react";
import { NativeDropdown } from "../../../components/NativeDropdown";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
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
const categoryIcons: Partial<Record<DifficultyCategory, UiAssetIconName>> = {
  texture: 'difficulty-texture', tasteType: 'difficulty-taste', smell: 'difficulty-smell', color: 'difficulty-color',
  pieceSize: 'difficulty-piece', arrangement: 'difficulty-arrangement', temperature: 'difficulty-temperature', notSure: 'difficulty-unsure',
};

function DifficultySelect({ label, value, placeholder, options, disabled = false, expanded, onPress, onChange, style }: {
  label: string;
  value: string;
  placeholder: string;
  options: readonly { id: string; label: string }[];
  disabled?: boolean;
  expanded: boolean;
  onPress: () => void;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const [fieldWidth, setFieldWidth] = useState<number>();
  const content = <>
    <Text style={styles.selectText}>{label || placeholder}</Text>
    <UiAssetIcon name="abc-select" />
  </>;
  if (Platform.OS === 'android' || Platform.OS === 'ios') return (
    <View style={style} onLayout={({ nativeEvent }) => setFieldWidth(nativeEvent.layout.width)}>
      <NativeDropdown options={options} value={value} label={placeholder} disabled={disabled}
        onChange={onChange} style={styles.nativeMenu}
        fieldStyle={[styles.select, fieldWidth != null && { width: fieldWidth }]}>
        {content}
      </NativeDropdown>
    </View>
  );
  return <Pressable accessibilityRole="button" accessibilityLabel={placeholder}
    accessibilityState={{ expanded, disabled }} disabled={disabled} onPress={onPress}
    style={[styles.select, style]}>{content}</Pressable>;
}
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
    <DifficultySelect
      label={value ? (labels.values[value] ?? value) : ''}
      value={value}
      placeholder={labels.valuePlaceholder}
      options={options.map(item => ({ id: item, label: labels.examples[item]
        ? `${labels.values[item] ?? item}\n${labels.examples[item]}` : (labels.values[item] ?? item) }))}
      expanded={menu === "value"}
      disabled={!category || (isTexture && !subcategory)}
      onPress={() => setMenu(menu === "value" ? null : "value")}
      onChange={onValue}
      style={!isTexture && styles.valueSelect}
    />
  );
  return (
    <View style={styles.root}>
      <Text style={styles.foodName}>{foodName}</Text>
      <View style={styles.row}>
        <DifficultySelect
          label={category ? (labels.categories[category] ?? category) : ''}
          value={category ?? ''}
          placeholder={labels.categoryPlaceholder}
          options={Object.entries(labels.categories).map(([id, label]) => ({ id, label: label ?? id }))}
          expanded={menu === "category"}
          onPress={() => setMenu(menu === "category" ? null : "category")}
          onChange={item => onCategory(item as DifficultyCategory)}
          style={styles.categorySelect}
        />
        {!isTexture && valueSelect}
        {isTexture && <View style={styles.spacer} />}
        <MealFlowButton
          label={labels.add}
          icon={null}
          disabled={!canAdd}
          onPress={onAdd}
          style={styles.addButton}
        />
      </View>
      {isTexture && (
        <View style={styles.sentence}>
          <View style={styles.sentenceRow}>
            <DifficultySelect
              label={subcategory ? (labels.questions[subcategory] ?? subcategory) : ''}
              value={subcategory ?? ''}
              placeholder={labels.textureQuestion}
              options={Object.entries(labels.questions).map(([id, label]) => ({ id, label }))}
              expanded={menu === "question"}
              onPress={() => setMenu(menu === "question" ? null : "question")}
              onChange={onSubcategory}
            />
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
            <DifficultyReasonTag key={tag.id} reason={tag} labels={labels}
              onRemove={() => onRemove(tag.id)} />
          ))}
        </View>
      )}
      {menu !== null && <View style={styles.menu}>
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
                  {menu === "category" && categoryIcons[item as DifficultyCategory] && <UiAssetIcon name={categoryIcons[item as DifficultyCategory]!} />}
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
      </View>}

    </View>
  );
}
const styles = StyleSheet.create({
  root: { gap: 7, marginBottom: 10 },
  foodName: {
    color: colors.homeText,
    fontFamily: fonts.interBold,
    fontSize: 18,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  spacer: { flex: 1 },
  select: {
    minHeight: 50,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.mealReviewBorder,
    borderRadius: 12,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
    maxWidth: "100%",
  },
  nativeMenu: { width: "100%" },
  categorySelect: { flexBasis: 170, flexGrow: 1, flexShrink: 1 },
  valueSelect: { flexBasis: 120, flexGrow: 1, flexShrink: 1 },
  selectText: {
    flexShrink: 1,
    color: colors.homeText,
    fontSize: 16,
    fontFamily: fonts.interRegular,
  },
  chevron: { color: colors.homeText, fontSize: 18 },
  addButton: {
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  disabled: { opacity: 0.45 },
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
    fontSize: 16,
    fontFamily: fonts.poppinsRegular,
  },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: colors.overlay,
  },
  menu: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.mealReviewBorder,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 27,
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
    fontSize: 14,
  },
  example: { color: colors.homeMuted, fontSize: 14 },
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
    fontSize: 16,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
});
