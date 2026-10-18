// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
import { useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

/** Fill the frame height. Narrow images have side margins; wide images clip at the sides. */
export function HeightFitPhoto({ uri, height, onError }: { uri: string; height: number; onError?: () => void }) {
  const [dimensions, setDimensions] = useState<{ uri: string; ratio: number } | null>(null);
  const ratio = dimensions?.uri === uri ? dimensions.ratio : null;
  return <View style={[styles.frame, { height }]}>
    <Image source={{ uri }} contentFit={ratio ? 'fill' : 'cover'} style={{ width: ratio ? height * ratio : '100%', height }} onLoad={({ source }) => {
      if (source.width > 0 && source.height > 0) setDimensions({ uri, ratio: source.width / source.height });
    }} onError={onError} />
  </View>;
}
const styles = StyleSheet.create({ frame: { width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' } });
