import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Только для /adminko/sources и других защищённых страниц
  // /adminko (логин) пропускается
  const session = await getSession();

  return <>{children}</>;
}
