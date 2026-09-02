export const metadata = {
  title: 'Price Action Trainer — App',
  description: 'Practice reading candlestick charts bar by bar.',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // The trainer needs a full-height flex container — these styles are in trainer.css
    // applied to body, but since Next.js wraps in its own body we use a div wrapper
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0d1117' }}>
      {children}
    </div>
  );
}
