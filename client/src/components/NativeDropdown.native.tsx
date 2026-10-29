// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
import { MenuView } from '@expo/ui/community/menu';
import { View } from 'react-native';
import type { NativeDropdownProps } from './NativeDropdown';

export function NativeDropdown({ options, value, label, onChange, disabled = false, style, fieldStyle, children }: NativeDropdownProps) {
  const unavailable = disabled || options.length === 0;
  const field = <View accessible accessibilityRole="button" accessibilityLabel={label}
    accessibilityValue={{ text: options.find(option => option.id === value)?.label ?? value }}
    accessibilityState={{ disabled: unavailable }} style={fieldStyle}>
    {children}
  </View>;

  if (unavailable) return <View style={style}>{field}</View>;

  return <MenuView style={style} title={label} shouldOpenOnLongPress={false}
    actions={options.map(option => ({ id: option.id, title: option.label, state: option.id === value ? 'on' : 'off' }))}
    onPressAction={({ nativeEvent: { event } }) => {
      if (options.some(option => option.id === event)) onChange(event);
    }}>
    {field}
  </MenuView>;
}
