'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/** Returns count of pending changes. Updates in real time via Supabase Realtime. */
export function usePendingChangeCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    // Initial count
    supabase
      .from('pending_changes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => setCount(count ?? 0));

    // Subscribe to inserts and updates on pending_changes
    const channel = supabase
      .channel('pending-changes-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pending_changes' },
        () => {
          supabase
            .from('pending_changes')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')
            .then(({ count }) => setCount(count ?? 0));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}
