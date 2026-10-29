// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { AppButton } from './AppButton';
import { Dialog } from './Dialog';
import type { NativeDatePickerProps } from './NativeDatePicker';

export function NativeDatePicker({ value, labels, onChange, onConfirm, onClose }: NativeDatePickerProps) {
  const android = Platform.OS === 'android';
  const picker = <DateTimePicker
    testID="native-date-picker"
    value={value}
    mode="date"
    themeVariant="light"
    display={android ? 'default' : 'spinner'}
    minimumDate={new Date(1900, 0, 1)}
    maximumDate={new Date(2200, 11, 31)}
    locale={android ? undefined : labels.locale}
    onValueChange={(_, date) => android ? onConfirm(date) : onChange(date)}
    onDismiss={onClose}
  />;

  if (android) return picker;

  return <Dialog title={labels.select} closeLabel={labels.close} onClose={onClose}
    footer={<AppButton variant="meal" label={labels.confirm} onPress={() => onConfirm(value)} />}>
    {picker}
  </Dialog>;
}
