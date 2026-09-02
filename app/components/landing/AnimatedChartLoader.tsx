'use client';

import dynamic from 'next/dynamic';

// AnimatedChart uses browser APIs (setInterval, CSS animations).
// This thin client wrapper is the only place `ssr: false` is allowed.
const AnimatedChart = dynamic(() => import('./AnimatedChart'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', maxWidth: 480, height: 320,
      borderRadius: 8, background: '#111118',
      border: '1px solid rgba(255,255,255,0.07)',
    }} />
  ),
});

export default function AnimatedChartLoader() {
  return <AnimatedChart />;
}
