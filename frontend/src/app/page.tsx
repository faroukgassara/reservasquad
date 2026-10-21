import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/auth';
import { homePathForRole, Routes } from '@/lib/routes';

export default async function RootPage() {
    const session = await getServerSession(authOptions);

    if (session) {
        redirect(homePathForRole(session.user?.role));
    } else {
        redirect(Routes.Login);
    }
}
