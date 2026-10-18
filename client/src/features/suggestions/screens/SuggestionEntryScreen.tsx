// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import { ActivityIndicator, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSuggestionEntry } from '../hooks/useSuggestionEntry';
import { useProfile } from '../../../providers/ProfileProvider';
import { SuggestionScreen } from '../../home/screens/SuggestionScreen';
import { SavedSuggestionsScreen } from './SavedSuggestionsScreen';
import { AppButton } from '../../../components/AppButton';
import { suggestionCopyFor } from '../../../util/strings';
import { suggestionStyles as s } from './suggestionStyles';

export function SuggestionEntryScreen({
  id,
  mealId,
  tryMealId,
}: {
  id: string;
  mealId?: string;
  tryMealId?: string;
}) {
  const profile = useProfile();
  const { query: detail, legacy } = useSuggestionEntry(profile.profile?.id ?? '', id);
  const c = suggestionCopyFor(profile.language);
  if (profile.status === 'loading') return <View style={s.root} />;
  if (!profile.profile) return <Redirect href="/" />;
  if (legacy) return <SuggestionScreen id={id} mealId={mealId} />;
  if (detail.isPending)
    return (
      <View style={s.center}>
        <ActivityIndicator />
      </View>
    );
  if (detail.isError)
    return (
      <View style={s.center}>
        <Text style={s.error}>{c.loadFailed}</Text>
        <AppButton
          label={c.retry}
          onPress={() => {
            void detail.refetch();
          }}
        />
      </View>
    );
  return <SavedSuggestionsScreen initialId={id} tryMealId={tryMealId} />;
}
