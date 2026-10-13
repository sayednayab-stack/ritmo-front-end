import type { Metadata } from 'next';
import { Inter, EB_Garamond, IBM_Plex_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';
import { QueryProvider } from '@/lib/query-client';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const garamond = EB_Garamond({ subsets: ['latin'], variable: '--font-garamond', weight: ['400', '500'] });
const mono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] });

export const metadata: Metadata = {
  title: 'RITMO Fleet Management',
  description: 'Fleet Inventory Management System for airport-hotel transfers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${garamond.variable} ${mono.variable} font-sans`}>
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
