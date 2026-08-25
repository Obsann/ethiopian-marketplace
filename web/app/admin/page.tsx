'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
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
  target?: { id: string; title?: string; name?: string; email?: string } | null;
}

interface VerificationRow {
  id: string;
  id_image_url: string;
  face_image_url: string;
  user: { name: string; email: string };
}

export default function AdminPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'reports' | 'verifications'>('reports');
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [verifications, setVerifications] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.replace('/auth/login?next=/admin');
    }
  }, [user, isLoading, router]);

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const [r, v] = await Promise.all([
        api<{ items: ReportRow[] }>('/api/reports', { token }),
        api<VerificationRow[]>('/api/verifications/pending', { token }),
      ]);
      setReports((r.data.items ?? []).filter((row) => row.status === 'open'));
      setVerifications(v.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function patchReport(id: string, status: 'resolved' | 'dismissed') {
    if (!token) return;
    setActionError('');
    try {
      await api(`/api/reports/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status }),
      });
      setReports((rows) => rows.filter((r) => r.id !== id));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not update report');
    }
  }

  async function reviewVerification(id: string, status: 'approved' | 'rejected') {
    if (!token) return;
    setActionError('');
    try {
      await api(`/api/verifications/${id}/review`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status }),
      });
      setVerifications((rows) => rows.filter((v) => v.id !== id));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not review verification');
    }
  }

  if (isLoading || loading) {
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
      {actionError && <p className="text-red-600">{actionError}</p>}

      {tab === 'reports' && (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="rounded-lg border border-black/8 bg-white/90 p-4">
              <p className="text-sm font-medium">
                {r.target_type}
                {r.target?.title ? ` · ${r.target.title}` : ''}
                {r.target?.name ? ` · ${r.target.name}` : ''}
                {r.target?.email ? ` (${r.target.email})` : ''}
              </p>
              <p className="text-xs text-ink/50">Reported by {r.reporter.name}</p>
              <p className="mt-1 text-sm text-ink/70">{r.reason}</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
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
                <div className="relative h-28 w-28 overflow-hidden rounded bg-stone-100">
                  <Image src={v.id_image_url} alt="ID" fill className="object-cover" sizes="112px" />
                </div>
                <div className="relative h-28 w-28 overflow-hidden rounded bg-stone-100">
                  <Image src={v.face_image_url} alt="Face" fill className="object-cover" sizes="112px" />
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
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
