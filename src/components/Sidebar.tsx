'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  MapPin,
  Users,
  CheckSquare,
  Package,
  FileText,
  MessageSquare,
  Star,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRoleTheme } from './RoleThemeProvider';

const navItems = {
  organizer: [
    { name: 'Dashboard', href: '/dashboard/organizer', icon: LayoutDashboard },
    { name: 'Events', href: '/dashboard/organizer/events', icon: Calendar },
    { name: 'Venues', href: '/dashboard/organizer/venues', icon: MapPin },
    { name: 'Vendors', href: '/dashboard/organizer/vendors', icon: Package },
    { name: 'Staff Tasks', href: '/dashboard/organizer/tasks', icon: CheckSquare },
  ],
  vendor: [
    { name: 'Dashboard', href: '/dashboard/vendor', icon: LayoutDashboard },
    { name: 'Proposals', href: '/dashboard/vendor/proposals', icon: FileText },
  ],
  staff: [
    { name: 'Dashboard', href: '/dashboard/staff', icon: LayoutDashboard },
    { name: 'My Tasks', href: '/dashboard/staff/tasks', icon: CheckSquare },
    { name: 'Report Issue', href: '/dashboard/staff/issues', icon: MessageSquare },
  ],
  attendee: [
    { name: 'Dashboard', href: '/dashboard/attendee', icon: LayoutDashboard },
    { name: 'My Events', href: '/dashboard/attendee/events', icon: Calendar },
    { name: 'Feedback', href: '/dashboard/attendee/feedback', icon: Star },
  ],
};

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentRole = useRoleTheme();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Logged out');
    router.push('/login');
  };

  const items = navItems[role as keyof typeof navItems] || [];

  // Determine the active link background color based on role
  const getActiveClass = () => {
    switch (currentRole) {
      case 'organizer': return 'bg-blue-900/50 text-white';
      case 'vendor': return 'bg-green-900/50 text-white';
      case 'staff': return 'bg-amber-900/50 text-white';
      case 'attendee': return 'bg-purple-900/50 text-white';
      default: return 'bg-gray-800 text-white';
    }
  };

  return (
    <aside className="flex h-screen w-64 flex-col bg-gray-900/80 backdrop-blur-sm border-r border-gray-800">
      <div className="flex h-16 items-center px-6 text-xl font-bold tracking-tight text-white">
        EventOps
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
// Inside the nav mapping, replace the Link className with:
<Link
  key={item.href}
  href={item.href}
  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all sidebar-link ${
    isActive
      ? getActiveClass()
      : 'text-gray-400 hover:bg-opacity-20 hover:text-white'
  }`}
>
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-800 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}