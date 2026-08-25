'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useAuth } from '@/lib/auth';
import type { Message } from '@/types';
import { Button } from './ui/Button';

export function ListingChat({
  listingId,
  sellerId,
  peerId,
}: {
  listingId: string;
  sellerId: string;
  peerId: string;
}) {
  const { user, token } = useAuth();
  const [thread, setThread] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !peerId) return;
    api<Message[]>(`/api/messages/${listingId}?with=${peerId}`, token ? { token } : {})
      .then((r) => setThread(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load chat'));
  }, [user, token, listingId, peerId]);

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket(token);
    socket.emit('join_room', { listingId, peerId });
    const onMessage = (incoming: Message) => {
      if (incoming.listing_id !== listingId) return;
      const mine =
        (incoming.sender_id === user.id && incoming.receiver_id === peerId) ||
        (incoming.sender_id === peerId && incoming.receiver_id === user.id);
      if (!mine) return;
      setThread((rows) => (rows.some((m) => m.id === incoming.id) ? rows : [...rows, incoming]));
    };
    socket.on('receive_message', onMessage);
    return () => {
      socket.off('receive_message', onMessage);
    };
  }, [token, user, listingId, peerId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    setError('');
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
      <p className="text-sm text-ink/60">
        Buyers message you from this listing. Open Inbox to reply to a conversation.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-black/8 bg-white/90 p-4">
      <h2 className="font-display text-lg font-semibold">
        {user.id === sellerId ? 'Chat with buyer' : 'Message seller'}
      </h2>
      <div className="max-h-[min(60vh,28rem)] space-y-2 overflow-y-auto rounded-md bg-stone-50 p-3 text-sm">
        {thread.map((m) => (
          <p
            key={m.id}
            className={`max-w-[90%] rounded-md px-3 py-2 ${
              m.sender_id === user.id ? 'ml-auto bg-brand-600 text-white' : 'bg-white'
            }`}
          >
            {m.content}
          </p>
        ))}
        {thread.length === 0 && <p className="text-ink/50">No messages yet.</p>}
        <div ref={bottom} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <form onSubmit={send} className="flex flex-col gap-2 sm:flex-row">
        <textarea
          required
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-[72px] w-full rounded-md border border-black/10 p-3 text-sm outline-none ring-brand-500 focus:ring-2"
          placeholder="Ask about condition, meetup, etc."
          maxLength={2000}
        />
        <Button type="submit" loading={busy} className="sm:self-end">
          Send
        </Button>
      </form>
    </div>
  );
}
