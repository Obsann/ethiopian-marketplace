'use client';

import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useAuth } from '@/lib/auth';
import { usePeerPresence } from '@/lib/presence';
import type { Message } from '@/types';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import { SellerPresence } from './SellerPresence';

function messageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ListingChat({
  listingId,
  sellerId,
  peerId,
  peerName,
  variant = 'card',
  initialOnline,
  initialLastSeen,
}: {
  listingId: string;
  sellerId: string;
  peerId: string;
  peerName?: string;
  variant?: 'card' | 'full';
  initialOnline?: boolean;
  initialLastSeen?: string | null;
}) {
  const { user, token } = useAuth();
  const [thread, setThread] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [peerTyping, setPeerTyping] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isOnline, lastSeenAt } = usePeerPresence(peerId, {
    is_online: initialOnline,
    last_seen_at: initialLastSeen,
  });

  useEffect(() => {
    if (!user || !peerId) return;
    api<Message[]>(`/api/messages/${listingId}?with=${peerId}`, token ? { token } : {})
      .then((r) => setThread(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load chat'));
  }, [user, token, listingId, peerId]);

  useEffect(() => {
    if (!user || !peerId) return;
    const socket = connectSocket(token);
    socket.emit('join_room', { listingId, peerId });
    socket.emit('mark_read', { listingId, peerId });

    const onMessage = (incoming: Message) => {
      if (incoming.listing_id !== listingId) return;
      const mine =
        (incoming.sender_id === user.id && incoming.receiver_id === peerId) ||
        (incoming.sender_id === peerId && incoming.receiver_id === user.id);
      if (!mine) return;
      setThread((rows) => (rows.some((m) => m.id === incoming.id) ? rows : [...rows, incoming]));
      if (incoming.sender_id === peerId) {
        setPeerTyping(false);
        socket.emit('mark_read', { listingId, peerId, messageId: incoming.id });
      }
    };
    const onTyping = (payload: { senderId?: string; listingId?: string }) => {
      if (payload?.senderId === peerId && payload?.listingId === listingId) setPeerTyping(true);
    };
    const onStop = (payload: { senderId?: string; listingId?: string }) => {
      if (payload?.senderId === peerId && payload?.listingId === listingId) setPeerTyping(false);
    };
    const onRead = (payload: { listingId?: string; readerId?: string; read_at?: string }) => {
      if (payload?.listingId !== listingId || payload?.readerId !== peerId) return;
      const readAt = payload.read_at || new Date().toISOString();
      setThread((rows) =>
        rows.map((m) =>
          m.sender_id === user.id && m.receiver_id === peerId && !m.read_at
            ? { ...m, read_at: readAt }
            : m
        )
      );
    };

    socket.on('receive_message', onMessage);
    socket.on('user_typing', onTyping);
    socket.on('user_stop_typing', onStop);
    socket.on('messages_read', onRead);
    return () => {
      socket.off('receive_message', onMessage);
      socket.off('user_typing', onTyping);
      socket.off('user_stop_typing', onStop);
      socket.off('messages_read', onRead);
    };
  }, [token, user, listingId, peerId]);

  function onMessagesScroll() {
    const el = scroller.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 80;
  }

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !stickToBottom.current) return;
    el.scrollTop = el.scrollHeight;
  }, [thread.length]);

  function emitTyping(next: string) {
    if (!user) return;
    const socket = connectSocket(token);
    if (next.trim()) {
      socket.emit('typing', { listingId, peerId });
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socket.emit('stop_typing', { listingId, peerId });
      }, 1400);
    } else {
      socket.emit('stop_typing', { listingId, peerId });
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    setError('');
    connectSocket(token).emit('stop_typing', { listingId, peerId });
    try {
      const res = await api<Message>('/api/messages', {
        method: 'POST',
        token,
        body: JSON.stringify({
          listing_id: listingId,
          receiver_id: peerId,
          content: draft.trim(),
        }),
      });
      stickToBottom.current = true;
      setThread((rows) => (rows.some((m) => m.id === res.data.id) ? rows : [...rows, res.data]));
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send');
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;
  if (user.id === sellerId && peerId === sellerId) {
    return (
      <p className="text-sm text-muted">
        Buyers message you from this listing. Open Inbox to reply to a conversation.
      </p>
    );
  }

  const lastMineId = [...thread].reverse().find((m) => m.sender_id === user.id)?.id;
  const lastMine = thread.find((m) => m.id === lastMineId);
  const heading = user.id === sellerId ? 'Chat with buyer' : 'Message seller';
  const who = peerName || (user.id === sellerId ? 'Buyer' : 'Seller');

  const threadUi = (
    <>
      <div
        ref={scroller}
        onScroll={onMessagesScroll}
        className={
          variant === 'full'
            ? 'min-h-[12rem] flex-1 space-y-2 overflow-y-auto overscroll-contain bg-paper px-3 py-4 text-sm sm:px-5'
            : 'h-72 min-h-[16rem] max-h-[28rem] space-y-2 overflow-y-auto overscroll-contain bg-paper p-3 text-sm'
        }
      >
        {thread.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[90%] px-3 py-2 ${
                  mine ? 'bg-ink text-white' : 'border border-border bg-surface text-ink'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`mt-1 text-[10px] ${mine ? 'text-white/60' : 'text-muted'}`}>
                  {messageTime(m.created_at)}
                  {mine && m.id === lastMineId && lastMine?.read_at ? ' · Seen' : ''}
                </p>
              </div>
            </div>
          );
        })}
        {thread.length === 0 && <p className="text-muted">No messages yet.</p>}
        <div className="min-h-[1.25rem]" aria-live="polite">
          {peerTyping ? (
            <p className="text-xs text-muted">
              {who} is typing…
            </p>
          ) : null}
        </div>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      <form
        onSubmit={send}
        className={
          variant === 'full'
            ? 'flex gap-2 border-t border-border bg-surface p-3 sm:p-4'
            : 'flex flex-col gap-2 sm:flex-row'
        }
      >
        <label htmlFor={`chat-draft-${listingId}`} className="sr-only">
          Message
        </label>
        {variant === 'full' ? (
          <input
            id={`chat-draft-${listingId}`}
            required
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              emitTyping(e.target.value);
            }}
            className="field min-w-0 flex-1"
            placeholder="Type a message…"
            maxLength={2000}
            aria-label="Message"
          />
        ) : (
          <textarea
            id={`chat-draft-${listingId}`}
            required
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              emitTyping(e.target.value);
            }}
            className="field min-h-[72px] resize-y"
            placeholder="Ask about condition, meetup, etc."
            maxLength={2000}
          />
        )}
        <Button type="submit" loading={busy} className={variant === 'full' ? 'shrink-0' : 'sm:self-end'}>
          Send
        </Button>
      </form>
    </>
  );

  if (variant === 'full') {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{who}</p>
            <SellerPresence isOnline={isOnline} lastSeenAt={lastSeenAt} />
          </div>
        </div>
        {threadUi}
      </div>
    );
  }

  return (
    <div className="space-y-4 border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-display text-2xl font-medium text-ink">{heading}</h2>
        <SellerPresence isOnline={isOnline} lastSeenAt={lastSeenAt} />
      </div>
      {threadUi}
    </div>
  );
}
