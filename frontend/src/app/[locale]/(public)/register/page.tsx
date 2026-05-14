'use client';

import { signIn, getSession } from 'next-auth/react';
import { Link, useRouter } from '@/i18n/navigation';
import { Routes } from '@/lib/routes';
import { useState } from 'react';
import Image from 'next/image';

const NAVY = '#253165';
const RED = '#E5191D';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const api = () => process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${api()}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg =
                    typeof data.message === 'string' ?
                        data.message
                    : Array.isArray(data.message) ?
                        data.message.join(', ')
                    : 'Inscription impossible';
                setError(msg);
                return;
            }
            await signIn('credentials', {
                email: email.trim(),
                password,
                rememberMe: 'true',
                redirect: false,
            });
            const session = await getSession();
            if (session) {
                router.push(Routes.Calendar);
            }
        } catch {
            setError('Réessayez dans un instant.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
            <Image
                src="/branding/reservasquad-logo.png"
                alt="Reserva Squad"
                width={180}
                height={90}
                className="mb-8"
            />
            <form
                onSubmit={(e) => void submit(e)}
                className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
                style={{ borderTopWidth: '4px', borderTopColor: RED }}
            >
                <h1 className="text-xl font-semibold" style={{ color: NAVY }}>
                    Créer un compte professeur
                </h1>
                {error ? <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
                <label className="block text-sm text-slate-700">
                    Nom complet
                    <input
                        className="mt-1 w-full rounded border px-3 py-2"
                        value={name}
                        required
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>
                <label className="block text-sm text-slate-700">
                    Email
                    <input
                        type="email"
                        className="mt-1 w-full rounded border px-3 py-2"
                        value={email}
                        required
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </label>
                <label className="block text-sm text-slate-700">
                    Mot de passe (≥ 8 caractères)
                    <input
                        type="password"
                        className="mt-1 w-full rounded border px-3 py-2"
                        value={password}
                        required
                        minLength={8}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg py-3 font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: NAVY }}
                >
                    {loading ? 'Patientez…' : "S'inscrire"}
                </button>
                <p className="text-center text-sm text-slate-600">
                    Déjà un compte ?{' '}
                    <Link href={Routes.Login} className="underline" style={{ color: NAVY }}>
                        Connexion
                    </Link>
                </p>
            </form>
        </div>
    );
}
