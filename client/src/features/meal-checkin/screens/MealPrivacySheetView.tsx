// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선

// AI-generated with GPT-6, 2026-11-12, reviewed by Seoyeon Heo
// Changed: 사진 안내창 개인정보처리방침 링크 추가

import { Text } from 'react-native';
import { ExternalLink } from '../../../components/ExternalLink';
import { PRIVACY_POLICY_URL } from '../../../util/links';
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
      <ExternalLink href={PRIVACY_POLICY_URL} errorMessage={s.common.openLinkFailed}>
        <Text style={ui.text}>{s.common.privacyPolicy} ↗</Text>
      </ExternalLink>
    </BottomSheet>
  );
}
