import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { SearchPalette } from '@/components/SearchPalette';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { ShortcutsHelp } from '@/components/ShortcutsHelp';
import { RoleThemeProvider } from '@/components/RoleThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EventOps',
  description: 'Event Operations Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <RoleThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster position="top-right" richColors />
            <SearchPalette />
            <ShortcutsHelp />
          </TooltipProvider>
        </RoleThemeProvider>
      </body>
    </html>
  );
}