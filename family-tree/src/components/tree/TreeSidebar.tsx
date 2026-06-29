'use client';

import { Network, Users, Search, Settings, LogOut } from 'lucide-react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function SidebarBtn({
  icon,
  label,
  href,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const cls = `flex flex-col items-center gap-1 p-2 rounded-xl transition-colors w-12 ${
    active
      ? 'bg-primary/10 text-primary'
      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
  }`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {icon}
        <span className="text-[9px] font-medium leading-none">{label}</span>
      </Link>
    );
  }
  return (
    <button className={cls} onClick={onClick}>
      {icon}
      <span className="text-[9px] font-medium leading-none">{label}</span>
    </button>
  );
}

export default function TreeSidebar() {
  const locale = useLocale();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/login`);
    router.refresh();
  }

  return (
    <div className="absolute left-0 top-0 h-full w-[4.5rem] bg-white/95 backdrop-blur-sm border-r border-gray-100 shadow-sm z-30 flex flex-col items-center py-4 gap-2">
      {/* Logo */}
      <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-sm flex-shrink-0">
        <Network className="w-5 h-5 text-white" />
      </div>

      <nav className="flex flex-col items-center gap-1 flex-1">
        <SidebarBtn
          icon={<Network className="w-5 h-5" />}
          label="Tree"
          href={`/${locale}/tree`}
          active
        />
        <SidebarBtn
          icon={<Users className="w-5 h-5" />}
          label="Members"
          href={`/${locale}/admin/members`}
        />
        <SidebarBtn
          icon={<Search className="w-5 h-5" />}
          label="Search"
          href={`/${locale}/tree`}
        />
        <SidebarBtn
          icon={<Settings className="w-5 h-5" />}
          label="Admin"
          href={`/${locale}/admin/queue`}
        />
      </nav>

      <SidebarBtn
        icon={<LogOut className="w-5 h-5" />}
        label="Logout"
        onClick={handleLogout}
      />
    </div>
  );
}
