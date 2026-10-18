// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim

import Feather from '@expo/vector-icons/Feather';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import type { Language } from '../../../types/profile';
import { styles } from './myPageStyles';

export function CaregiverAccountView({
  language, mode, name, email, newEmail, code, mismatch, updated, canSend, canVerify, onBack,
  onName, onSaveName, onChange, onNewEmail, onSend, onCode, onVerify, onResend,
}: {
  language: Language;
  mode: 'account' | 'change-email' | 'verify';
  name: string;
  email: string;
  newEmail: string;
  code: string;
  mismatch: boolean;
  updated: boolean;
  canSend: boolean;
  canVerify: boolean;
  onBack: () => void;
  onName: (value: string) => void;
  onSaveName: () => void;
  onChange: () => void;
  onNewEmail: (value: string) => void;
  onSend: () => void;
  onCode: (value: string) => void;
  onVerify: () => void;
  onResend: () => void;
}) {
  const s = copyFor(language);
  const m = s.myPage;
  const title = mode === 'verify' ? m.enterCode : mode === 'change-email' ? m.changeEmail : m.caregiverAccount;
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.page, styles.content]} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={s.common.back} onPress={onBack} style={styles.back}>
            <Feather name="chevron-left" size={24} color={colors.homeText} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.headerTitle}>{title}</Text>
        </View>
        {mode === 'account' && updated ? (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>✓ {m.emailUpdated}</Text>
            <Text style={styles.bannerBody}>{m.emailUpdatedBody(email)}</Text>
          </View>
        ) : null}
        {mode === 'account' ? (
          <View style={styles.gap}>
            <View>
              <Text style={styles.fieldLabel}>{m.name}</Text>
              <TextInput
                accessibilityLabel={m.name}
                value={name}
                onChangeText={onName}
                onEndEditing={onSaveName}
                placeholder={m.namePlaceholder}
                placeholderTextColor={colors.homeMuted}
                style={styles.input}
              />
            </View>
            <View>
              <Text style={styles.fieldLabel}>{m.email}</Text>
              <View style={styles.emailField}>
                <Text style={styles.emailValue}>{email}</Text>
                <Pressable accessibilityRole="button" onPress={onChange}>
                  <Text style={styles.link}>{m.change}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
        {mode === 'change-email' ? (
          <View style={styles.gap}>
            <View>
              <Text style={styles.fieldLabel}>{m.currentEmail}</Text>
              <View style={styles.emailField}><Text style={styles.emailValue}>{email}</Text></View>
            </View>
            <View>
              <Text style={styles.fieldLabel}>{m.newEmail}</Text>
              <TextInput
                accessibilityLabel={m.newEmail}
                value={newEmail}
                onChangeText={onNewEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder={m.newEmail}
                placeholderTextColor={colors.homeMuted}
                style={styles.input}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={!canSend}
              onPress={onSend}
              style={[styles.verify, !canSend && styles.verifyOff]}
            >
              <Text style={styles.verifyLabel}>{m.sendCode}</Text>
            </Pressable>
          </View>
        ) : null}
        {mode === 'verify' ? (
          <View>
            <Text style={styles.codeSent}>{m.codeSent(newEmail)}</Text>
            <View style={styles.codeWrap}>
              <View style={styles.codeRow} pointerEvents="none">
                {Array.from({ length: 6 }, (_, index) => (
                  <View key={index} style={[styles.codeBox, mismatch && styles.codeBoxError]}>
                    <Text style={styles.codeDigit}>{code[index] ?? ''}</Text>
                  </View>
                ))}
              </View>
              <TextInput
                accessibilityLabel={m.enterCode}
                value={code}
                onChangeText={(value) => onCode(value.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                caretHidden
                style={styles.codeInput}
              />
            </View>
            {mismatch ? <Text style={styles.errorText}>{m.codeMismatch}</Text> : null}
            <Pressable accessibilityRole="button" onPress={onResend}>
              <Text style={styles.resend}>{m.resend}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!canVerify}
              onPress={onVerify}
              style={[styles.verify, !canVerify && styles.verifyOff]}
            >
              <Text style={styles.verifyLabel}>{m.verify}</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
