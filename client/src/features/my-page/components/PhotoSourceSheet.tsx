// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim

import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { AppIcon } from '../../../components/AppIcon';
import type { PhotoSource } from '../../../types/meal';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { styles } from '../screens/myPageStyles';

export function PhotoSourceSheet({
  visible, language, picking, error, onClose, onPick,
}: {
  visible: boolean;
  language: Language;
  picking: boolean;
  error: 'permission' | 'image' | null;
  onClose: () => void;
  onPick: (source: PhotoSource) => void;
}) {
  const s = copyFor(language);
  const m = s.myPage;
  const labels = { camera: s.mealCheckin.camera, gallery: s.mealCheckin.gallery, files: s.mealCheckin.files };
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.photoScrim}>
        <Pressable style={styles.photoDismiss} onPress={onClose} accessibilityRole="button" accessibilityLabel={s.common.close} />
        {(['camera', 'gallery', 'files'] as const).map((source) => (
          <Pressable
            key={source}
            accessibilityRole="button"
            disabled={picking}
            onPress={() => onPick(source)}
            style={styles.photoRow}
          >
            <View style={styles.photoIcon}><AppIcon name={source} size={18} /></View>
            <View style={styles.photoCopy}>
              <Text style={styles.photoLabel}>{labels[source]}</Text>
              {source === 'files' ? <Text style={styles.photoHint}>{s.mealCheckin.fileHint}</Text> : null}
            </View>
            <Feather name="chevron-right" size={18} color={colors.homeMuted} />
          </Pressable>
        ))}
        {picking ? <ActivityIndicator color={colors.homePrimary} /> : null}
        {error ? <Text style={styles.photoError}>{error === 'permission' ? m.photoPermission : m.photoFailed}</Text> : null}
      </View>
    </Modal>
  );
}
