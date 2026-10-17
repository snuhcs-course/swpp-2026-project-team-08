// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import { useEffect, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import type { Language } from '../../../types/profile';
import { suggestionCopyFor } from '../../../util/strings';
import { suggestionStyles as s } from '../screens/suggestionStyles';

export function RecommendationStateCard({ language, failed, onRetry }: {
  language: Language;
  failed?: boolean;
  onRetry: () => void;
}) {
  const c = suggestionCopyFor(language);
  const [spin] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (failed) return;
    const animation = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true }));
    animation.start();
    return () => animation.stop();
  }, [failed, spin]);
  return <View style={s.cardStack}>
    <View style={[s.stackLayer, s.stackBack]} />
    <View style={[s.stackLayer, s.stackMiddle]} />
    <View style={[s.stackFace, s.stateCard]}>
      <View style={[s.stateIcon, !failed && s.loaderIcon]}>
        {failed ? <UiAssetIcon name="suggestion-alert" /> : <Animated.View style={{ transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}><UiAssetIcon name="suggestion-loader" /></Animated.View>}
      </View>
      <View style={s.stack}>
        <Text style={[s.heading, s.centeredText]}>{failed ? c.generationTitle : c.generating}</Text>
        <Text style={[s.savedIntro, s.centeredText]}>{failed ? c.generationDetail : c.generatingDetail}</Text>
      </View>
      {failed ? <AppButton variant="suggestion" style={s.fullWidth} label={c.retry} onPress={onRetry} />
        : <View style={s.loadingTrack}><View style={s.loadingSegment} /></View>}
    </View>
  </View>;
}
