import { Text, View } from 'react-native';
import type { Language } from '../../../types/profile';
import type { Suggestion } from '../../../types/suggestionRecord';
import { suggestionCopyFor } from '../../../util/strings';
import { suggestionStyles as s } from '../screens/suggestionStyles';

export function suggestionTargetName(item: Suggestion): string {
  return item.foodSnapshot.ingredients.find((ingredient) => ingredient.id === item.ingredientId)?.name
    ?? item.foodSnapshot.name;
}

export function GeneratedSuggestionBody({ item, language, details = false }: {
  item: Suggestion; language: Language; details?: boolean;
}) {
  const c = suggestionCopyFor(language);
  const sections = details
    ? [
        [c.ingredients, item.foodSnapshot.ingredients.map((ingredient) => ingredient.name).join(', ') || c.noDetails],
        [c.cooking, item.foodSnapshot.cookingMethod ?? c.noDetails],
        [c.serving, item.foodSnapshot.servingNote ?? c.noDetails],
      ]
    : [
        [c.what, item.whatToTry],
        [c.why, item.whyThisMayHelp],
        [c.serving, item.servingTip ?? c.noDetails],
      ];
  return <View style={s.stack}>
    {sections.map(([title, body]) => <View key={title} style={s.section}>
      <Text style={s.heading}>{title}</Text>
      <Text style={s.text}>{body}</Text>
    </View>)}
  </View>;
}
