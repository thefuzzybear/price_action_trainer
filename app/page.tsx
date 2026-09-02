import { readFileSync } from 'fs';
import { join } from 'path';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Price Action Trainer — Practice Reading Charts Without Waiting for the Market',
  description: 'Step through real historical candlestick data bar by bar, predict the next move, map trades with TP/SL lines, and track your accuracy.',
  openGraph: {
    title: 'Price Action Trainer',
    description: 'Step through real historical candlestick data bar by bar. Predict the next move, map trades, track your accuracy.',
    url: 'https://price-action-trainer.vercel.app',
  },
};

export default function LandingPage() {
  const html = readFileSync(join(process.cwd(), 'public', 'landing.html'), 'utf8');

  // Strip the outer <html>/<head>/<body> tags since Next.js provides those via layout.tsx.
  // We only want the <body> content + the inline <style> block.
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);

  const bodyContent = bodyMatch ? bodyMatch[1] : '';
  const inlineStyle = styleMatch ? styleMatch[1] : '';

  return (
    <>
      {inlineStyle && (
        <style dangerouslySetInnerHTML={{ __html: inlineStyle }} />
      )}
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </>
  );
}
