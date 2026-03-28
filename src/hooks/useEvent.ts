import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ChouEvent } from '../types';

export function useEvent(eventId: string | undefined) {
  const [event, setEvent] = useState<ChouEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      setError('イベントIDが指定されていません');
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'events', eventId),
      (snap) => {
        if (snap.exists()) {
          setEvent({ id: snap.id, ...snap.data() } as ChouEvent);
        } else {
          setError('イベントが見つかりません');
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [eventId]);

  return { event, loading, error };
}
