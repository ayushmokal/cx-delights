import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CX Delights — External Delights Form',
  description: 'Submit external delights for users (Amazon links, occasion, ticket).',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
