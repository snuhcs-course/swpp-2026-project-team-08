// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
import type { ComponentType } from 'react';

export type NativeDatePickerProps = {
  value: Date;
  labels: { select: string; close: string; confirm: string; locale: string };
  onChange: (date: Date) => void;
  onConfirm: (date: Date) => void;
  onClose: () => void;
};

// Metro loads the native implementation on iOS and Android.
export const NativeDatePicker: ComponentType<NativeDatePickerProps> = () => null;
