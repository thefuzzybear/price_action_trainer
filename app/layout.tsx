import type { Metadata } from 'next';
import './globals.css';

// Base metadata — individual pages override title/description via their own export.
export const metadata: Metadata = {
  title: {
    default: 'Price Action Trainer',
    template: '%s — Price Action Trainer',
  },
  description: 'Practice reading candlestick charts without waiting for the market.',
  icons: { icon: '/favicon.svg' },
  metadataBase: new URL('https://price-action-trainer.vercel.app'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
