// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FoodTraitsTags } from '../../../components/FoodTraitsTags';
import type { Language } from '../../../types/profile';
import { copyFor } from '../../../util/strings';
import type { FoodResponseCard as Card } from '../types';
import { styles } from '../screens/mealLogStyles';

export function FoodResponseCard({
  card,
  language,
}: {
  card: Card;
  language: Language;
}) {
  const [flipped, setFlipped] = useState(false);
  const s = copyFor(language);
  const m = s.mealLog;
  const review = s.afterMealReview;
  const canFlip = !!card.suggestion;
  if (flipped && card.suggestion) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={m.goBackToMeal}
        onPress={() => setFlipped(false)}
        style={[styles.foodCard, styles.suggestionBack]}
      >
        <Text style={styles.continueEyebrow}>{m.linkedSuggestion}</Text>
        <Text style={styles.foodName}>{card.suggestion.title}</Text>
        <View style={styles.outcomeRow}>
          <Text style={styles.outcomeLabel}>{m.whatToTry}</Text>
          <Text style={styles.outcomeValue}>{card.suggestion.title}</Text>
        </View>
        <View style={styles.outcomeRow}>
          <Text style={styles.outcomeLabel}>{m.whyHelp}</Text>
          <Text style={styles.foodMeta}>{card.suggestion.description}</Text>
        </View>
        <View style={styles.outcomeRow}>
          <Text style={styles.outcomeLabel}>{m.servingTip}</Text>
          <Text style={styles.foodMeta}>{card.suggestion.servingTip ?? review.noServingTip}</Text>
        </View>
        <Text style={styles.flipHint}>{m.goBackToMeal}</Text>
      </Pressable>
    );
  }
  const body = (
    <>
      <Text style={styles.foodName}>{card.name}</Text>
      <Text style={styles.foodMeta}>
        {s.mealCheckin.ingredients}: {card.ingredients.join(', ') || s.common.notEntered}
      </Text>
      <FoodTraitsTags
        traits={card.traits}
        labels={{
          trait: (value) => s.mealCheckin.traitLabels[value as keyof typeof s.mealCheckin.traitLabels] ?? value,
          empty: s.common.none,
        }}
      />
      <View style={styles.outcomeRow}>
        <Text style={styles.outcomeLabel}>{m.acceptance}</Text>
        <Text style={styles.outcomeValue}>
          {card.outcome ? review.outcomes[card.outcome] : m.noRecord}
        </Text>
      </View>
      <View style={styles.outcomeRow}>
        <Text style={styles.outcomeLabel}>{m.reason}</Text>
        <Text style={styles.foodMeta}>
          {card.reasons.length
            ? card.reasons.map((tag) => {
              const category = review.categories[tag.category as keyof typeof review.categories] ?? tag.category;
              const value = review.values[tag.value as keyof typeof review.values] ?? tag.value;
              return tag.note ? `${category}: ${value} (${tag.note})` : `${category}: ${value}`;
            }).join('\n')
            : m.noRecord}
        </Text>
      </View>
      {canFlip ? <Text style={styles.flipHint}>{m.linkedSuggestion}</Text> : null}
    </>
  );
  if (!canFlip) return <View style={styles.foodCard}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={m.linkedSuggestion}
      onPress={() => setFlipped(true)}
      style={styles.foodCard}
    >
      {body}
    </Pressable>
  );
}
