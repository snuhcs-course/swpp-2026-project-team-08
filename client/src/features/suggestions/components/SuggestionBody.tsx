// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가

import { Text, View } from 'react-native';
import type { Suggestion } from '../../../types/suggestion';
import type { Language } from '../../../types/profile';
import { suggestionCopyFor } from '../../../util/strings';
import { suggestionStyles as s } from '../screens/suggestionStyles';

export function SuggestionBody({
  item,
  language,
  details = false,
}: {
  item: Suggestion;
  language: Language;
  details?: boolean;
}) {
  const c = suggestionCopyFor(language);
  const sections = details
    ? [
        [c.ingredients, item.content.ingredients.join(', ') || c.noDetails],
        [c.cooking, item.content.preparation || c.noDetails],
        [
          c.linkedReason,
          item.content.linked_reason
            .map((r) => [r.category, r.value, r.note].filter(Boolean).join(' · '))
            .join('\n') || c.noDetails,
        ],
      ]
    : [
        [c.what, item.content.what_to_try],
        [c.why, item.content.why_this_may_help],
        [c.serving, item.content.serving_tip],
      ];
  return (
    <View style={s.stack}>
      {sections.map(([title, body]) => (
        <View key={title} style={s.section}>
          <Text style={s.heading}>{title}</Text>
          {details && title === c.ingredients ? (
            <View style={s.wrap}>
              {(item.content.ingredients.length ? item.content.ingredients : [c.noDetails]).map((name, index) => (
                <View key={`${index}:${name}`} style={s.ingredientChip}><Text style={s.ingredientLabel}>{name}</Text></View>
              ))}
            </View>
          ) : <Text style={[s.text, details && title === c.linkedReason && s.savedIntro]}>{body}</Text>}
        </View>
      ))}
    </View>
  );
}
