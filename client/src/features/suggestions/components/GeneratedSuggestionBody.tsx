// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 스냅샷 대신 추천의 재료·조리법을 보여주고 근거 음식 이름은 원본 식사에서 찾음
// AI-generated with GPT-6, 2026-11-13, reviewed by Haechan Jung
// Changed: 추천 조리 방법을 화면 언어에 맞는 표현으로 표시

// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 추천 조리법 공통 표시명과 미입력 표시
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 저장된 추천 상세에 추천 행동·이유·제공 팁 표시
// AI-generated with Claude Opus 5.5, 2026-11-28, reviewed by Jaemin Kim
// Changed: 저장된 추천 상세에 시도할 것·이유·재료·준비 방법 네 항목 표시

import { Text, View } from 'react-native';
import type { Language } from '../../../types/profile';
import type { Suggestion } from '../../../types/suggestionRecord';
import { suggestionCopyFor } from '../../../util/strings';
import { suggestionStyles as s } from '../screens/suggestionStyles';

export function GeneratedSuggestionBody({ item, language }: {
  item: Suggestion; language: Language;
}) {
  const c = suggestionCopyFor(language);
  const sections = [
    [c.what, item.whatToTry],
    [c.why, item.whyThisMayHelp],
    [c.ingredient, item.ingredients.join(', ') || c.noDetails],
    [c.preparationMethod, item.preparationMethod ?? c.noDetails],
  ];
  return <View style={s.stack}>
    {sections.map(([title, body]) => <View key={title} style={s.section}>
      <Text style={s.heading}>{title}</Text>
      <Text style={s.text}>{body}</Text>
    </View>)}
  </View>;
}
