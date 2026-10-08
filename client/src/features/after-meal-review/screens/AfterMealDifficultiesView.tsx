import { StyleSheet, Text, View } from 'react-native';
import { DifficultyEditor } from '../components/DifficultyEditor';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { copyFor } from '../../../util/strings';
import type { ReviewViewProps } from './reviewViewTypes';

type Props = Pick<ReviewViewProps,
  'meal' | 'draft' | 'language' | 'difficultyForms' | 'onDifficultyInput' | 'onAddDifficulty' | 'onRemoveDifficulty'>;

export function AfterMealDifficultiesView({ p }: { p: Props }) {
  const s = copyFor(p.language);
  const m = s.afterMealReview;
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{m.titles.difficulties}</Text>
      <Text style={styles.subtitle}>{m.difficultyIntro}</Text>
      {p.meal.foods.map((food) => {
        const input = p.draft.difficultyInputs[food.id] ?? { category: null, value: '', note: '' };
        const form = p.difficultyForms[food.id] ?? { options: [], canAdd: false, showNote: false };
        return (
          <DifficultyEditor
            key={food.id}
            foodName={food.name}
            category={input.category}
            value={input.value}
            note={input.note}
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
              categories: m.categories,
              values: m.values as Record<string, string>,
            }}
            onCategory={(category) => p.onDifficultyInput(food.id, { category, value: category === 'notSure' ? 'notSure' : '', note: '' })}
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
  root: { gap: 12 },
  title: { color: colors.homeText, fontSize: 18, fontFamily: fonts.poppinsSemiBold },
  subtitle: { color: colors.mealReviewMuted, fontSize: 9, fontFamily: fonts.interRegular, marginTop: -8 },
});
