'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type Role = 'organizer' | 'vendor' | 'staff' | 'attendee' | null;

const RoleThemeContext = createContext<Role>(null);

export function useRoleTheme() {
  return useContext(RoleThemeContext);
}

export function RoleThemeProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.includes('/dashboard/organizer')) setRole('organizer');
    else if (pathname.includes('/dashboard/vendor')) setRole('vendor');
    else if (pathname.includes('/dashboard/staff')) setRole('staff');
    else if (pathname.includes('/dashboard/attendee')) setRole('attendee');
    else setRole(null);
  }, [pathname]);

  useEffect(() => {
    // Remove previous theme classes and add the new one
    const body = document.body;
    body.classList.remove('theme-organizer', 'theme-vendor', 'theme-staff', 'theme-attendee');
    if (role) {
      body.classList.add(`theme-${role}`);
    } else {
      // Optional: remove any leftover class
      body.classList.remove('theme-organizer', 'theme-vendor', 'theme-staff', 'theme-attendee');
    }
  }, [role]);

  return (
    <RoleThemeContext.Provider value={role}>
      {children}
    </RoleThemeContext.Provider>
  );
}