// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 감각 프로필 입력 화면과 간격
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeDropdown } from '../../../components/NativeDropdown';
import { AppButton } from '../../../components/AppButton';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { abcCopyFor, copyFor } from '../../../util/strings';

const options: Record<string, readonly string[]> = {
  hardness: ['soft', 'firm', 'hard'], breaking: ['crumbly', 'crunchy', 'brittle'],
  chewing: ['tender', 'chewy', 'tough'], stickiness: ['nonSticky', 'sticky', 'gummy'],
  springiness: ['springy', 'rubbery'], thickness: ['fluid', 'thin', 'thick', 'viscous'],
  moisture: ['dry', 'moist', 'juicy', 'wet'], oiliness: ['nonFatty', 'oily', 'greasy'],
  graininess: ['grainy', 'gritty', 'sandy', 'mealy', 'powdery'], density: ['dense', 'airy'],
  surface: ['smooth', 'rough', 'bumpy', 'crusty', 'fuzzy'], structure: ['fibrous', 'fleshy', 'layered', 'spongy'],
};

export function SensoryStepView({ language, childName, textures, note, onChange }: {
  language: Language; childName: string; textures: string[]; note: string;
  onChange: (textures: string[], note: string) => void;
}) {
  const s = copyFor(language).sensory;
  const labels = abcCopyFor(language);
  const [category, setCategory] = useState('');
  const [value, setValue] = useState('');
  const [menu, setMenu] = useState<'category' | 'value' | null>(null);
  const categoryLabels: Record<string, string> = labels.subcategories;
  const valueLabels: Record<string, string> = labels.values;
  const select = (kind: 'category' | 'value') => {
    const ids = kind === 'category' ? Object.keys(options) : options[category] ?? [];
    const current = kind === 'category' ? category : value;
    const placeholder = kind === 'category' ? s.category : s.value;
    const names = kind === 'category' ? categoryLabels : valueLabels;
    const change = (id: string) => { if (kind === 'category') { setCategory(id); setValue(''); } else setValue(id); setMenu(null); };
    const content = <Text style={styles.selectText}>{names[current] ?? placeholder} ⌄</Text>;
    if (Platform.OS !== 'web') return <NativeDropdown options={ids.map(id => ({ id, label: names[id] ?? id }))}
      value={current} label={placeholder} disabled={!ids.length} onChange={change} fieldStyle={styles.select}>{content}</NativeDropdown>;
    return <Pressable accessibilityRole="button" accessibilityLabel={placeholder} disabled={!ids.length}
      onPress={() => setMenu(menu === kind ? null : kind)} style={styles.select}>{content}</Pressable>;
  };
  const add = () => {
    const item = `${category}.${value}`;
    if (category && value && !textures.includes(item)) onChange([...textures, item], note);
  };
  return <View style={styles.root}>
    <Text style={styles.question}>{s.question(childName || copyFor(language).onboarding.childFallback)}</Text>
    <View style={styles.sentence}><View style={styles.row}><Text>{s.before}</Text>{select('category')}<Text>{s.especially}</Text></View>
      <View style={styles.row}>{select('value')}<Text>{s.after}</Text></View></View>
    {menu && <View style={styles.menu}>{(menu === 'category' ? Object.keys(options) : options[category] ?? []).map(id =>
      <Pressable key={id} accessibilityRole="button" onPress={() => { if (menu === 'category') { setCategory(id); setValue(''); } else setValue(id); setMenu(null); }} style={styles.menuItem}>
        <Text>{(menu === 'category' ? categoryLabels : valueLabels)[id] ?? id}</Text></Pressable>)}</View>}
    <AppButton label={s.add} compact disabled={!category || !value || textures.includes(`${category}.${value}`)} onPress={add} style={styles.add} />
    {textures.map(item => { const [group, trait] = item.split('.'); return <Pressable key={item} accessibilityRole="button" accessibilityLabel={`${s.remove} ${valueLabels[trait] ?? trait}`} onPress={() => onChange(textures.filter(x => x !== item), note)} style={styles.tag}>
      <Text>{categoryLabels[group] ?? group}: {valueLabels[trait] ?? trait} ×</Text></Pressable>; })}
    <Text style={[styles.question, styles.otherQuestion]}>{s.other}</Text>
    <TextInput accessibilityLabel={s.other} placeholder={s.note} value={note} onChangeText={text => onChange(textures, text)} multiline style={styles.input} />
  </View>;
}
const styles = StyleSheet.create({
  otherQuestion: { marginTop: 18 },
  root: { gap: 10 }, question: { color: colors.onboardingText, fontFamily: fonts.poppinsBold, fontSize: 15, lineHeight: 19 },
  sentence: { backgroundColor: colors.textureSentence, borderRadius: 12, padding: 10, gap: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  select: { backgroundColor: colors.surface, borderColor: colors.mealReviewBorder, borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  selectText: { color: colors.onboardingText, fontSize: 12 }, add: { alignSelf: 'flex-end' },
  menu: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.mealReviewBorder },
  menuItem: { padding: 10 }, tag: { alignSelf: 'flex-start', padding: 8, borderRadius: 10, backgroundColor: colors.textureSentence },
  input: { minHeight: 80, borderWidth: 1, borderColor: colors.mealReviewBorder, borderRadius: 8, backgroundColor: colors.surface, padding: 12, textAlignVertical: 'top', color: colors.onboardingText },
});
