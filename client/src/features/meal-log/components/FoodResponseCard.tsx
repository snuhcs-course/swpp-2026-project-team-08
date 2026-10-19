// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim

import { Feather } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { acceptanceFill, formatDifficultyReason } from '../rules';
import type { FoodResponseCard as Card } from '../types';
import { styles } from '../screens/mealLogStyles';

export function FoodResponseCard({
  card,
  language,
  saved = false,
  defaultOpen = false,
  onToggleSaved,
}: {
  card: Card;
  language: Language;
  saved?: boolean;
  defaultOpen?: boolean;
  onToggleSaved?: (nextSaved: boolean) => void;
}) {
  const s = copyFor(language);
  const m = s.mealLog;
  const review = s.afterMealReview;
  const linked = !!card.suggestion;
  const fill = acceptanceFill(card.outcome);
  const meta = card.kind === 'ingredient' && card.parentName
    ? m.inDish(card.parentName)
    : [card.preparation, card.servingNote].filter((value) => value.trim()).join(' · ');
  const badgeLabel = card.outcome ? review.outcomes[card.outcome] : m.noRecord;
  const eaten = card.outcome === 'eaten';
  const [open, setOpen] = useState(defaultOpen);
  const [showingSuggestion, setShowingSuggestion] = useState(false);
  const [savedOverride, setSavedOverride] = useState<boolean | null>(null);
  const toggled = useRef(false);
  const isSaved = savedOverride ?? saved;

  useEffect(() => {
    if (!toggled.current) setSavedOverride(null);
    else if (savedOverride === saved) {
      toggled.current = false;
      setSavedOverride(null);
    }
  }, [saved, savedOverride]);

  if (showingSuggestion && card.suggestion) {
    return (
      <View style={[styles.foodCard, styles.suggestionBack]}>
        <View style={styles.suggestionHeader}>
          <Text style={styles.suggestionTitle}>{card.name}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSaved ? m.unsaveSuggestion : m.saveSuggestion}
            accessibilityState={{ selected: isSaved }}
            hitSlop={8}
            onPress={() => {
              const next = !isSaved;
              toggled.current = true;
              setSavedOverride(next);
              onToggleSaved?.(next);
            }}
            style={styles.bookmarkButton}
          >
            <MaterialCommunityIcons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isSaved ? colors.bookmarkSaved : colors.homePrimary}
            />
          </Pressable>
        </View>
        <View style={styles.suggestionBlock}>
          <Text style={styles.suggestionLabel}>{m.whatToTry}</Text>
          <Text style={styles.suggestionBody}>{card.suggestion.title}</Text>
        </View>
        <View style={styles.suggestionBlock}>
          <Text style={styles.suggestionLabel}>{m.whyHelp}</Text>
          <Text style={styles.suggestionBody}>{card.suggestion.description}</Text>
        </View>
        <View style={styles.suggestionBlock}>
          <Text style={styles.suggestionLabel}>{m.servingTip}</Text>
          {card.suggestion.servingTip ? (
            <Text style={styles.suggestionBody}>{card.suggestion.servingTip}</Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={m.goBackToMeal}
          onPress={() => setShowingSuggestion(false)}
        >
          <Text style={styles.suggestionBackLink}>← {m.goBackToMeal}</Text>
        </Pressable>
      </View>
    );
  }

  const reasonText = card.reasons
    .map((reason) => formatDifficultyReason(reason, {
      categories: review.categories,
      values: review.values as Record<string, string>,
    }))
    .filter(Boolean)
    .join('\n');

  return (
    <View style={styles.foodCard}>
      <Pressable accessibilityRole="button" onPress={() => setOpen((value) => !value)} style={styles.foodHeader}>
        <Feather name={open ? 'chevron-down' : 'chevron-right'} size={16} color={colors.homeMuted} />
        <Text style={styles.foodName}>{card.name}</Text>
        <View style={[styles.foodBadge, eaten ? styles.reviewed : styles.awaiting]}>
          <Text style={eaten ? styles.reviewedText : styles.awaitingText}>{badgeLabel}</Text>
        </View>
      </Pressable>
      {meta ? <Text style={styles.foodMeta}>{meta}</Text> : null}
      {open ? (
        <>
          {card.ingredients.length ? (
            <View style={styles.chipWrap}>
              {card.ingredients.map((ingredient) => (
                <View key={ingredient} style={styles.ingredientChip}>
                  <Text style={styles.ingredientChipText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.outcomeRow}>
            <Text style={styles.outcomeLabel}>{m.acceptance}</Text>
            <View style={styles.acceptanceTrack}>
              <View style={[styles.acceptanceFill, { width: `${Math.round(fill * 100)}%` }]} />
            </View>
            <Text style={styles.outcomeLabel}>{m.reason}</Text>
            {reasonText ? <Text style={styles.outcomeValue}>{reasonText}</Text> : null}
          </View>
          {linked ? (
            <Pressable accessibilityRole="button" accessibilityLabel={m.linkedSuggestion} onPress={() => setShowingSuggestion(true)}>
              <Text style={styles.flipHint}>{m.linkedSuggestion} →</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
