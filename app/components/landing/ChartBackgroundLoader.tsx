'use client';

import dynamic from 'next/dynamic';

const ChartBackground = dynamic(() => import('./ChartBackground'), {
  ssr: false,
  loading: () => null,
});

export default function ChartBackgroundLoader() {
  return <ChartBackground />;
}
