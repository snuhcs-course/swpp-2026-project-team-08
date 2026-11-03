// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 스냅샷 대신 추천의 재료·조리법을 보여주고 근거 음식 이름은 원본 식사에서 찾음

import { Text, View } from 'react-native';
import type { Language } from '../../../types/profile';
import type { Suggestion } from '../../../types/suggestionRecord';
import { suggestionCopyFor } from '../../../util/strings';
import { suggestionStyles as s } from '../screens/suggestionStyles';

/** 서버 추천에는 음식 이름이 없으므로 추천의 근거가 된 음식을 원본 식사에서 찾는다. */
export function suggestionTargetName(
  item: Suggestion, meal: { foods: { id: string; name: string }[] } | undefined,
): string {
  return meal?.foods.find((food) => food.id === item.foodId)?.name ?? '';
}

export function GeneratedSuggestionBody({ item, language, details = false }: {
  item: Suggestion; language: Language; details?: boolean;
}) {
  const c = suggestionCopyFor(language);
  const sections = details
    ? [
        [c.ingredients, item.ingredients.join(', ') || c.noDetails],
        [c.cooking, item.cookingMethod],
        [c.serving, item.servingTip ?? c.noDetails],
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
