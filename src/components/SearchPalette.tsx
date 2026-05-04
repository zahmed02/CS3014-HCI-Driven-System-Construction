'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useHotkeys } from 'react-hotkeys-hook';
import { useRouter } from 'next/navigation';

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useHotkeys('ctrl+k', (e) => {
    e.preventDefault();
    setOpen(true);
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const items = [
    { label: 'Create Event', href: '/dashboard/organizer/events/create', role: 'organizer' },
    { label: 'My Events', href: '/dashboard/attendee/events', role: 'attendee' },
    { label: 'Vendor Proposals', href: '/dashboard/vendor/proposals', role: 'vendor' },
    { label: 'My Tasks', href: '/dashboard/staff/tasks', role: 'staff' },
  ];

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Global Search">
      <Command.Input placeholder="Type a command or search..." />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        {items.map((item) => (
          <Command.Item
            key={item.href}
            onSelect={() => {
              router.push(item.href);
              setOpen(false);
            }}
          >
            {item.label}
          </Command.Item>
        ))}
      </Command.List>
    </Command.Dialog>
  );
}