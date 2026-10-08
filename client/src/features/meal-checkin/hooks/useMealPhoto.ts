import { useMealDraft } from '../../../data/queries/mealQueries';

export function useMealPhoto(childId: string, photoId: string) {
  const query = useMealDraft(childId);
  return {
    photo: query.data?.photo?.id === photoId ? query.data.photo : null,
    loading: query.isPending,
  };
}
