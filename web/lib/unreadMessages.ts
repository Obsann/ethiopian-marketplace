'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useAuth } from '@/lib/auth';

export function useUnreadMessages(): number {
  const { user, token } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    function load() {
      api<{ unread: number }>('/api/unread-messages', token ? { token } : {})
        .then((r) => setUnread(r.data.unread))
        .catch(() => {
          /* keep last count */
        });
    }
    load();
    const socket = connectSocket(token);
    const onCount = (payload: { unread?: number }) => {
      if (typeof payload?.unread === 'number') setUnread(payload.unread);
    };
    socket.on('unread_count', onCount);
    socket.on('receive_message', load);
    return () => {
      socket.off('unread_count', onCount);
      socket.off('receive_message', load);
    };
  }, [user, token]);

  return unread;
}
