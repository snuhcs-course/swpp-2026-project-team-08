// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim

import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PhotoSource } from '../../../types/meal';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { copyFor, optionsFor } from '../../../util/strings';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PhotoSourceSheet } from '../components/PhotoSourceSheet';
import { styles } from './myPageStyles';

export function ChildProfileView({
  language, editing, childName, ageRange, photoUri, allergies, familyFoods, safeFoods,
  picking, saving, saveError, photoError, photoOpen, deleteError, confirm, busy,
  onBack, onEdit, onSave, onName, onAge, onOpenPhoto, onClosePhoto, onPick,
  onAllergies, onFamily, onSafeFoods, onLogOut, onDelete, onConfirm, onCancelConfirm,
}: {
  language: Language;
  editing: boolean;
  childName: string;
  ageRange: string;
  photoUri: string | null;
  allergies: string;
  familyFoods: string;
  safeFoods: string;
  picking: boolean;
  saving: boolean;
  saveError: boolean;
  photoError: 'permission' | 'image' | null;
  photoOpen: boolean;
  deleteError: boolean;
  confirm: 'logout' | 'delete' | null;
  busy: boolean;
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onName: (value: string) => void;
  onAge: (value: string) => void;
  onOpenPhoto: () => void;
  onClosePhoto: () => void;
  onPick: (source: PhotoSource) => void;
  onAllergies: () => void;
  onFamily: () => void;
  onSafeFoods: () => void;
  onLogOut: () => void;
  onDelete: () => void;
  onConfirm: () => void;
  onCancelConfirm: () => void;
}) {
  const copy = copyFor(language);
  const m = copy.myPage;
  const ages = optionsFor('age', language);
  const ageLabel = ages.find((option) => option.id === ageRange)?.label ?? ageRange;
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.page, styles.content]} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={copyFor(language).common.back} onPress={onBack} style={styles.back}>
            <Feather name="chevron-left" size={24} color={colors.homeText} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.headerTitle}>{m.childProfile}</Text>
        </View>
        <View style={styles.card}>
          {editing ? (
            <>
              <Pressable accessibilityRole="button" onPress={onOpenPhoto} style={styles.uploadRow}>
                <View style={styles.avatar}>
                  {photoUri
                    ? <Image source={{ uri: photoUri }} style={styles.avatarImage} />
                    : <Feather name="user" size={22} color={colors.homePrimary} />}
                </View>
                <Text style={styles.uploadLabel}>{m.uploadPhoto}</Text>
                <Feather name="upload" size={16} color={colors.homePrimary} />
              </Pressable>
              <Text style={styles.fieldLabel}>{m.childName}</Text>
              <TextInput
                accessibilityLabel={m.childName}
                value={childName}
                onChangeText={onName}
                style={styles.input}
              />
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>{m.ageGroup}</Text>
              <AgeDropdown value={ageRange} label={ageLabel} options={ages} onChange={onAge} />
              {saveError ? <Text style={styles.errorText}>{copy.common.saveFailed}</Text> : null}
              <Pressable
                accessibilityRole="button"
                onPress={onSave}
                disabled={saving || picking}
                style={[styles.save, (saving || picking) && styles.saveOff]}
              >
                <Text style={styles.saveLabel}>{saving ? copy.common.saving : m.save}</Text>
                <Feather name="check" size={14} color={colors.surface} />
              </Pressable>
            </>
          ) : (
            <View style={styles.childRow}>
              <View style={styles.avatar}>
                {photoUri
                  ? <Image source={{ uri: photoUri }} style={styles.avatarImage} />
                  : <Feather name="user" size={22} color={colors.homePrimary} />}
              </View>
              <View style={styles.childCopy}>
                <Text style={styles.childName}>{childName}</Text>
                <Text style={styles.childAge}>{ageLabel}</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={onEdit} style={styles.editLink}>
                <Text style={styles.link}>{m.edit}</Text>
                <Feather name="edit-2" size={13} color={colors.homePrimary} />
              </Pressable>
            </View>
          )}
        </View>
        <SummaryCard icon="shield" title={m.allergies} body={allergies} onPress={onAllergies} />
        <SummaryCard icon="users" title={m.familyFoods} body={familyFoods} onPress={onFamily} />
        <SummaryCard icon="heart" title={m.safeFoods} body={safeFoods} onPress={onSafeFoods} />
      </ScrollView>
      {!editing ? (
        <View style={styles.footer}>
          <Pressable accessibilityRole="button" onPress={onLogOut} style={styles.logoutButton}>
            <Text style={styles.logoutLabel}>{m.logOut}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onDelete}>
            <Text style={styles.delete}>{m.deleteAccount}</Text>
          </Pressable>
          {deleteError ? <Text style={styles.errorText}>{m.deleteFailed}</Text> : null}
        </View>
      ) : null}
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
      <PhotoSourceSheet
        visible={photoOpen}
        language={language}
        picking={picking}
        error={photoError}
        onClose={onClosePhoto}
        onPick={onPick}
      />
    </SafeAreaView>
  );
}

function AgeDropdown({
  value, label, options, onChange,
}: {
  value: string;
  label: string;
  options: { id: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((current) => !current)}
        style={[styles.emailField, open && styles.inputOn]}
      >
        <Text style={styles.emailValue}>{label}</Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.homeMuted} />
      </Pressable>
      {open ? (
        <View style={styles.ageOptions}>
          {options.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              onPress={() => { onChange(option.id); setOpen(false); }}
              style={[styles.ageOption, value === option.id && styles.ageOptionOn]}
            >
              <Text style={[styles.ageOptionText, value === option.id && styles.ageOptionTextOn]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function SummaryCard({
  icon, title, body, onPress,
}: {
  icon: 'shield' | 'users' | 'heart';
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryIcon}>
          <Feather name={icon} size={16} color={colors.homePrimary} />
        </View>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryTitle}>{title}</Text>
          <Text style={styles.summaryBody}>{body}</Text>
        </View>
        <Feather name="external-link" size={16} color={colors.homeMuted} />
      </View>
    </Pressable>
  );
}
