import { Api } from '@/common/StandardApi/api';
import { CommonFunction, Config } from '@/common';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';
const api = new Api();

export function getBlogImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('data:')) return imageUrl;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    const base = Config.getInstance().API_URL || '';
    const separator = base.endsWith('/') ? '' : '/';
    return `${base}${separator}${imageUrl}`;
}

export interface BlogRecord {
    id: string;
    title: string;
    excerpt: string | null;
    content: string | null;
    imageUrl: string | null;
    slug: string;
    tags: string[];
    publishedAt: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
}

const slugify = (text: string) =>
    text
        .toLowerCase()
        .trim()
        .replaceAll(/[^\w\s-]/g, '')
        .replaceAll(/[\s_-]+/g, '-')
        .replaceAll(/^-+|-+$/g, '');

export async function fetchBlogs(): Promise<BlogRecord[]> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get('/api/blogs', headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch blogs');
    }
    const raw = res.data as { data?: BlogRecord[] } | BlogRecord[];
    if (Array.isArray(raw)) return raw;
    return Array.isArray(raw?.data) ? raw.data! : [];
}

export async function fetchPublicBlogs(take = 12): Promise<BlogRecord[]> {
    const headers = await CommonFunction.createHeaders({ withToken: false });
    const res = await api.get(`/api/blog/public-list?take=${take}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch blogs');
    }
    const raw = res.data as { data?: BlogRecord[] } | BlogRecord[];
    if (Array.isArray(raw)) return raw;
    return Array.isArray(raw?.data) ? raw.data! : [];
}

export async function fetchPublicBlogBySlug(slug: string): Promise<BlogRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: false });
    const res = await api.get(`/api/blog/slug/${encodeURIComponent(slug)}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Article introuvable');
    }
    const raw = res.data as { data?: BlogRecord } | BlogRecord;
    const data = raw && typeof raw === 'object' && 'data' in raw ? (raw as { data: BlogRecord }).data : raw;
    return data as BlogRecord;
}

export async function createBlog(body: {
    title: string;
    excerpt?: string | null;
    content?: string | null;
    imageUrl?: string | null;
    slug: string;
    tags?: string[];
    publishedAt?: string | null;
    status?: 'ACTIVE' | 'INACTIVE';
}): Promise<BlogRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post('/api/blogs', body, headers);
    if (res.status !== HttpStatus.SuccessOK && res.status !== HttpStatus.SuccessCreated) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to create blog');
    }
    const raw = res.data as { data?: BlogRecord } | BlogRecord;
    const result = raw && typeof raw === 'object' && 'data' in raw ? (raw as { data: BlogRecord }).data : raw;
    return result as BlogRecord;
}

export async function updateBlog(
    id: string,
    body: {
        title?: string;
        excerpt?: string | null;
        content?: string | null;
        imageUrl?: string | null;
        slug?: string;
        tags?: string[];
        publishedAt?: string | null;
        status?: 'ACTIVE' | 'INACTIVE';
    }
): Promise<BlogRecord> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(`/api/blogs/${id}`, body, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to update blog');
    }
    const raw = res.data as { data?: BlogRecord } | BlogRecord;
    const result = raw && typeof raw === 'object' && 'data' in raw ? (raw as { data: BlogRecord }).data : raw;
    return result as BlogRecord;
}

export async function deleteBlog(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/blogs/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to delete blog');
    }
}

export { slugify };
