'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === '/dashboard') return null;

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    return { href, label };
  });

  return (
    <nav className="mb-4 flex items-center gap-1 text-sm text-gray-400">
      <Link href="/dashboard" className="hover:text-primary transition-colors breadcrumb-link">
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbs.map((crumb, idx) => (
        <div key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {idx === breadcrumbs.length - 1 ? (
            <span className="text-white">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-primary transition-colors breadcrumb-link">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}