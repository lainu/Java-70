'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { House } from '@/types/tree';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  houses: House[];
}

export default function HouseManager({ houses }: Props) {
  const router = useRouter();
  const [nameEn, setNameEn] = useState('');
  const [nameMl, setNameMl] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!nameEn.trim()) return;
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.from('houses').insert({
      name_en: nameEn,
      name_ml: nameMl || null,
      location: location || null,
    });

    if (error) {
      setError(error.message);
    } else {
      setNameEn('');
      setNameMl('');
      setLocation('');
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from('houses').delete().eq('id', id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Add form */}
      <form onSubmit={handleAdd} className="border rounded-lg p-4 bg-white space-y-3">
        <h2 className="font-semibold">Add House / Family Branch</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Name (English) *</label>
            <input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Thattakunnel Family"
              required
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 font-ml">Name (Malayalam)</label>
            <input
              value={nameMl}
              onChange={(e) => setNameMl(e.target.value)}
              placeholder="തട്ടകുന്നേൽ കുടുംബം"
              lang="ml"
              className="w-full border rounded px-3 py-2 text-sm font-ml"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Thiruvalla, Kerala"
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-destructive text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1 bg-primary text-primary-foreground rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add House
        </button>
      </form>

      {/* List */}
      <div className="border rounded-lg overflow-hidden bg-white">
        {houses.length === 0 ? (
          <p className="p-4 text-muted-foreground text-sm">No houses yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-muted-foreground">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Location</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {houses.map((h) => (
                <tr key={h.id} className="border-t">
                  <td className="p-3">
                    <p>{h.name_en}</p>
                    {h.name_ml && <p className="text-xs text-muted-foreground font-ml">{h.name_ml}</p>}
                  </td>
                  <td className="p-3 text-muted-foreground">{h.location ?? '—'}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="text-destructive hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
