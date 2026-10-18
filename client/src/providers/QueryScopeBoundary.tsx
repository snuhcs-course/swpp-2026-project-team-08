// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useProfile } from './ProfileProvider';

/** Discard the previous child's queries on profile change and all queries on account change. */
export function QueryScopeBoundary() {
  const client = useQueryClient();
  const { session } = useAuth();
  const { profile } = useProfile();
  const previous = useRef<{ user: string | null; child: string | null } | null>(null);
  const user = session?.user.id ?? null;
  const child = profile?.id ?? null;
  useEffect(() => {
    const old = previous.current;
    previous.current = { user, child };
    if (!old || (old.user === user && old.child === child)) return;
    if (old.user !== user) {
      void client.cancelQueries();
      client.clear();
    } else if (old.child) {
      const predicate = (query: { queryKey: readonly unknown[] }) =>
        query.queryKey.includes(old.child);
      void client.cancelQueries({ predicate });
      client.removeQueries({ predicate });
    }
  }, [user, child, client]);
  return null;
}
