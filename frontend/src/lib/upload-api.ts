import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

function unwrapData<T>(raw: { data?: T } | T): T {
    if (raw && typeof raw === 'object' && 'data' in raw) {
        return (raw as { data: T }).data;
    }
    return raw as T;
}

export async function uploadMultipartImage(file: File, endpoint = '/api/pos/upload'): Promise<string> {
    const headers = await CommonFunction.createHeaders({ withToken: true, contentType: null });
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post(endpoint, formData, headers);
    if (res.status !== HttpStatus.SuccessCreated && res.status !== HttpStatus.SuccessOK) {
        const errorData = res.data as { message?: string; error?: string };
        throw new Error(errorData?.message || errorData?.error || "Échec du téléversement de l'image");
    }
    const data = unwrapData<{ url: string }>(res.data as { data?: { url: string } });
    return data.url;
}
