// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: 식사 흐름 주요 버튼 디자인 공통화

import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { AppButton } from './AppButton';
import { UiAssetIcon } from './UiAssetIcon';

type Props = Omit<ComponentProps<typeof AppButton>, 'variant' | 'secondary' | 'compact'>;

export function MealFlowButton({ icon = <UiAssetIcon name="meal-check" />, style, labelStyle, ...props }: Props) {
  return <AppButton {...props} variant="meal" icon={icon}
    style={[styles.button, style]} labelStyle={[styles.label, labelStyle]} />;
}

const styles = StyleSheet.create({
  button: { minHeight: 50, alignSelf: 'stretch' },
  label: { fontSize: 16, flexShrink: 1 },
});
