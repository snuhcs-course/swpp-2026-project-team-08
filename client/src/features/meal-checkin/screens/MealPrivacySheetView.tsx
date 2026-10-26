// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선

import { Text } from 'react-native';
import { BottomSheet } from '../../../components/BottomSheet';
import { formStyles as ui } from '../../../components/formStyles';
import { copyFor } from '../../../util/strings';
import type { MealCheckinViewProps } from './mealCheckinViewTypes';

type Props = Pick<MealCheckinViewProps, 'language' | 'sheet' | 'onSheet'>;

export function MealPrivacySheetView({ p }: { p: Props }) {
  const s = copyFor(p.language);
  if (p.sheet !== 'privacy') return null;
  return (
    <BottomSheet title={s.mealCheckin.privacy} closeLabel={s.common.close} onClose={() => p.onSheet(null)}>
      <Text style={ui.text}>{s.mealCheckin.privacyBody}</Text>
    </BottomSheet>
  );
}
