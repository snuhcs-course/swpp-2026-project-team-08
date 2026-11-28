// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-11-03, reviewed by Seoyeon Heo
// Changed: Native flip/swipe animations, stable text and shared progress bar
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: 진행 중인 카드 스와이프의 제스처 소유권 유지

// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 앞쪽 텍스트 카드는 수평으로 두고 배경 카드 기울기 유지
// AI-generated with GPT-6, Claude Opus 5.5, 2026-11-28, reviewed by Haechan Jung, Jaemin Kim
// Changed: 홈 추천 카드 앞면(Suggestion: 시도할 것·이유)과 뒷면(준비 팁: 재료·준비 방법) 표시

import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, Text, View } from 'react-native';
import type { Suggestion } from '../../../types/suggestionRecord';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { suggestionCopyFor } from '../../../util/strings';
import { suggestionStyles as s } from '../screens/suggestionStyles';

type Props = {
  item: Suggestion;
  language: Language;
  disabled: boolean;
  onSave: () => void;
  onDismiss: () => void;
};
export function RecommendationCard(p: Props) {
  const [details, setDetails] = useState(false);
  const [direction, setDirection] = useState<'saved' | 'dismissed' | null>(null);
  const [x] = useState(() => new Animated.Value(0));
  const [rotation] = useState(() => new Animated.Value(0));
  const [flipping, setFlipping] = useState(false);
  const flipInProgress = useRef(false);
  const c = suggestionCopyFor(p.language);
  const sections = details
    ? [[c.ingredient, p.item.ingredients.join(', ')], [c.preparationMethod, p.item.servingTip]]
    : [[c.what, p.item.whatToTry], [c.why, p.item.whyThisMayHelp]];
  useEffect(() => {
    if (!flipping) return;
    let active = true;
    const finish = () => {
      if (!active) return;
      rotation.setValue(0);
      flipInProgress.current = false;
      setFlipping(false);
    };
    let animation = Animated.timing(rotation, {
      toValue: 90, duration: 120, useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (!active) return;
      if (!finished) {
        finish();
        return;
      }
      setDetails((old) => !old);
      rotation.setValue(-90);
      animation = Animated.timing(rotation, {
        toValue: 0, duration: 120, useNativeDriver: true,
      });
      animation.start(finish);
    });
    return () => {
      active = false;
      animation.stop();
    };
  }, [flipping, rotation]);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          !p.disabled && !flipping && Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6,
        onPanResponderMove: (_, g) => {
          x.setValue(g.dx);
          setDirection(g.dx < 0 ? 'dismissed' : 'saved');
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: () => {
          Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
          setDirection(null);
        },
        onPanResponderRelease: (_, g) => {
          x.setValue(0);
          setDirection(null);
          if (Math.abs(g.dx) >= 100 || (Math.abs(g.dx) > 40 && Math.abs(g.vx) > 0.65)) {
            if (g.dx > 0) p.onSave();
            else p.onDismiss();
          }
        },
      }),
    [p, x, flipping],
  );
  const flip = () => {
    if (p.disabled || flipInProgress.current) return;
    flipInProgress.current = true;
    setFlipping(true);
  };
  return (
    <View style={[s.cardStack, { flexGrow: 1 }]}>
      <Animated.View
        {...pan.panHandlers}
        style={{ flex: 1, transform: [{ translateX: x }] }}
      >
        {/* Only the empty surface rotates; text never enters a 3D-transformed layer. */}
        <Animated.View
          pointerEvents="none"
          accessible={false}
          style={[
            s.stackFace,
            {
              position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
              backgroundColor: x.interpolate({
                inputRange: [-120, 0, 120],
                outputRange: [colors.safetySurface, colors.surface, colors.successSurface],
                extrapolate: 'clamp',
              }),
              transform: flipping ? [
                { perspective: 1000 },
                {
                  rotateY: rotation.interpolate({
                    inputRange: [-90, 0, 90],
                    outputRange: ['-90deg', '0deg', '90deg'],
                  }),
                },
              ] : [],
            },
          ]}
        />
        <Animated.View style={{
          flex: 1,
          paddingHorizontal: 18,
          paddingVertical: 16,
          gap: 10,
          opacity: rotation.interpolate({
            inputRange: [-90, 0, 90],
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          }),
        }}>
          <Text style={s.cardPosition}>{c.count}</Text>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={details ? c.tapFront : c.tapDetails}
              disabled={p.disabled || flipping}
              onPress={flip}
              style={{ flexGrow: 1 }}
            >
              <Text style={s.cardTitle}>{details ? c.preparationTip : c.title}</Text>
              {sections.map(([label, value], index) => <View key={label} style={s.cardSection}>
                <Text style={s.cardSectionLabel}>{label}</Text>
                <Text style={!details && index === 0 ? s.cardActionText : s.cardBodyText}>{value}</Text>
              </View>)}
            </Pressable>
          </ScrollView>
          <Pressable accessibilityRole="button" disabled={p.disabled || flipping} onPress={flip}>
            <Text style={[s.link, { textAlign: 'right' }]}>
              {direction === 'saved'
                ? c.swipeSave
                : direction === 'dismissed'
                  ? c.swipeDismiss
                  : details
                    ? c.tapFront
                    : c.tapDetails}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
