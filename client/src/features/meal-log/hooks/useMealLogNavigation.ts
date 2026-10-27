// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Dismiss the history sheet before pushes, replacements, and back navigation

import { useFocusEffect, useIsFocused, usePreventRemove } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { MealLogSheetHandle } from '../components/MealLogSheetLayout';

export function useMealLogNavigation() {
  const active = useIsFocused();
  const sheetRef = useRef<MealLogSheetHandle>(null);
  const navigating = useRef(false);
  const [leaving, setLeaving] = useState(false);
  useFocusEffect(useCallback(() => {
    navigating.current = false;
    setLeaving(false);
  }, []));

  const dismissAndNavigate = useCallback((action: () => void) => {
    if (navigating.current) return;
    navigating.current = true;
    const finish = () => {
      setLeaving(true);
      action();
    };
    if (sheetRef.current) sheetRef.current.dismiss(finish);
    else finish();
  }, []);

  const disablePrevention = usePreventRemove(
    Platform.OS !== 'web' && active && !leaving,
    ({ repeat }) => dismissAndNavigate(repeat),
  );
  const navigate = useCallback((action: () => void) => {
    dismissAndNavigate(() => {
      disablePrevention();
      action();
    });
  }, [disablePrevention, dismissAndNavigate]);

  return { active, sheetRef, navigate };
}
