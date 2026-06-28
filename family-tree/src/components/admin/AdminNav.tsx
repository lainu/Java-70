'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { ClipboardList, UserPlus, Home, Mail } from 'lucide-react';
import { usePendingChangeCount } from '@/hooks/useSupabaseRealtime';
import { cn } from '@/lib/utils';

export default function AdminNav() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const pathname = usePathname();
  const pendingCount = usePendingChangeCount();

  const links = [
    { href: `/${locale}/admin/queue`, label: t('queue'), icon: ClipboardList, badge: pendingCount },
    { href: `/${locale}/admin/members`, label: t('members'), icon: UserPlus, badge: 0 },
    { href: `/${locale}/admin/houses`, label: t('houses'), icon: Home, badge: 0 },
    { href: `/${locale}/admin/invites`, label: t('invites'), icon: Mail, badge: 0 },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r flex flex-col py-4">
      <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Admin
      </p>
      <nav className="flex-1">
        {links.map(({ href, label, icon: Icon, badge }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 text-sm relative hover:bg-slate-50 transition-colors',
              pathname === href ? 'text-primary font-medium bg-primary/5' : 'text-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            {badge > 0 && (
              <span className="ml-auto bg-destructive text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                {badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
