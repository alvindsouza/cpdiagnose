'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard', icon: 'history', title: 'Submissions' },
] as const;

export function AppSidebar({ handle }: { handle?: string }) {
  const pathname = usePathname();
  const initial = handle?.[0]?.toUpperCase() ?? 'U';

  return (
    <aside className="flex flex-col items-center py-4 gap-4 h-screen w-12 bg-background border-r border-outline-variant shrink-0 z-20">
      <div
        className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center mb-4 border border-outline-variant shrink-0"
        title={handle ?? 'User'}
      >
        <span className="font-headline-sm text-headline-sm text-primary">
          {initial}
        </span>
      </div>
      <nav className="flex flex-col gap-2 w-full items-center">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex justify-center py-2 transition-colors border-l-2 ${
                active
                  ? 'text-secondary border-secondary opacity-80'
                  : 'text-on-surface-variant border-transparent hover:bg-surface-container-high'
              }`}
              title={item.title}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <Link
          href="/"
          className="w-full flex justify-center py-2 text-on-surface-variant hover:bg-surface-container-high transition-colors"
          title="Sign out"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </Link>
      </div>
    </aside>
  );
}
