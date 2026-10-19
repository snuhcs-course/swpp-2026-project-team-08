// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; corrected Figma audit details
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
// This Code is generated with AI

import { StyleSheet, Text, View } from 'react-native';
import { DifficultyEditor } from '../components/DifficultyEditor';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { abcCopyFor, copyFor } from '../../../util/strings';
import type { ReviewViewProps } from './reviewViewTypes';

type Props = Pick<ReviewViewProps,
  'meal' | 'draft' | 'language' | 'difficultyForms' | 'onDifficultyInput' | 'onAddDifficulty' | 'onRemoveDifficulty'>;

export function AfterMealDifficultiesView({ p }: { p: Props }) {
  const s = copyFor(p.language);
  const m = s.afterMealReview;
  const a = abcCopyFor(p.language);
  return (
    <View style={styles.root}>
      <Text style={styles.subtitle}>{m.difficultyIntro}</Text>
      {p.meal.foods.map((food) => {
        const input = p.draft.difficultyInputs[food.id] ?? { category: null, value: '', note: '', subcategory: '' };
        const form = p.difficultyForms[food.id] ?? { options: [], canAdd: false, showNote: false };
        return (
          <DifficultyEditor
            key={food.id}
            foodName={food.name}
            category={input.category}
            value={input.value}
            note={input.note}
            subcategory={input.subcategory}
            tags={p.draft.difficulties[food.id] ?? []}
            options={form.options}
            canAdd={form.canAdd}
            showNote={form.showNote}
            labels={{
              categoryPlaceholder: m.selectCategory,
              valuePlaceholder: m.selectValue,
              note: m.note,
              add: m.addTag,
              remove: s.common.remove,
              categories: a.difficultyCategories,
              questions: a.subcategories,
              textureQuestion: a.textureQuestion, textureCause: a.textureCause, textureTrait: a.textureTrait,
              examples: a.examples, close: s.common.close,
              values: { ...m.values, ...a.values } as Record<string, string>,
            }}
            onCategory={(category) => p.onDifficultyInput(food.id, { category, value: category === 'notSure' ? 'notSure' : '', note: '', subcategory: '' })}
            onSubcategory={(subcategory) => p.onDifficultyInput(food.id, { subcategory, value: '', note: '' })}
            onValue={(value) => p.onDifficultyInput(food.id, { value, note: '' })}
            onNote={(note) => p.onDifficultyInput(food.id, { note })}
            onAdd={() => p.onAddDifficulty(food.id)}
            onRemove={(id) => p.onRemoveDifficulty(food.id, id)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 5 },
  title: { color: colors.homeText, fontSize: 18, fontFamily: fonts.poppinsSemiBold },
  subtitle: { color: colors.mealReviewMuted, fontSize: 10, lineHeight: 12, fontFamily: fonts.interRegular, marginTop: -8, marginBottom: 7 },
});
