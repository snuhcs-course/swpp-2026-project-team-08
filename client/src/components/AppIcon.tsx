// This Code is generated with AI

import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { colors } from '../util/colors';
export const appIcons = {
  back: require('../../assets/meal/back.svg'),
  down: require('../../assets/meal/down.svg'),
  breakfast: require('../../assets/meal/breakfast.svg'),
  lunch: require('../../assets/meal/lunch.svg'),
  dinner: require('../../assets/meal/dinner.svg'),
  snack: require('../../assets/meal/snack.svg'),
  home: require('../../assets/meal/home.svg'),
  restaurant: require('../../assets/meal/restaurant.svg'),
  school: require('../../assets/meal/school.svg'),
  camera: require('../../assets/meal/camera.svg'),
  gallery: require('../../assets/meal/gallery.svg'),
  files: require('../../assets/meal/files.svg'),
  next: require('../../assets/meal/next.svg'),
};
export function AppIcon({
  name,
  size = 20,
}: {
  name: keyof typeof appIcons | 'others';
  size?: number;
}) {
  return name === 'others' ? (
    <Feather name="more-horizontal" size={size} color={colors.homeText} />
  ) : (
    <Image
      source={appIcons[name]}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}
