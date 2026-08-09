import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { Routes } from '@/lib/routes';

export default async function HomePage() {
    const session = await getServerSession(authOptions);
    redirect(session ? Routes.Dashboard : Routes.Login);
}
