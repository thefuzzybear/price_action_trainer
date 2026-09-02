import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Price Action Trainer',
  description: 'Practice reading candlestick charts without waiting for the market.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
