import { Api } from '@/common/StandardApi/api';
import { CommonFunction, Config } from '@/common';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';

const api = new Api();

/**
 * Resolves formation image URL for display.
 * - Base64 data URLs are returned as-is.
 * - Relative paths (e.g. "formations/uuid.jpg") are prefixed with API URL.
 * - Absolute URLs (http/https) are returned as-is.
 */
export function getFormationImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('data:')) return imageUrl;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    const base = Config.getInstance().API_URL || '';
    const separator = base.endsWith('/') ? '' : '/';
    return `${base}${separator}${imageUrl}`;
}

export interface FormationCategory {
    id: string;
    name: string;
    specifications?: string[];
    slug?: string;
    createdAt?: string;
}

export interface FormationDetail {
    id: string;
    title: string;
    description: string | null;
    duration: number;
    price: number;
    slug: string;
    status: string;
    imageUrl: string | null;
    categoryId: string | null;
    category?: { id: string; name: string } | null;
}

const slugify = (text: string) =>
    text
        .toLowerCase()
        .trim()
        .replaceAll(/[^\w\s-]/g, '')
        .replaceAll(/[\s_-]+/g, '-')
        .replaceAll(/^-+|-+$/g, '');

export async function fetchFormationCategories(): Promise<FormationCategory[]> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get('/api/formation-categories', headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch categories');
    }
    const data = res.data as { data?: FormationCategory[] } | FormationCategory[];
    if (Array.isArray(data)) return data;
    const nested = data && typeof data === 'object' && 'data' in data ? (data as { data?: FormationCategory[] }).data : undefined;
    return Array.isArray(nested) ? nested : [];
}

export async function createFormationCategory(body: { name: string; specifications?: string[] }): Promise<FormationCategory> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const slug = slugify(body.name);
    const res = await api.post(
        '/api/formation-categories',
        { name: body.name, slug, specifications: body.specifications ?? [] },
        headers
    );
    if (res.status !== HttpStatus.SuccessOK && res.status !== HttpStatus.SuccessCreated) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to create category');
    }
    const data = res.data as { data?: FormationCategory } | FormationCategory;
    const result = data && typeof data === 'object' && 'data' in data ? (data as { data: FormationCategory }).data : data;
    return result as FormationCategory;
}

export async function updateFormationCategory(
    id: string,
    body: { name?: string; specifications?: string[] }
): Promise<FormationCategory> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const payload: { name?: string; specifications?: string[]; slug?: string } = {};
    if (body.name !== undefined) payload.name = body.name;
    if (body.specifications !== undefined) payload.specifications = body.specifications;
    if (body.name !== undefined) payload.slug = body.name.toLowerCase().trim().replaceAll(/[^\w\s-]/g, '').replaceAll(/[\s_-]+/g, '-').replaceAll(/^-+|-+$/g, '');
    const res = await api.post(
        `/api/formation-categories/${id}`,
        payload,
        headers
    );
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to update category');
    }
    const data = res.data as { data?: FormationCategory } | FormationCategory;
    const result = data && typeof data === 'object' && 'data' in data ? (data as { data: FormationCategory }).data : data;
    return result as FormationCategory;
}

export async function deleteFormationCategory(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/formation-categories/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to delete category');
    }
}

export async function fetchFormations(
    params: {
        page?: number;
        perPage?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
        status?: string;
        categoryId?: string;
        priceMin?: number;
        priceMax?: number;
        durationMin?: number;
        durationMax?: number;
    }
) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.perPage) searchParams.set('perPage', String(params.perPage));
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.status) searchParams.set('status', params.status);
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params.priceMin != null) searchParams.set('priceMin', String(params.priceMin));
    if (params.priceMax != null) searchParams.set('priceMax', String(params.priceMax));
    if (params.durationMin != null) searchParams.set('durationMin', String(params.durationMin));
    if (params.durationMax != null) searchParams.set('durationMax', String(params.durationMax));

    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get(`/api/formation/list?${searchParams.toString()}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch formations');
    }
    interface FormationListData {
        data: Array<{ id: string; title: string; description: string | null; duration: number; price: number; status: string; slug: string; category?: { id: string; name: string } | null }>;
        meta: { total: number; currentPage: number; perPage: number; lastPage: number; hasMore: boolean };
    }
    const data = res.data as { data?: FormationListData } | FormationListData;
    return (data && typeof data === 'object' && 'data' in data ? (data as { data: FormationListData }).data : data) as FormationListData;
}

export type PublicFormationCardItem = {
    id: string;
    title: string;
    description: string | null;
    duration: number;
    price: number;
    slug: string;
    imageUrl?: string | null;
    category?: { id: string; name: string } | null;
};

/** Active formations for the public site (no auth). */
export async function fetchPublicFormations(params: {
    page?: number;
    perPage?: number;
    sortBy?: string;
    sortOrder?: string;
}): Promise<{
    data: PublicFormationCardItem[];
    meta: { total: number; currentPage: number; perPage: number; lastPage: number; hasMore: boolean };
}> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.perPage) searchParams.set('perPage', String(params.perPage));
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const headers = await CommonFunction.createHeaders({ withToken: false });
    const res = await api.get(`/api/formation/public-list?${searchParams.toString()}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch formations');
    }
    interface FormationListPayload {
        data: PublicFormationCardItem[];
        meta: { total: number; currentPage: number; perPage: number; lastPage: number; hasMore: boolean };
    }
    const payload = res.data as { data?: FormationListPayload } | FormationListPayload;
    const inner =
        payload && typeof payload === 'object' && 'data' in payload
            ? (payload as { data: FormationListPayload }).data
            : payload;
    return inner as FormationListPayload;
}

export async function fetchFormation(id: string) {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get(`/api/formation/${id}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch formation');
    }
    const data = res.data as { data?: FormationDetail } | FormationDetail;
    return (data && typeof data === 'object' && 'data' in data ? (data as { data: FormationDetail }).data : data) as FormationDetail;
}

export interface CreateFormationBody {
    title: string;
    description: string;
    duration: number;
    price: number;
    status: string;
    categoryId: string;
    imageUrl: string;
}

export async function createFormation(body: CreateFormationBody): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(
        '/api/formation',
        {
            title: body.title,
            description: body.description,
            duration: body.duration,
            price: body.price,
            slug: slugify(body.title),
            status: body.status,
            categoryId: body.categoryId,
            imageUrl: body.imageUrl,
        },
        headers
    );
    if (res.status !== HttpStatus.SuccessOK && res.status !== HttpStatus.SuccessCreated) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to create formation');
    }
}

export interface UpdateFormationBody {
    title?: string;
    description?: string;
    duration?: number;
    price?: number;
    status?: string;
    categoryId?: string;
    imageUrl?: string;
}

export async function updateFormation(
    id: string,
    body: UpdateFormationBody
): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(
        `/api/formation/${id}`,
        {
            title: body.title,
            description: body.description || undefined,
            duration: body.duration,
            price: body.price,
            slug: body.title ? slugify(body.title) : undefined,
            status: body.status,
            categoryId: body.categoryId || undefined,
            imageUrl: body.imageUrl || undefined,
        },
        headers
    );
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to update formation');
    }
}

export async function deleteFormation(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/formation/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to delete formation');
    }
}

export async function archiveFormation(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/formation/${id}/archive`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to archive formation');
    }
}

export async function unarchiveFormation(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/formation/${id}/unarchive`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to unarchive formation');
    }
}
