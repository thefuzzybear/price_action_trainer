'use client';

import dynamic from 'next/dynamic';

// AnimatedChart uses browser APIs (setInterval, CSS animations).
// This thin client wrapper is the only place `ssr: false` is allowed.
const AnimatedChart = dynamic(() => import('./AnimatedChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-[480px] h-[320px] rounded-[10px] bg-[#111114] border border-white/[0.08] animate-pulse" />
  ),
});

export default function AnimatedChartLoader() {
  return <AnimatedChart />;
}
