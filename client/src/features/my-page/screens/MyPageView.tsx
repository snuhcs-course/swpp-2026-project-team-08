// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim
// Changed: 마이페이지·자녀 프로필 추가
// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
// Changed: 클라이언트 모델, DTO, DB Schema 통합 및 일관화

import { AppHeader } from '../../../components/AppHeader';
import Feather from '@expo/vector-icons/Feather';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import type { Language } from '../../../types/profile';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { styles } from './myPageStyles';

export function MyPageView({
  language, childName, ageLabel, caregiver, deleteError,
  confirm, busy, onViewProfile, onCaregiver, onLogOut, onDelete, onConfirm, onCancelConfirm,
}: {
  language: Language;
  childName: string;
  ageLabel: string;
  caregiver: string;
  deleteError: boolean;
  confirm: 'logout' | 'delete' | null;
  busy: boolean;
  onViewProfile: () => void;
  onCaregiver: () => void;
  onLogOut: () => void;
  onDelete: () => void;
  onConfirm: () => void;
  onCancelConfirm: () => void;
}) {
  const m = copyFor(language).myPage;
  return (
    <View style={styles.root}>
      <AppHeader title={m.title} />
      <ScrollView contentContainerStyle={[styles.body, styles.content]} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>{m.childProfileSection}</Text>
        <Pressable accessibilityRole="button" onPress={onViewProfile} style={styles.card}>
          <View style={styles.childRow}>
            <View style={styles.avatar}>
              <Feather name="user" size={22} color={colors.homePrimary} />
            </View>
            <View style={styles.childCopy}>
              <Text style={styles.childName}>{childName}</Text>
              <Text style={styles.childAge}>{ageLabel}</Text>
            </View>
            <Text style={styles.link}>{m.viewProfile} {'>'}</Text>
          </View>
        </Pressable>
        <Text style={styles.sectionLabel}>{m.settings}</Text>
        <Pressable accessibilityRole="button" onPress={onCaregiver} style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>{m.caregiverAccount}</Text>
              <Text style={styles.settingSubtitle}>{caregiver}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.homeMuted} />
          </View>
        </Pressable>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>{m.privacyTitle}</Text>
              <Text style={styles.settingSubtitle}>{m.privacySubtitle}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.homeMuted} />
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>{m.helpTitle}</Text>
              <Text style={styles.settingSubtitle}>{m.helpSubtitle}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.homeMuted} />
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable accessibilityRole="button" onPress={onLogOut} style={styles.logoutButton}>
          <Text style={styles.logoutLabel}>{m.logOut}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onDelete}>
          <Text style={styles.delete}>{m.deleteAccount}</Text>
        </Pressable>
        {deleteError ? <Text style={styles.errorText}>{m.deleteFailed}</Text> : null}
      </View>
      <ConfirmDialog
        visible={confirm === 'logout'}
        title={m.logoutTitle}
        body={m.logoutBody}
        cancelLabel={m.cancel}
        confirmLabel={m.logOut}
        busy={busy}
        danger={false}
        onCancel={onCancelConfirm}
        onConfirm={onConfirm}
      />
      <ConfirmDialog
        visible={confirm === 'delete'}
        title={m.deleteTitle}
        body={m.deleteBody}
        cancelLabel={m.cancel}
        confirmLabel={m.delete}
        busy={busy}
        onCancel={onCancelConfirm}
        onConfirm={onConfirm}
      />
    </View>
  );
}
