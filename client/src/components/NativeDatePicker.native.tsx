// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: 미래 식사 날짜 선택 및 저장 방지
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { AppButton } from './AppButton';
import { Dialog } from './Dialog';
import type { NativeDatePickerProps } from './NativeDatePicker';

export function NativeDatePicker({ value, labels, onChange, onConfirm, onClose }: NativeDatePickerProps) {
  const today = new Date();
  const selected = value > today ? today : value;
  const android = Platform.OS === 'android';
  const picker = <DateTimePicker
    testID="native-date-picker"
    value={selected}
    mode="date"
    themeVariant="light"
    display={android ? 'default' : 'spinner'}
    minimumDate={new Date(1900, 0, 1)}
    maximumDate={today}
    locale={android ? undefined : labels.locale}
    onValueChange={(_, date) => android ? onConfirm(date) : onChange(date)}
    onDismiss={onClose}
  />;

  if (android) return picker;

  return <Dialog title={labels.select} closeLabel={labels.close} onClose={onClose}
    footer={<AppButton variant="meal" label={labels.confirm} onPress={() => onConfirm(selected)} />}>
    {picker}
  </Dialog>;
}
