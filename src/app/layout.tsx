import type { Metadata, Viewport } from 'next';
import { DaftarSW } from './DaftarSW.js';
import './globals.css';

export const metadata: Metadata = {
  title: 'PWA Project KMB',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'MAR KMB' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4F633F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <DaftarSW aku={null} />
        {children}
      </body>
    </html>
  );
}
