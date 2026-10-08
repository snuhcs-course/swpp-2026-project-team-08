import { useHomeRecords } from '../../../data/queries/homeQueries';
import type { ChildProfile } from '../../../types/profile';
import { visibleHomeData } from '../rules';

export function useSuggestion(profile: ChildProfile, id: string) {
  const query = useHomeRecords(profile.id);
  const item = query.data
    ? visibleHomeData(query.data, profile).suggestions.find((suggestion) => suggestion.id === id)
    : undefined;
  return { item, loading: query.isPending, error: query.isError, ready: query.isSuccess };
}
