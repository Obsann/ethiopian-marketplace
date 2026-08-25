'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, getApiUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface ReportRow {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  reporter: { name: string };
  target: { id: string; title?: string; name?: string; email?: string } | null;
}

interface VerificationRow {
  id: string;
  id_image_url: string;
  face_image_url: string;
  user: { name: string; email: string };
}

function KycThumb({ path, token, alt }: { path: string; token: string; alt: string }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let objectUrl = '';
    let cancelled = false;
    fetch(`${getApiUrl()}${path}`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error('Could not load image');
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc('');
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path, token]);

  if (!src) {
    return <div className="h-40 w-40 animate-pulse rounded bg-stone-100" aria-hidden />;
  }
  return (
    // Private KYC blobs cannot use next/image public URLs.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="h-40 w-40 rounded object-cover" />
  );
}

export default function AdminPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'reports' | 'verifications'>('reports');
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [verifications, setVerifications] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/auth/login?next=/admin');
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  async function load() {
    if (!user || !isAdmin) return;
    setLoading(true);
    try {
      const [r, v] = await Promise.all([
        api<{ items: ReportRow[] }>('/api/reports', { token: token ?? undefined }),
        api<VerificationRow[]>('/api/verifications/pending', { token: token ?? undefined }),
      ]);
      setReports(r.data.items);
      setVerifications(v.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  async function patchReport(id: string, status: 'resolved' | 'dismissed') {
    if (!user) return;
    await api(`/api/reports/${id}`, {
      method: 'PATCH',
      token: token ?? undefined,
      body: JSON.stringify({ status }),
    });
    setReports((rows) => rows.filter((r) => r.id !== id));
  }

  async function reviewVerification(id: string, status: 'approved' | 'rejected') {
    if (!user) return;
    await api(`/api/verifications/${id}/review`, {
      method: 'PATCH',
      token: token ?? undefined,
      body: JSON.stringify({ status }),
    });
    setVerifications((rows) => rows.filter((v) => v.id !== id));
  }

  if (isLoading || !isAdmin || loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Admin panel</h1>
        <p className="text-sm text-ink/70">Review reports and seller verifications</p>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === 'reports' ? 'primary' : 'ghost'} onClick={() => setTab('reports')}>
          Open reports
        </Button>
        <Button
          variant={tab === 'verifications' ? 'primary' : 'ghost'}
          onClick={() => setTab('verifications')}
        >
          Pending verifications
        </Button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {tab === 'reports' && (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="rounded-lg border border-black/8 bg-white/90 p-4">
              <p className="text-sm font-medium">
                {r.target_type === 'listing' && r.target?.id ? (
                  <Link href={`/listings/${r.target.id}`} className="hover:underline">
                    Listing: {r.target.title || r.target_id}
                  </Link>
                ) : (
                  <span>
                    {r.target_type}: {r.target?.name || r.target_id}
                  </span>
                )}
                <span className="font-normal text-ink/60"> · reported by {r.reporter.name}</span>
              </p>
              <p className="mt-1 text-sm text-ink/70">{r.reason}</p>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => patchReport(r.id, 'resolved')}>Resolve</Button>
                <Button variant="ghost" onClick={() => patchReport(r.id, 'dismissed')}>
                  Dismiss
                </Button>
              </div>
            </li>
          ))}
          {reports.length === 0 && <p className="text-sm text-ink/60">No open reports.</p>}
        </ul>
      )}

      {tab === 'verifications' && (
        <ul className="space-y-3">
          {verifications.map((v) => (
            <li key={v.id} className="rounded-lg border border-black/8 bg-white/90 p-4">
              <p className="font-medium">
                {v.user.name} · {v.user.email}
              </p>
              <div className="mt-3 flex gap-3">
                {token && (
                  <>
                    <KycThumb path={v.id_image_url} token={token} alt="ID document" />
                    <KycThumb path={v.face_image_url} token={token} alt="Face photo" />
                  </>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => reviewVerification(v.id, 'approved')}>Approve</Button>
                <Button variant="danger" onClick={() => reviewVerification(v.id, 'rejected')}>
                  Reject
                </Button>
              </div>
            </li>
          ))}
          {verifications.length === 0 && (
            <p className="text-sm text-ink/60">No pending verifications.</p>
          )}
        </ul>
      )}
    </div>
  );
}
