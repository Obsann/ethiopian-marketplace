'use client';

import { FormEvent, Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { MessageSquare } from 'lucide-react';
import { api, getApiUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Listing, Message } from '@/types';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

function ChatView() {
  const { listingId } = useParams<{ listingId: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const withUserId = params.get('with') || '';

  const [listing, setListing] = useState<Listing | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      const next = `/chat/${listingId}?with=${encodeURIComponent(withUserId)}`;
      router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
    }
  }, [user, isLoading, router, listingId, withUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!token || !withUserId || !listingId) {
      if (!isLoading && user && !withUserId) {
        setError('Missing chat partner.');
        setLoading(false);
      }
      return;
    }

    let cancelled = false;
    setLoading(true);
    Promise.all([
      api<Message[]>(`/api/messages/${listingId}?with=${encodeURIComponent(withUserId)}`, {
        token,
      }),
      api<Listing>(`/api/listings/${listingId}?count_view=0`).catch(() => null),
    ])
      .then(([msgRes, listingRes]) => {
        if (cancelled) return;
        setMessages(msgRes.data);
        if (listingRes) setListing(listingRes.data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load chat');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, listingId, withUserId, isLoading, user]);

  useEffect(() => {
    if (!token || !user || !listingId || !withUserId) return;

    const socket = io(getApiUrl(), { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', { listingId, userId: user.id });
    });

    socket.on('receive_message', (incoming: Message) => {
      const mine = incoming.sender_id === user.id && incoming.receiver_id === withUserId;
      const theirs = incoming.sender_id === withUserId && incoming.receiver_id === user.id;
      if (!mine && !theirs) return;
      if (incoming.listing_id && incoming.listing_id !== listingId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user, listingId, withUserId]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !user || !token || !withUserId) return;
    if (withUserId === user.id) {
      setSendError('Open Messages to reply to the other person.');
      return;
    }
    setSending(true);
    setSendError('');
    try {
      const res = await api<Message>(`/api/messages/${listingId}`, {
        method: 'POST',
        token,
        body: JSON.stringify({ receiver_id: withUserId, content }),
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      setDraft('');
      socketRef.current?.emit('join_room', { listingId, userId: user.id });
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Could not send');
    } finally {
      setSending(false);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <Alert tone="error">{error}</Alert>;
  }

  if (user && withUserId === user.id) {
    return (
      <Alert tone="info">
        You cannot chat with yourself.{' '}
        <Link href="/chat" className="font-semibold underline underline-offset-2">
          Open your inbox
        </Link>{' '}
        to reply to buyers.
      </Alert>
    );
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h1 className="font-display text-lg font-semibold text-ink">
          {listing ? listing.title : 'Chat'}
        </h1>
        <div className="mt-0.5 flex flex-wrap gap-3 text-xs">
          {listing && (
            <Link
              href={`/listings/${listing.id}`}
              className="cursor-pointer font-medium text-brand-600 transition duration-180 hover:text-brand-700"
            >
              View listing
            </Link>
          )}
          <Link
            href="/chat"
            className="cursor-pointer text-muted transition duration-180 hover:text-ink"
          >
            All messages
          </Link>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-paper px-3 py-4 sm:px-4">
        {messages.length === 0 && (
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Say hello to start the conversation."
          />
        )}
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  mine
                    ? 'bg-brand-600 text-white'
                    : 'border border-border bg-surface text-ink'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-border bg-surface p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          aria-label="Message"
          className="field min-w-0 flex-1"
        />
        <Button type="submit" disabled={!draft.trim()} loading={sending} className="shrink-0">
          Send
        </Button>
      </form>
      {sendError && (
        <div className="px-3 pb-3">
          <Alert tone="error">{sendError}</Alert>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      }
    >
      <ChatView />
    </Suspense>
  );
}
