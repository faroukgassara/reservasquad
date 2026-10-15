import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

export type NewsletterCategory = 'UPDATE' | 'PROMOTION' | 'DIGEST' | 'EDITORIAL';
export type NewsletterAudience =
    | 'ALL_CLIENTS'
    | 'ALL_PROFESSORS'
    | 'ACTIVE_SUBSCRIBERS'
    | 'EXPIRED_SUBSCRIBERS'
    | 'SPECIFIC_RECIPIENTS';
export type NewsletterStatus = 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED';
export type NewsletterRecipientStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface NewsletterSearchRecipientItem {
    id: string;
    type: 'CLIENT' | 'PROFESSOR';
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
}

export interface NewsletterRecipientRecord {
    id: string;
    newsletterId: string;
    clientId?: string | null;
    professorId?: string | null;
    email: string;
    status: NewsletterRecipientStatus;
    error?: string | null;
    sentAt?: string | null;
    createdAt: string;
    client?: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
    } | null;
    professor?: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
    } | null;
}

export interface NewsletterRecord {
    id: string;
    subject: string;
    preheader?: string | null;
    body: string;
    ctaLabel?: string | null;
    ctaUrl?: string | null;
    category: NewsletterCategory;
    audience: NewsletterAudience;
    specificClientIds?: string[];
    specificProfessorIds?: string[];
    specificEmails?: string[];
    specificClients?: Array<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string | null;
    }>;
    specificProfessors?: Array<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string | null;
    }>;
    status: NewsletterStatus;
    recipientsCount: number;
    sentCount: number;
    failedCount: number;
    sentAt?: string | null;
    createdById?: string | null;
    createdBy?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    } | null;
    recipients?: NewsletterRecipientRecord[];
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}

export interface CreateNewsletterInput {
    subject: string;
    preheader?: string;
    body: string;
    ctaLabel?: string;
    ctaUrl?: string;
    category: NewsletterCategory;
    audience: NewsletterAudience;
    specificClientIds?: string[];
    specificProfessorIds?: string[];
    specificEmails?: string[];
}

export type UpdateNewsletterInput = Partial<CreateNewsletterInput>;

export interface PaginatedNewsletters {
    data: NewsletterRecord[];
    meta: {
        total: number;
        currentPage: number;
        perPage: number;
        lastPage: number;
        prev: number | null;
        next: number | null;
        hasMore: boolean;
    };
}

function unwrapData<T>(raw: { data?: T } | T): T {
    if (raw && typeof raw === 'object' && 'data' in raw) {
        return (raw as { data: T }).data;
    }
    return raw as T;
}

function errorFrom(data: unknown, fallback: string): Error {
    const body = data as { message?: string | string[]; error?: string } | undefined;
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    return new Error(message || body?.error || fallback);
}

export async function fetchNewsletters(params: {
    page?: number;
    perPage?: number;
    search?: string;
    category?: string;
    audience?: string;
    status?: string;
}): Promise<PaginatedNewsletters> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.perPage) sp.set('perPage', String(params.perPage));
    if (params.search) sp.set('search', params.search);
    if (params.category && params.category !== 'all') sp.set('category', params.category);
    if (params.audience && params.audience !== 'all') sp.set('audience', params.audience);
    if (params.status && params.status !== 'all') sp.set('status', params.status);
    const q = sp.toString();
    const res = await api.get(`/api/newsletters${q ? `?${q}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, 'Impossible de récupérer les newsletters');
    return unwrapData<PaginatedNewsletters>(res.data as { data?: PaginatedNewsletters });
}

