'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatDate } from '@/lib/utils';
import { approveChange, rejectChange } from '@/lib/actions/pending';
import { useRouter } from 'next/navigation';
import type { PendingChange } from '@/types/tree';
import { Check, X } from 'lucide-react';

interface Props {
  change: PendingChange;
}

export default function PendingChangeCard({ change }: Props) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleApprove() {
    setLoading(true);
    setError('');
    try {
      await approveChange(change.id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setLoading(true);
    setError('');
    try {
      await rejectChange(change.id, rejectReason);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  const payload = change.payload as Record<string, unknown>;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {change.change_type.replace(/_/g, ' ')}
          </span>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatDate(change.created_at)}
          </p>
        </div>
        <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">
          Pending
        </span>
      </div>

      {/* Payload preview */}
      <div className="bg-slate-50 rounded p-3 mb-3 text-xs font-mono overflow-auto max-h-48">
        {Object.entries(payload)
          .filter(([, v]) => v !== null && v !== '' && v !== undefined)
          .map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-muted-foreground min-w-[120px]">{k}:</span>
              <span className="text-foreground break-all">
                {Array.isArray(v) ? v.join(', ') : String(v)}
              </span>
            </div>
          ))}
      </div>

      {error && <p className="text-destructive text-xs mb-2">{error}</p>}

      {!showRejectForm ? (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex items-center gap-1 bg-green-600 text-white rounded px-3 py-1.5 text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            {t('approve')}
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={loading}
            className="flex items-center gap-1 border border-destructive text-destructive rounded px-3 py-1.5 text-sm hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            {t('reject')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs font-medium">{t('rejectReason')}</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={2}
            className="w-full border rounded px-3 py-2 text-sm resize-none"
            placeholder="Reason for rejection..."
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={loading || !rejectReason.trim()}
              className="bg-destructive text-white rounded px-3 py-1.5 text-sm disabled:opacity-50"
            >
              {t('reject')}
            </button>
            <button
              onClick={() => setShowRejectForm(false)}
              className="border rounded px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
