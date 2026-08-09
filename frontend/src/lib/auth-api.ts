import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

function unwrapError(data: unknown, fallback: string): string {
    const err = data as { message?: string | string[]; error?: string };
    if (Array.isArray(err?.message)) return err.message.join(', ');
    return err?.message || err?.error || fallback;
}

export async function registerAccount(body: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
}): Promise<{ email: string; message: string }> {
    const headers = await CommonFunction.createHeaders({ withToken: false });
    const res = await api.post('/api/auth/register', body, headers);
    if (res.status !== HttpStatus.SuccessOK && res.status !== HttpStatus.SuccessCreated) {
        throw new Error(unwrapError(res.data, 'Registration failed'));
    }
    const payload = res.data as { data?: { email: string; message: string } };
    return payload.data ?? { email: body.email, message: 'Registration successful' };
}

export async function activateAccount(token: string): Promise<{ email: string }> {
    const headers = await CommonFunction.createHeaders({ withToken: false });
    const res = await api.post('/api/auth/activate', { token }, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error(unwrapError(res.data, 'Activation failed'));
    }
    const payload = res.data as { data?: { email: string } };
    return payload.data ?? { email: '' };
}
