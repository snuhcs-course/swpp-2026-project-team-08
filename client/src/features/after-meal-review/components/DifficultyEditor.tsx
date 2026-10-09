// This Code is generated with AI

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DifficultyCategory, DifficultyTag } from '../../../types/afterMealReview';
import { difficultyColorDots, colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';

const categoryIcons: Record<DifficultyCategory, string> = {
  texture: '▦', tasteType: '◌', tasteIntensity: '◉', smell: '≈',
  color: '●', shape: '◇', visibility: '◐', temperature: '°', notSure: '?',
};

export function DifficultyEditor({ foodName, category, value, note, tags, options, labels, canAdd, showNote, onCategory, onValue, onNote, onAdd, onRemove }: {
  foodName: string;
  category: DifficultyCategory | null;
  value: string;
  note: string;
  tags: DifficultyTag[];
  options: readonly string[];
  labels: {
    categoryPlaceholder: string;
    valuePlaceholder: string;
    note: string;
    add: string;
    remove: string;
    categories: Record<DifficultyCategory, string>;
    values: Record<string, string>;
  };
  canAdd: boolean;
  showNote: boolean;
  onCategory: (category: DifficultyCategory) => void;
  onValue: (value: string) => void;
  onNote: (value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const [menu, setMenu] = useState<'category' | 'value' | null>(null);
  const categoryOptions = Object.keys(labels.categories) as DifficultyCategory[];
  return (
    <View style={[styles.root, menu && styles.openRoot]}>
      <Text style={styles.foodName}>{foodName}</Text>
      <View style={styles.row}>
        <View style={[styles.selectWrap, styles.categoryWrap, menu === 'category' && styles.openMenu]}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: menu === 'category' }} onPress={() => setMenu(menu === 'category' ? null : 'category')} style={styles.select}>
            <Text style={styles.selectText} numberOfLines={1}>{category ? labels.categories[category] : labels.categoryPlaceholder}</Text>
            <Text style={styles.chevron}>⌄</Text>
          </Pressable>
          {menu === 'category' && (
            <ScrollView nestedScrollEnabled style={styles.menu} keyboardShouldPersistTaps="handled">
              {categoryOptions.map((item) => (
                <Pressable key={item} accessibilityRole="button" onPress={() => { onCategory(item); setMenu(null); }} style={styles.menuItem}>
                  <Text style={styles.categoryIcon}>{categoryIcons[item]}</Text>
                  <Text style={styles.menuText}>{labels.categories[item]}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
        <View style={[styles.selectWrap, styles.valueWrap, menu === 'value' && styles.openMenu]}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: menu === 'value', disabled: !category }} disabled={!category} onPress={() => setMenu(menu === 'value' ? null : 'value')} style={styles.select}>
            <Text style={styles.selectText} numberOfLines={1}>{value ? labels.values[value] ?? value : labels.valuePlaceholder}</Text>
            <Text style={styles.chevron}>⌄</Text>
          </Pressable>
          {menu === 'value' && (
            <ScrollView nestedScrollEnabled style={styles.menu} keyboardShouldPersistTaps="handled">
              {options.map((item) => (
                <Pressable key={item} accessibilityRole="button" onPress={() => { onValue(item); setMenu(null); }} style={styles.menuItem}>
                  {category === 'color' && item in difficultyColorDots && (
                    <View style={[styles.colorDot, { backgroundColor: difficultyColorDots[item as keyof typeof difficultyColorDots] }]} />
                  )}
                  <Text style={styles.menuText}>{labels.values[item] ?? item}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canAdd }} disabled={!canAdd} onPress={onAdd} style={[styles.addButton, !canAdd && styles.disabled]}>
          <Text style={styles.addText}>{labels.add}</Text>
        </Pressable>
      </View>
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
            <Pressable key={tag.id} accessibilityRole="button" accessibilityLabel={`${labels.remove}: ${labels.values[tag.value] ?? tag.value}`} onPress={() => onRemove(tag.id)} style={styles.tag}>
              {tag.category === 'color' && tag.value in difficultyColorDots && (
                <View style={[styles.colorDot, { backgroundColor: difficultyColorDots[tag.value as keyof typeof difficultyColorDots] }]} />
              )}
              <Text style={styles.tagText}>{labels.values[tag.value] ?? tag.value}{tag.note ? ` · ${tag.note}` : ''} ×</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 6, zIndex: 0 },
  openRoot: { zIndex: 20 },
  foodName: { color: colors.homeText, fontFamily: fonts.interBold, fontSize: 11 },
  row: { flexDirection: 'row', gap: 7, alignItems: 'flex-start' },
  selectWrap: { position: 'relative', zIndex: 0 },
  categoryWrap: { flex: 1.7 },
  valueWrap: { flex: 1 },
  openMenu: { zIndex: 21 },
  select: { height: 37, paddingHorizontal: 9, borderWidth: 1, borderColor: colors.mealReviewBorder, borderRadius: 10, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 3 },
  selectText: { flex: 1, color: colors.homeText, fontSize: 9, fontFamily: fonts.interRegular },
  chevron: { color: colors.homeText, fontSize: 15 },
  menu: { position: 'absolute', top: 37, left: 0, right: 0, maxHeight: 230, borderWidth: 1, borderColor: colors.mealReviewBorder, backgroundColor: colors.surface, borderRadius: 10, elevation: 9, zIndex: 22 },
  menuItem: { minHeight: 29, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: colors.mealReviewBorder, flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuText: { color: colors.homeText, fontFamily: fonts.interRegular, fontSize: 9 },
  categoryIcon: { width: 13, color: colors.homePrimary, fontFamily: fonts.interBold, fontSize: 11, textAlign: 'center' },
  colorDot: { width: 11, height: 11, borderRadius: 6, borderWidth: 1, borderColor: colors.mealReviewBorder },
  addButton: { width: 72, height: 37, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.homePrimary },
  disabled: { opacity: 0.45 },
  addText: { color: colors.surface, fontFamily: fonts.interBold, fontSize: 9 },
  note: { minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.mealReviewBorder, backgroundColor: colors.surface, padding: 10, color: colors.homeText, fontSize: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag: { borderRadius: 999, backgroundColor: colors.successSurface, paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagText: { color: colors.success, fontSize: 9, fontFamily: fonts.interMedium },
});
