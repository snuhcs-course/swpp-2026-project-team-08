// AI-generated with GPT-6, 2026-11-24, reviewed by Seoyeon Heo
// Changed: 식사 초안 삭제 및 실행 취소
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { deleteMealDraft, restoreMealDraft } from '../storage/mealStorage';
import { mealKeys } from './mealQueryKeys';
import type { MealDraft } from '../../types/meal';

export function useDeleteMealDraft(childId: string) {
  const client = useQueryClient();
  const [removed, setRemoved] = useState<MealDraft | null>(null);
  const [error, setError] = useState<'delete' | 'undo' | null>(null);
  const busy = useRef(false);
  useEffect(() => {
    if (!removed) return;
    const timer = setTimeout(() => setRemoved(null), 6000);
    return () => clearTimeout(timer);
  }, [removed]);
  const remove = async (draft: MealDraft) => {
    if (busy.current) return false;
    busy.current = true;
    try {
      await deleteMealDraft(childId);
      client.setQueryData(mealKeys.draft(childId), null);
      setError(null); setRemoved(draft);
      return true;
    } catch { setError('delete'); return false; }
    finally { busy.current = false; }
  };
  const undo = async () => {
    if (!removed || removed.childId !== childId || busy.current) return false;
    busy.current = true;
    try {
      await restoreMealDraft(removed);
      client.setQueryData(mealKeys.draft(childId), removed);
      setRemoved(null); setError(null);
      return true;
    } catch { setError('undo'); return false; }
    finally { busy.current = false; }
  };
  return { removed: removed?.childId === childId ? removed : null, error, remove, undo };
}
