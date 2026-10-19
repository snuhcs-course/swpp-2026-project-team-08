// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
import { AppHeader } from '../../../components/AppHeader';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { FoodResponseCard } from '../components/FoodResponseCard';
import type { FoodResponseCard as Card } from '../types';
import { styles } from './mealLogStyles';

type Props = {
  language: Language;
  heading: string;
  deleteLine: string;
  beforeUri: string | null;
  afterUri: string | null;
  awaitingReview: boolean;
  cards: Card[];
  loading: boolean;
  error: boolean;
  deleting: boolean;
  deleteError: boolean;
  suggestionSaveError?: boolean;
  savingSuggestion?: boolean;
  savedSuggestionIds: string[];
  onBack: () => void;
  onContinueReview: () => void;
  onToggleSaved: (card: Card, saved: boolean) => void;
  onRetry: () => void;
  onDelete: () => void;
};

function PhotoTile({ uri, label }: { uri: string | null; label: string }) {
  return (
    <View style={styles.photoTile}>
      <View style={styles.photoWell}>
        {uri
          ? <Image source={{ uri }} style={styles.photo} contentFit="cover" />
          : <Feather name="image" size={28} color={colors.homeMuted} />}
      </View>
      <Text style={styles.photoCaption}>{label}</Text>
    </View>
  );
}

// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
export function MealDetailsView(p: Props) {
  const s = copyFor(p.language);
  const m = s.mealLog;
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <AppHeader title={m.mealDetails} backLabel={s.common.back} onBack={p.onBack} accessory={
        <Pressable accessibilityRole="button" accessibilityLabel={m.more} onPress={() => setMenuOpen(true)} style={styles.iconButton}>
          <Feather name="more-vertical" size={18} color={colors.homeText} />
        </Pressable>
      } />
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
          <Text style={styles.detailDate}>{p.heading}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.badge, p.awaitingReview ? styles.awaiting : styles.reviewed]}>
              <Text style={p.awaitingReview ? styles.awaitingText : styles.reviewedText}>
                {p.awaitingReview ? m.awaitingReview : m.reviewed}
              </Text>
            </View>
            {p.awaitingReview ? (
              <Pressable accessibilityRole="button" onPress={p.onContinueReview} style={styles.continueReview}>
                <Text style={styles.continueReviewLabel}>{m.continueReview}</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.photos}>
            <PhotoTile uri={p.beforeUri} label={m.beforeImage} />
            <PhotoTile uri={p.afterUri} label={m.afterImage} />
          </View>
          <Text style={styles.foodsLabel}>{m.foodsAndResponses}</Text>
          {p.suggestionSaveError && <Text accessibilityRole="alert" style={styles.deleteBody}>{s.common.saveFailed}</Text>}
          {p.cards.map((card, index) => (
            <FoodResponseCard
              key={card.foodId}
              card={card}
              language={p.language}
              disabled={p.savingSuggestion}
              defaultOpen={index === 0}
              saved={!!card.suggestion && p.savedSuggestionIds.includes(card.suggestion.id)}
              onToggleSaved={card.suggestion ? (saved) => p.onToggleSaved(card, saved) : undefined}
            />
          ))}
        </ScrollView>
      )}
      <Modal transparent animationType="none" visible={menuOpen} onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuScrim} onPress={() => setMenuOpen(false)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={m.deleteMeal}
            onPress={() => { setMenuOpen(false); setConfirmOpen(true); }}
            style={styles.menuPopover}
          >
            <Feather name="trash-2" size={14} color={colors.error} />
            <Text style={styles.menuDanger}>{m.deleteMeal}</Text>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal transparent animationType="fade" visible={confirmOpen} onRequestClose={() => { if (!p.deleting) setConfirmOpen(false); }}>
        <View style={styles.dialogScrim}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{m.deleteTitle}</Text>
            <Text style={styles.deleteBody}>{m.deleteBody(p.deleteLine)}</Text>
            {p.deleteError ? <Text style={styles.deleteBody}>{m.deleteFailed}</Text> : null}
            <View style={styles.deleteActions}>
              <Pressable
                accessibilityRole="button"
                disabled={p.deleting}
                onPress={() => setConfirmOpen(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelLabel}>{m.cancel}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={p.deleting}
                onPress={p.onDelete}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteLabel}>{p.deleting ? s.common.saving : m.delete}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
