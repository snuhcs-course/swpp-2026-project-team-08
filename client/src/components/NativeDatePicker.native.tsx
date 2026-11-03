// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: 오늘 상한 및 네이티브 날짜 선택기의 UTC 전달·해석
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { AppButton } from './AppButton';
import { Dialog } from './Dialog';
import type { NativeDatePickerProps } from './NativeDatePicker';

export function NativeDatePicker({ value, labels, onChange, onConfirm, onClose }: NativeDatePickerProps) {
  // Encode calendar components as UTC only at the native picker boundary.
  const pickerDate = (date: Date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const android = Platform.OS === 'android';
  const picker = <DateTimePicker
    testID="native-date-picker"
    value={pickerDate(value)}
    timeZoneName="UTC"
    mode="date"
    themeVariant="light"
    display={android ? 'default' : 'spinner'}
    minimumDate={new Date(Date.UTC(1900, 0, 1))}
    maximumDate={pickerDate(new Date())}
    locale={android ? undefined : labels.locale}
    onValueChange={(_, date) => {
      const selected = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
      if (android) onConfirm(selected);
      else onChange(selected);
    }}
    onDismiss={onClose}
  />;

  if (android) return picker;

  return <Dialog title={labels.select} closeLabel={labels.close} onClose={onClose}
    footer={<AppButton variant="meal" label={labels.confirm} onPress={() => onConfirm(value)} />}>
    {picker}
  </Dialog>;
}
