// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: Android 선택 목록을 현재 선택값 위치에서 열기
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
import type { NativeDropdownProps } from './NativeDropdown';

const rowHeight = 48;

export function NativeDropdown({ options, value, label, onChange, disabled = false, style, fieldStyle, children }: NativeDropdownProps) {
  const [open, setOpen] = useState(false);
  const unavailable = disabled || options.length === 0;
  const selectedIndex = options.findIndex(option => option.id === value);
  const close = () => setOpen(false);

  return <View style={style}>
    <Pressable accessibilityRole="button" accessibilityLabel={label}
      accessibilityValue={{ text: options[selectedIndex]?.label ?? value }}
      accessibilityState={{ disabled: unavailable, expanded: open }} disabled={unavailable}
      onPress={() => setOpen(true)} style={fieldStyle}>
      {children}
    </Pressable>
    {open && !unavailable && <Modal transparent animationType="fade" onRequestClose={close}>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} accessible={false} onPress={close} />
        <View style={styles.menu} accessibilityViewIsModal>
          <Text accessibilityRole="header" style={styles.title}>{label}</Text>
          <FlatList data={options} extraData={value} keyExtractor={option => option.id}
            style={styles.list} keyboardShouldPersistTaps="handled"
            initialScrollIndex={Math.max(0, selectedIndex)}
            getItemLayout={(_, index) => ({ length: rowHeight, offset: rowHeight * index, index })}
            renderItem={({ item }) => <Pressable accessibilityRole="button"
              accessibilityState={{ selected: item.id === value }}
              style={[styles.option, item.id === value && styles.selected]}
              onPress={() => { close(); onChange(item.id); }}>
              <Text numberOfLines={2} style={styles.text}>{item.label}</Text>
            </Pressable>} />
        </View>
      </View>
    </Modal>}
  </View>;
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.overlay },
  menu: { width: '100%', maxWidth: 374, maxHeight: '75%', borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface },
  title: { padding: 16, color: colors.homeText, fontFamily: fonts.interBold, fontSize: 16 },
  list: { flexGrow: 0, flexShrink: 1 },
  option: { height: rowHeight, paddingHorizontal: 16, justifyContent: 'center' },
  selected: { backgroundColor: colors.homeSelected },
  text: { color: colors.homeText, fontFamily: fonts.interRegular, fontSize: 14 },
});
