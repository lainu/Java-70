'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { usePendingChangeCount } from '@/hooks/useSupabaseRealtime';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { TreePine, Plus, User, Settings, LogOut } from 'lucide-react';

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/(en|ml)/, '') || '/tree';
  const { user, isAdmin } = useAuth();
  const pendingCount = usePendingChangeCount();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/login`);
    router.refresh();
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-border flex items-center px-4 gap-4">
      <Link href={`/${locale}/tree`} className="flex items-center gap-2 font-bold text-primary">
        <TreePine className="w-5 h-5" />
        <span>{t('tree')}</span>
      </Link>

      <div className="flex-1" />

      {/* Language switcher */}
      <div className="flex gap-1 text-sm">
        <Link
          href={`/en${pathWithoutLocale}`}
          className={`px-2 py-1 rounded ${locale === 'en' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
        >
          EN
        </Link>
        <Link
          href={`/ml${pathWithoutLocale}`}
          className={`px-2 py-1 rounded ${locale === 'ml' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
        >
          ML
        </Link>
      </div>

      {user ? (
        <>
          <Link
            href={`/${locale}/person/new`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('addMember')}</span>
          </Link>

          {isAdmin && (
            <Link
              href={`/${locale}/admin/queue`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground relative"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{t('admin')}</span>
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </Link>
          )}

          <Link
            href={`/${locale}/profile`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{t('profile')}</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </>
      ) : (
        <Link
          href={`/${locale}/auth/login`}
          className="text-sm font-medium text-primary hover:underline"
        >
          {t('login')}
        </Link>
      )}
    </nav>
  );
}
