// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { acceptanceFill } from '../rules';
import type { FoodResponseCard as Card } from '../types';
import { styles } from '../screens/mealLogStyles';

export function FoodResponseCard({
  card,
  language,
  saved = false,
  disabled = false,
  onToggleSaved,
}: {
  card: Card;
  language: Language;
  saved?: boolean;
  disabled?: boolean;
  onToggleSaved?: (nextSaved: boolean) => void;
}) {
  const s = copyFor(language);
  const m = s.mealLog;
  const review = s.afterMealReview;
  const linked = !!card.suggestion;
  const fill = acceptanceFill(card.outcome);
  const meta = [card.preparation, card.servingNote].filter((value) => value.trim()).join(' · ');
  const badgeLabel = card.outcome ? review.outcomes[card.outcome] : m.noRecord;
  const eaten = card.outcome === 'eaten';
  const [showingSuggestion, setShowingSuggestion] = useState(false);
  const isSaved = saved;

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
            disabled={disabled || !onToggleSaved}
            onPress={() => {
              const next = !isSaved;
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

  const body = (
    <>
      <View style={styles.foodHeader}>
        <Text style={styles.foodName}>{card.name}</Text>
        <View style={[styles.foodBadge, eaten ? styles.reviewed : styles.awaiting]}>
          <Text style={eaten ? styles.reviewedText : styles.awaitingText}>{badgeLabel}</Text>
        </View>
      </View>
      {meta ? <Text style={styles.foodMeta}>{meta}</Text> : null}
      {card.ingredients.length ? (
        <View style={styles.chipWrap}>
          {card.ingredients.map((ingredient) => (
            <View key={ingredient} style={styles.ingredientChip}>
              <Text style={styles.ingredientChipText}>{ingredient}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <Text style={styles.outcomeLabel}>{m.acceptance}</Text>
      <View style={styles.acceptanceTrack}>
        <View style={[styles.acceptanceFill, { width: `${Math.round(fill * 100)}%` }]} />
      </View>
      {linked ? <Text style={styles.flipHint}>{m.linkedSuggestion}</Text> : null}
    </>
  );
  if (linked) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={m.linkedSuggestion}
        onPress={() => setShowingSuggestion(true)}
        style={styles.foodCard}
      >
        {body}
      </Pressable>
    );
  }
  return <View style={styles.foodCard}>{body}</View>;
}
