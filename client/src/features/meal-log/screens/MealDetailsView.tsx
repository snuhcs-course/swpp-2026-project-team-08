// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { BottomSheet } from '../../../components/BottomSheet';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { FoodResponseCard } from '../components/FoodResponseCard';
import type { FoodResponseCard as Card } from '../types';
import { styles } from './mealLogStyles';

type Props = {
  language: Language;
  heading: string;
  beforeUri: string | null;
  afterUri: string | null;
  awaitingReview: boolean;
  cards: Card[];
  loading: boolean;
  error: boolean;
  deleting: boolean;
  deleteError: boolean;
  onBack: () => void;
  onContinueReview: () => void;
  onRetry: () => void;
  onDelete: () => void;
};

export function MealDetailsView(p: Props) {
  const s = copyFor(p.language);
  const m = s.mealLog;
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={s.common.back} onPress={p.onBack} style={styles.iconButton}>
          <Feather name="chevron-left" size={20} color={colors.homeText} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>{m.mealDetails}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={m.more} onPress={() => setMenuOpen(true)} style={styles.iconButton}>
          <Feather name="more-horizontal" size={20} color={colors.homeText} />
        </Pressable>
      </View>
      {p.loading ? (
        <View style={styles.state}>
          <ActivityIndicator color={colors.homePrimary} />
          <Text style={styles.stateText}>{s.common.loading}</Text>
        </View>
      ) : p.error || !p.heading ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>{m.loadFailed}</Text>
          <AppButton label={s.common.retry} onPress={p.onRetry} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {p.awaitingReview ? (
            <AppButton variant="meal" label={m.continueReview} onPress={p.onContinueReview} />
          ) : null}
          <Text style={styles.heading}>{p.heading}</Text>
          <View style={styles.photos}>
            <View style={styles.photoFrame}>
              {p.beforeUri
                ? <Image source={{ uri: p.beforeUri }} style={styles.photo} contentFit="cover" />
                : <View style={styles.photoEmpty}><Text style={styles.foodMeta}>{m.noRecord}</Text></View>}
              <Text style={styles.photoLabel}>{m.beforeImage}</Text>
            </View>
            <View style={styles.photoFrame}>
              {p.afterUri
                ? <Image source={{ uri: p.afterUri }} style={styles.photo} contentFit="cover" />
                : <View style={styles.photoEmpty}><Text style={styles.foodMeta}>{m.noRecord}</Text></View>}
              <Text style={styles.photoLabel}>{m.afterImage}</Text>
            </View>
          </View>
          <Text style={styles.sectionLabel}>{m.foodsAndResponses}</Text>
          {p.cards.map((card) => (
            <FoodResponseCard key={card.foodId} card={card} language={p.language} />
          ))}
        </ScrollView>
      )}
      {menuOpen ? (
        <BottomSheet title={m.more} closeLabel={s.common.close} onClose={() => setMenuOpen(false)}>
          <Pressable
            accessibilityRole="button"
            onPress={() => { setMenuOpen(false); setConfirmOpen(true); }}
            style={styles.menuItem}
          >
            <Text style={styles.menuDanger}>{m.deleteMeal}</Text>
          </Pressable>
        </BottomSheet>
      ) : null}
      {confirmOpen ? (
        <BottomSheet
          title={m.deleteTitle}
          closeLabel={s.common.close}
          variant="dialog"
          onClose={() => { if (!p.deleting) setConfirmOpen(false); }}
          footer={(
            <View style={styles.deleteActions}>
              <AppButton
                secondary
                label={m.cancel}
                disabled={p.deleting}
                onPress={() => setConfirmOpen(false)}
                style={styles.deleteAction}
              />
              <AppButton
                label={p.deleting ? s.common.saving : m.delete}
                disabled={p.deleting}
                onPress={p.onDelete}
                style={styles.deleteAction}
              />
            </View>
          )}
        >
          <Text style={styles.deleteBody}>{m.deleteBody(p.heading)}</Text>
          {p.deleteError ? <Text style={styles.deleteBody}>{m.deleteFailed}</Text> : null}
        </BottomSheet>
      ) : null}
    </SafeAreaView>
  );
}
