import { useQuery } from '@tanstack/react-query';
import { readHomeRecords } from '../storage/homeStorage';

export const homeKeys = { byChild: (childId: string) => ['home', childId] as const };

export function useHomeRecords(childId: string) {
  return useQuery({ queryKey: homeKeys.byChild(childId), queryFn: () => readHomeRecords(childId), enabled: !!childId });
}
