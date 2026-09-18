import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';

export default async function HomePage() {
  const session = await getCurrentUser();
  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}