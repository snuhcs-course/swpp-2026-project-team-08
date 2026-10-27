// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type NativeDropdownProps = {
  options: readonly { id: string; label: string }[];
  value: string;
  label: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fieldStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
};

// Metro selects the native menu on iOS and Android; web keeps its existing dropdowns.
export const NativeDropdown: ComponentType<NativeDropdownProps> = () => null;
