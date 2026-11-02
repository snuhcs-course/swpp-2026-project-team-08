// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Accessible acceptance slider and meal review appearance

import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';

const TRACK_INSET = 16;

export function AcceptanceSlider({ value, label, options, unsetLabel, onChange, review = false, clearable = true }: {
  review?: boolean;
  clearable?: boolean;
  value: number | null;
  label: string;
  options: readonly string[];
  unsetLabel: string;
  onChange: (value: number | null) => void;
}) {
  const width = useRef(0);
  const gesture = useRef<{ x: number; pageX: number; value: number | null } | null>(null);
  const [dragPosition, setDragPosition] = useState<number | null>(null);
  const lastIndex = options.length - 1;
  const inset = review ? 5 : TRACK_INSET;
  const position = dragPosition ?? (value == null ? null : value / lastIndex);

  function updatePosition(x: number) {
    if (width.current <= inset * 2 || !gesture.current) return;
    const fraction = Math.max(0, Math.min(1, (x - inset) / (width.current - inset * 2)));
    setDragPosition(fraction);
    const next = Math.round(fraction * lastIndex);
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
      accessibilityValue={{ min: 0, max: lastIndex, ...(value == null ? {} : { now: value }), text: value == null ? unsetLabel : options[value].replace('\n', ' ') }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={({ nativeEvent: { actionName } }) => {
        if (actionName === 'increment') onChange(value == null ? 0 : Math.min(lastIndex, value + 1));
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
      <View pointerEvents="none" style={[styles.track, review && styles.reviewTrack]}>
        {(position != null || review) && <>
          <View style={[styles.fill, { width: `${(position ?? 0) * 100}%` }]} />
          <View style={[styles.thumb, { left: `${(position ?? 0) * 100}%` }, review && position == null && styles.unsetThumb]} />
        </>}
      </View>
    </View>
    <View accessibilityRole="radiogroup" style={styles.labels}>
      {options.map((option, index) => <Pressable
        key={index}
        accessibilityRole="radio"
        accessibilityLabel={option.replace('\n', ' ')}
        accessibilityState={{ checked: value === index }}
        onPress={() => onChange(clearable && value === index ? null : index)}
        style={styles.option}
      >
        <Text style={[styles.text, review && styles.reviewText, value === index && styles.selectedText]}>{option}</Text>
      </Pressable>)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  reviewTrack: { marginHorizontal: 5 },
  reviewText: { fontSize: 12, lineHeight: 15, color: colors.reviewLabel },
  unsetThumb: { backgroundColor: colors.homeCalendarMuted },
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
