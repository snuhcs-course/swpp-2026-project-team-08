// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Labeled acceptance slider with continuous dragging and accessible adjustment

import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';

const TRACK_INSET = 16;

export function AcceptanceSlider({ value, label, options, unsetLabel, onChange }: {
  value: number | null;
  label: string;
  options: readonly [string, string, string, string];
  unsetLabel: string;
  onChange: (value: number | null) => void;
}) {
  const width = useRef(0);
  const gesture = useRef<{ x: number; pageX: number; value: number | null } | null>(null);
  const [dragPosition, setDragPosition] = useState<number | null>(null);
  const position = dragPosition ?? (value == null ? null : value / 3);

  function updatePosition(x: number) {
    if (width.current <= TRACK_INSET * 2 || !gesture.current) return;
    const fraction = Math.max(0, Math.min(1, (x - TRACK_INSET) / (width.current - TRACK_INSET * 2)));
    setDragPosition(fraction);
    const next = Math.round(fraction * 3);
    if (next !== gesture.current.value) {
      gesture.current.value = next;
      onChange(next);
    }
  }

  function move(event: GestureResponderEvent) {
    if (!gesture.current) return;
    updatePosition(gesture.current.x + event.nativeEvent.pageX - gesture.current.pageX);
  }

  function finish() {
    gesture.current = null;
    setDragPosition(null);
  }

  return <View>
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 3, ...(value == null ? {} : { now: value }), text: value == null ? unsetLabel : options[value].replace('\n', ' ') }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={({ nativeEvent: { actionName } }) => {
        if (actionName === 'increment') onChange(value == null ? 0 : Math.min(3, value + 1));
        if (actionName === 'decrement') onChange(value == null ? 0 : Math.max(0, value - 1));
      }}
      onLayout={(event) => { width.current = event.nativeEvent.layout.width; }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(event) => {
        gesture.current = { x: event.nativeEvent.locationX, pageX: event.nativeEvent.pageX, value };
        updatePosition(event.nativeEvent.locationX);
      }}
      onResponderMove={move}
      onResponderRelease={(event) => { move(event); finish(); }}
      onResponderTerminationRequest={() => false}
      onResponderTerminate={finish}
      style={styles.touchArea}
    >
      <View pointerEvents="none" style={styles.track}>
        {position != null && <>
          <View style={[styles.fill, { width: `${position * 100}%` }]} />
          <View style={[styles.thumb, { left: `${position * 100}%` }]} />
        </>}
      </View>
    </View>
    <View accessibilityRole="radiogroup" style={styles.labels}>
      {options.map((option, index) => <Pressable
        key={index}
        accessibilityRole="radio"
        accessibilityLabel={option.replace('\n', ' ')}
        accessibilityState={{ checked: value === index }}
        onPress={() => onChange(value === index ? null : index)}
        style={styles.option}
      >
        <Text style={[styles.text, value === index && styles.selectedText]}>{option}</Text>
      </Pressable>)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  touchArea: { height: 44, justifyContent: 'center' },
  track: { marginHorizontal: TRACK_INSET, height: 6, borderRadius: 3, backgroundColor: colors.editorDisabled },
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.homePrimary },
  thumb: {
    position: 'absolute', top: -8, width: 22, height: 22, borderRadius: 11,
    marginLeft: -11, borderWidth: 3, borderColor: colors.surface, backgroundColor: colors.homePrimary,
    shadowColor: colors.homePrimary, shadowOpacity: 0.25, shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 }, elevation: 3,
  },
  labels: { flexDirection: 'row' },
  option: { flex: 1, minHeight: 44, alignItems: 'center' },
  text: { textAlign: 'center', color: colors.editorMuted, fontFamily: fonts.interBold, fontSize: 11, lineHeight: 16 },
  selectedText: { color: colors.homePrimary },
});
