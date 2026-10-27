// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가

import { Modal, Pressable, Text, View } from 'react-native';
import { styles } from '../screens/myPageStyles';

export function ConfirmDialog({
  visible, title, body, cancelLabel, confirmLabel, busy, danger = true, onCancel, onConfirm,
}: {
  visible: boolean;
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  busy?: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <Pressable style={styles.dialogScrim} onPress={busy ? undefined : onCancel}>
        <Pressable style={styles.dialogCard} onPress={() => undefined}>
          <View style={styles.dialogCopy}>
            <Text style={styles.dialogTitle}>{title}</Text>
            <Text style={styles.dialogBody}>{body}</Text>
          </View>
          <View style={styles.dialogActions}>
            <Pressable
              accessibilityRole="button"
              onPress={busy ? undefined : onCancel}
              style={[styles.dialogButton, styles.dialogSplit]}
            >
              <Text style={styles.dialogCancel}>{cancelLabel}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={busy ? undefined : onConfirm} style={styles.dialogButton}>
              <Text style={danger ? styles.dialogDanger : styles.dialogCancel}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
