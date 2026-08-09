import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

export async function activateAccount(token: string): Promise<{ email: string }> {
    const headers = await CommonFunction.createHeaders({ withToken: false });
    const res = await api.post('/api/auth/activate', { token }, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const message =
            (res.data as { error?: string; message?: string })?.error ||
            (res.data as { message?: string })?.message ||
            'Activation failed';
        throw new Error(message);
    }
    const payload = res.data as { data?: { email: string } };
    return payload.data ?? (res.data as { email: string });
}
