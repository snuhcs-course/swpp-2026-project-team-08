// AI-generated with GPT-6, 2026-11-03, reviewed by Seoyeon Heo
// Changed: Align slider labels and keep edge labels inside the component

import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';

const TRACK_INSET = 16;
const REVIEW_TRACK_INSET = 12;

export function AcceptanceSlider<T extends string | number = number>({ value, label, options, optionValues, unsetLabel, onChange, review = false, clearable = true }: {
  review?: boolean;
  clearable?: boolean;
  value: T | null;
  label: string;
  options: readonly string[];
  optionValues?: readonly T[];
  unsetLabel: string;
  onChange: (value: T | null) => void;
}) {
  const width = useRef(0);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const gesture = useRef<{ x: number; pageX: number; value: T | null } | null>(null);
  const [dragPosition, setDragPosition] = useState<number | null>(null);
  const lastIndex = options.length - 1;
  const inset = review ? REVIEW_TRACK_INSET : TRACK_INSET;
  const trackWidth = Math.max(0, layoutWidth - inset * 2);
  const optionWidth = trackWidth / Math.max(options.length, 1);
  const selectedIndex = value == null ? null : optionValues ? optionValues.indexOf(value) : Number(value);
  const position = dragPosition ?? (selectedIndex == null ? null : selectedIndex / lastIndex);

  function valueAt(index: number): T {
    return optionValues ? optionValues[index] : index as T;
  }

  function updatePosition(x: number) {
    if (width.current <= inset * 2 || !gesture.current) return;
    const fraction = Math.max(0, Math.min(1, (x - inset) / (width.current - inset * 2)));
    setDragPosition(fraction);
    const next = Math.round(fraction * lastIndex);
    const nextValue = valueAt(next);
    if (nextValue !== gesture.current.value) {
      gesture.current.value = nextValue;
      onChange(nextValue);
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
      accessibilityValue={{ min: 0, max: lastIndex, ...(selectedIndex == null ? {} : { now: selectedIndex }), text: selectedIndex == null ? unsetLabel : options[selectedIndex].replace('\n', ' ') }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={({ nativeEvent: { actionName } }) => {
        if (actionName === 'increment') onChange(valueAt(selectedIndex == null ? 0 : Math.min(lastIndex, selectedIndex + 1)));
        if (actionName === 'decrement') onChange(valueAt(selectedIndex == null ? 0 : Math.max(0, selectedIndex - 1)));
      }}
      onLayout={(event) => {
        width.current = event.nativeEvent.layout.width;
        setLayoutWidth(event.nativeEvent.layout.width);
      }}
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
      <View pointerEvents="none" style={[styles.track, { marginHorizontal: inset }]}>
        {(position != null || review) && <>
          <View style={[styles.fill, { width: `${(position ?? 0) * 100}%` }]} />
          <View style={[styles.thumb, { left: `${(position ?? 0) * 100}%` }, review && position == null && styles.unsetThumb]} />
        </>}
      </View>
    </View>
    <View accessibilityRole="radiogroup" style={[styles.labels, { marginHorizontal: inset }]}>
      {options.map((option, index) => <Pressable
        key={index}
        accessibilityRole="radio"
        accessibilityLabel={option.replace('\n', ' ')}
        accessibilityState={{ checked: selectedIndex === index }}
        onPress={() => onChange(clearable && selectedIndex === index ? null : valueAt(index))}
        style={[styles.option, {
          width: optionWidth,
          left: `${(index / Math.max(lastIndex, 1)) * 100}%`,
          marginLeft: -optionWidth / 2,
        }]}
      >
        <Text style={[styles.text, review && styles.reviewText, selectedIndex === index && styles.selectedText]}>{option}</Text>
      </Pressable>)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
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
  labels: { height: 44, position: 'relative' },
  option: { position: 'absolute', top: 0, minHeight: 44, alignItems: 'center' },
  text: { textAlign: 'center', color: colors.editorMuted, fontFamily: fonts.interBold, fontSize: 11, lineHeight: 16 },
  selectedText: { color: colors.homePrimary },
});