export async function fetchNewsletter(id: string): Promise<NewsletterRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get(`/api/newsletters/${id}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, 'Impossible de récupérer la newsletter');
    return unwrapData<NewsletterRecord>(res.data as { data?: NewsletterRecord });
}

export async function createNewsletter(input: CreateNewsletterInput): Promise<NewsletterRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/newsletters', input, headers);
    if (res.status !== HttpStatus.SuccessCreated && res.status !== HttpStatus.SuccessOK) {
        throw errorFrom(res.data, 'Impossible de créer la newsletter');
    }
    return unwrapData<NewsletterRecord>(res.data as { data?: NewsletterRecord });
}

export async function updateNewsletter(id: string, input: UpdateNewsletterInput): Promise<NewsletterRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.put(`/api/newsletters/${id}`, input, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, 'Impossible de mettre à jour la newsletter');
    return unwrapData<NewsletterRecord>(res.data as { data?: NewsletterRecord });
}

export async function deleteNewsletter(id: string): Promise<{ id: string; success: boolean }> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/newsletters/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, 'Impossible de supprimer la newsletter');
    return unwrapData<{ id: string; success: boolean }>(res.data as { data?: { id: string; success: boolean } });
}

export async function fetchDeletedNewsletters(params: {
    page?: number;
    perPage?: number;
    search?: string;
    category?: string;
    audience?: string;
    status?: string;
}): Promise<PaginatedNewsletters> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.perPage) sp.set('perPage', String(params.perPage));
    if (params.search) sp.set('search', params.search);
    if (params.category && params.category !== 'all') sp.set('category', params.category);
    if (params.audience && params.audience !== 'all') sp.set('audience', params.audience);
    if (params.status && params.status !== 'all') sp.set('status', params.status);
    const q = sp.toString();
    const res = await api.get(`/api/newsletters/deleted${q ? `?${q}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, 'Impossible de récupérer les newsletters supprimées');
    return unwrapData<PaginatedNewsletters>(res.data as { data?: PaginatedNewsletters });
}

export async function restoreNewsletter(id: string): Promise<NewsletterRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/newsletters/${id}/restore`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, 'Impossible de restaurer la newsletter');
    return unwrapData<NewsletterRecord>(res.data as { data?: NewsletterRecord });
}

export async function hardDeleteNewsletter(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/newsletters/${id}/hard`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, 'Impossible de supprimer définitivement la newsletter');
}

export async function fetchAudienceCount(audience: NewsletterAudience): Promise<{ count: number }> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get(`/api/newsletters/audience-count?audience=${audience}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, "Impossible de calculer l'audience");
    return unwrapData<{ count: number }>(res.data as { data?: { count: number } });
}

export async function sendTestNewsletter(id: string, email: string): Promise<{ success: boolean; email: string }> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/newsletters/${id}/test`, { email }, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, "Impossible d'envoyer l'e-mail de test");
    return unwrapData<{ success: boolean; email: string }>(res.data as { data?: { success: boolean; email: string } });
}

export async function sendNewsletter(id: string): Promise<NewsletterRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/newsletters/${id}/send`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, "Impossible d'envoyer la newsletter");
    return unwrapData<NewsletterRecord>(res.data as { data?: NewsletterRecord });
}

export async function getUnsubscribeInfo(token: string): Promise<{ maskedEmail: string; optedOut: boolean }> {
    const headers = await CommonFunction.createHeaders({ withToken: false });
    const res = await api.get(`/api/public/newsletter/unsubscribe/${token}`, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, 'Lien de désinscription invalide ou expiré');
    return unwrapData<{ maskedEmail: string; optedOut: boolean }>(
        res.data as { data?: { maskedEmail: string; optedOut: boolean } },
    );
}

export async function confirmUnsubscribe(token: string): Promise<{ success: boolean; maskedEmail: string }> {
    const headers = await CommonFunction.createHeaders({ withToken: false });
    const res = await api.post(`/api/public/newsletter/unsubscribe/${token}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) throw errorFrom(res.data, 'Impossible de confirmer la désinscription');
    return unwrapData<{ success: boolean; maskedEmail: string }>(
        res.data as { data?: { success: boolean; maskedEmail: string } },
    );
}

export interface NewsletterMediaUploadResult {
    url: string;
    path: string;
    filename: string;
    size: number;
    mimetype: string;
}

export async function uploadNewsletterMedia(file: File): Promise<NewsletterMediaUploadResult> {
    const headers = await CommonFunction.createHeaders({ withToken: true, contentType: null });
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post('/api/newsletters/upload', formData, headers);
    if (res.status !== HttpStatus.SuccessCreated && res.status !== HttpStatus.SuccessOK) {
        throw errorFrom(res.data, 'Impossible de téléverser le fichier');
    }
    return unwrapData<NewsletterMediaUploadResult>(res.data as { data?: NewsletterMediaUploadResult });
}

export async function searchNewsletterRecipients(search?: string): Promise<NewsletterSearchRecipientItem[]> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const sp = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await api.get(`/api/newsletters/search-recipients${sp}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw errorFrom(res.data, 'Impossible de rechercher les destinataires');
    }
    return unwrapData<NewsletterSearchRecipientItem[]>(res.data as { data?: NewsletterSearchRecipientItem[] }) || [];
}

