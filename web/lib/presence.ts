'use client';

import { useEffect, useState } from 'react';
import { connectSocket } from '@/lib/socket';
import { useAuth } from '@/lib/auth';

export function formatLastSeen(iso?: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const mins = Math.max(0, Math.floor((Date.now() - then) / 60000));
  if (mins < 1) return 'Last seen just now';
  if (mins < 60) return `Last seen ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Last seen yesterday';
  if (days < 7) return `Last seen ${days}d ago`;
  return `Last seen ${new Date(iso).toLocaleDateString()}`;
}

export function usePeerPresence(
  userId?: string,
  initial?: { is_online?: boolean; last_seen_at?: string | null }
) {
  const { token, user } = useAuth();
  const [isOnline, setIsOnline] = useState(Boolean(initial?.is_online));
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(initial?.last_seen_at ?? null);

  useEffect(() => {
    setIsOnline(Boolean(initial?.is_online));
    setLastSeenAt(initial?.last_seen_at ?? null);
  }, [userId, initial?.is_online, initial?.last_seen_at]);

  useEffect(() => {
    if (!user || !userId) return;
    const socket = connectSocket(token);
    const onOnline = (payload: { userId?: string }) => {
      if (payload?.userId === userId) setIsOnline(true);
    };
    const onOffline = (payload: { userId?: string; last_seen_at?: string }) => {
      if (payload?.userId !== userId) return;
      setIsOnline(false);
      if (payload.last_seen_at) setLastSeenAt(payload.last_seen_at);
    };
    const onList = (ids: string[]) => {
      if (Array.isArray(ids)) setIsOnline(ids.includes(userId));
    };
    socket.on('user_online', onOnline);
    socket.on('user_offline', onOffline);
    socket.on('online_users', onList);
    return () => {
      socket.off('user_online', onOnline);
      socket.off('user_offline', onOffline);
      socket.off('online_users', onList);
    };
  }, [user, token, userId]);

  return { isOnline, lastSeenAt };
}
