import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — Empyrean',
  description: 'Your Empyrean hub — training sessions, community board, and profile.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F0E8',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
    }}>
      {children}
    </div>
  );
}
