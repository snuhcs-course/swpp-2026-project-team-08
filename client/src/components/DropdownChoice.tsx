// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: 네이티브 드롭다운을 부모 입력 영역 너비에 맞춤
// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선

// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 웹 편집 드롭다운을 모달 크기에 영향 없는 오버레이로 표시

import { useRef, useState, type ComponentRef } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../util/colors';
import { UiAssetIcon } from './UiAssetIcon';
import { fonts } from '../util/fonts';
import { NativeDropdown } from './NativeDropdown';

export function DropdownChoice({ options, value, onChange, placeholder, displayFallback, variant = 'onboarding' }: {
  variant?: 'onboarding' | 'editor';
  options: readonly { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  displayFallback?: string;
}) {
  const [open, setOpen] = useState(false);
  const [fieldWidth, setFieldWidth] = useState<number>();
  const fieldRef = useRef<ComponentRef<typeof View>>(null);
  const [anchor, setAnchor] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);
  const toggle = () => {
    if (open) { setOpen(false); return; }
    if (variant !== 'editor') { setOpen(true); return; }
    fieldRef.current?.measureInWindow((x, y, width, height) => {
      const viewport = Dimensions.get('window');
      const below = viewport.height - y - height - 12;
      const above = y - 12;
      const desired = Math.min(options.length * 36 + 2, 290);
      const upwards = below < desired && above > below;
      const maxHeight = Math.max(0, Math.min(desired, upwards ? above : below));
      setAnchor({ left: Math.max(8, Math.min(x, viewport.width - width - 8)),
        top: upwards ? y - maxHeight - 5 : y + height + 5, width, maxHeight });
      setOpen(true);
    });
  };
  const selected = options.find((option) => option.id === value);
  if (Platform.OS === 'android' || Platform.OS === 'ios') return (
    <View style={styles.wrap} onLayout={({ nativeEvent }) => setFieldWidth(nativeEvent.layout.width)}>
      <NativeDropdown options={options} value={value} onChange={onChange} label={placeholder}
        style={styles.nativeMenu}
        fieldStyle={[styles.field, variant === 'editor' && styles.editorField, fieldWidth != null && { width: fieldWidth }]}>
        <Text style={[styles.value, variant === 'editor' && styles.editorValue]}>{selected?.label ?? displayFallback ?? placeholder}</Text>
        {variant === 'editor' ? <UiAssetIcon name="abc-select" /> : <Feather name="chevron-down" size={15} color={colors.onboardingText} />}
      </NativeDropdown>
    </View>
  );
  const optionItems = options.map((option) => (
    <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected: value === option.id }}
      onPress={() => { onChange(option.id); setOpen(false); }}
      style={[styles.option, value === option.id && styles.selectedOption]}>
      <Text style={[styles.optionText, value === option.id && styles.selectedText]}>{option.label}</Text>
    </Pressable>
  ));
  return (
    <View ref={fieldRef} style={styles.wrap}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={toggle} style={[styles.field, variant === 'editor' && styles.editorField, open && styles.activeField]}>
        <Text style={[styles.value, variant === 'editor' && styles.editorValue]}>{selected?.label ?? displayFallback ?? placeholder}</Text>
        {variant === 'editor' && !open ? <UiAssetIcon name="abc-select" /> : <Feather name={open ? 'chevron-up' : 'chevron-down'} size={15} color={colors.onboardingText} />}
      </Pressable>
      {open && (variant === 'editor' && anchor ? (
        <Modal transparent animationType="none" onRequestClose={() => setOpen(false)}>
          <View style={styles.overlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessible={false} />
            <ScrollView keyboardShouldPersistTaps="handled" style={[styles.options, styles.popover, anchor]}>
              {optionItems}
            </ScrollView>
          </View>
        </Modal>
      ) : <View style={styles.options}>{optionItems}</View>)}
    </View>
  );
}

const styles = StyleSheet.create({
  editorField: { height: 38, borderRadius: 10, borderColor: colors.mealReviewBorder, backgroundColor: colors.editorInput },
  editorValue: { color: colors.editorPlaceholder, fontFamily: fonts.poppinsMedium, fontSize: 13 },
  wrap: { gap: 5, width: '100%' },
  nativeMenu: { width: '100%' },
  field: { height: 40, borderRadius: 8, borderWidth: 1, borderColor: colors.onboardingBorder, backgroundColor: colors.surface, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeField: { borderColor: colors.onboardingPrimary, borderWidth: 1.4 },
  value: { flex: 1, color: colors.onboardingText, fontSize: 13, fontFamily: fonts.interMedium },
  overlay: { flex: 1 },
  popover: { position: 'absolute', zIndex: 1 },
  options: { borderRadius: 8, borderWidth: 1, borderColor: colors.onboardingBorder, backgroundColor: colors.surface, overflow: 'hidden' },
  option: { height: 36, flexShrink: 0, paddingHorizontal: 11, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.onboardingBorder },
  selectedOption: { backgroundColor: colors.homeSelected },
  optionText: { color: colors.onboardingText, fontSize: 13, fontFamily: fonts.interRegular },
  selectedText: { color: colors.onboardingPrimary, fontFamily: fonts.interBold },
});
