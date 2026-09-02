import { redirect } from 'next/navigation';

// Redirect root to the trainer app for now.
// The static landing.html will be served from /public/landing.html via Next.js public dir.
export default function Home() {
  redirect('/app');
}
