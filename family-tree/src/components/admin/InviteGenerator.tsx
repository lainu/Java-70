'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createInvite, revokeInvite } from '@/lib/actions/invites';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import type { Invite } from '@/types/tree';
import { Copy, Check, Link } from 'lucide-react';

interface Props {
  invites: Invite[];
}

export default function InviteGenerator({ invites }: Props) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const { link } = await createInvite(email || undefined);
      setGeneratedLink(link);
      setEmail('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRevoke(id: string) {
    try {
      await revokeInvite(id);
      router.refresh();
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      {/* Generate form */}
      <div className="border rounded-lg p-4 bg-white">
        <h2 className="font-semibold mb-3">{t('generateInvite')}</h2>
        <div className="flex gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('inviteEmail')}
            type="email"
            className="flex-1 border rounded px-3 py-2 text-sm"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
          >
            <Link className="w-4 h-4" />
            Generate
          </button>
        </div>
        {error && <p className="text-destructive text-xs mt-2">{error}</p>}

        {generatedLink && (
          <div className="mt-3 flex items-center gap-2 bg-slate-50 rounded p-2">
            <p className="text-xs font-mono flex-1 truncate">{generatedLink}</p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? t('linkCopied') : t('copyLink')}
            </button>
          </div>
        )}
      </div>

      {/* Existing invites */}
      <div>
        <h2 className="font-semibold mb-3">Existing Invites</h2>
        {invites.length === 0 ? (
          <p className="text-muted-foreground text-sm">No invites yet.</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">{t('inviteExpires')}</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => (
                  <tr key={inv.id} className="border-t">
                    <td className="p-3">{inv.email ?? '—'}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                          inv.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : inv.status === 'used'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-muted-foreground'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{formatDate(inv.expires_at)}</td>
                    <td className="p-3 text-right">
                      {inv.status === 'pending' && (
                        <button
                          onClick={() => handleRevoke(inv.id)}
                          className="text-destructive text-xs hover:underline"
                        >
                          {t('revokeInvite')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
