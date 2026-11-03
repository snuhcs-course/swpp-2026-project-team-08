// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
// Changed: 클라이언트 모델, DTO, DB Schema 통합 및 일관화
// AI-generated with GPT-6, 2026-11-03, reviewed by Seoyeon Heo
// Changed: 식후 검토 가독성 및 3단계 진행 표시; 공통 진행 바 사용

import { ProgressBar } from '../../../components/ProgressBar';
import { AppHeader, topBarStyles } from '../../../components/AppHeader';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';

export function ReviewProgressHeader({ title, backLabel, progress, onBack, optional, caption, disabled }: {
  title: string;
  backLabel: string;
  progress: number;
  onBack: () => void;
  optional?: string;
  caption?: string;
  stacked?: boolean;
  disabled?: boolean;
}) {
  return (
    <View>
      <AppHeader title={title} backLabel={backLabel} onBack={onBack} disabled={disabled} accessory={optional ? <Text style={styles.optional}>{optional}</Text> : undefined} />
      <View style={topBarStyles.details}>
      {caption && <Text style={styles.caption}>{caption}</Text>}
      <ProgressBar current={progress + 1} total={3} style={styles.progress}
        trackStyle={styles.segment} fillStyle={styles.active} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caption: { color: colors.homeText, fontSize: 14, fontFamily: fonts.poppinsRegular, lineHeight: 20 },
  optional: { color: colors.mealReviewMuted, fontSize: 12, fontFamily: fonts.interRegular, marginLeft: 'auto' },
  progress: { flexDirection: 'row', gap: 5 },
  segment: { height: 4, flex: 1, borderRadius: 999, backgroundColor: colors.mealReviewBorder },
  active: { backgroundColor: colors.homePrimary },
});
