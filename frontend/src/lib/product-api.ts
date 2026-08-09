import { Api } from '@/common/StandardApi/api';
import { CommonFunction } from '@/common/Function/Function';
import { HttpStatus } from '@/common/StandardApi/interfaces/EHttpStatus';
import { getMediaUrl } from '@/lib/media-url';

const api = new Api();

export function getProductImageUrl(imageUrl: string | null | undefined): string {
    return getMediaUrl(imageUrl);
}

export function getProductGallery(product: Pick<ProductRecord, 'images' | 'imageUrl'>): string[] {
    const fromImages = (product.images ?? []).map((src) => getProductImageUrl(src)).filter(Boolean);
    if (fromImages.length > 0) return fromImages;
    const primary = getProductImageUrl(product.imageUrl);
    return primary ? [primary] : [];
}

/** Selling price: discounted when set, otherwise base price. */
export function getProductSellPrice(
    product: Pick<ProductRecord, 'price' | 'discountedPrice'>,
): number {
    return product.discountedPrice ?? product.price;
}

export function formatProductMoney(amount: number, locale: string) {
    const localeByLang: Record<string, string> = {
        ar: 'ar-TN',
        fr: 'fr-TN',
        en: 'en-TN',
    };
    return new Intl.NumberFormat(localeByLang[locale] ?? 'fr-TN', {
        style: 'currency',
        currency: 'TND',
        maximumFractionDigits: 0,
    }).format(amount);
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replaceAll(/[^\w\s-]/g, '')
        .replaceAll(/[\s_-]+/g, '-')
        .replaceAll(/^-+|-+$/g, '');
}

export interface ProductCategory {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    sortOrder?: number;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProductRecord {
    id: string;
    title: string;
    description: string | null;
    price: number;
    discountedPrice: number | null;
    imageUrl: string | null;
    images: string[];
    slug: string;
    badges: string[];
    materials: string[];
    sizes: string[];
    hasEngraving: boolean;
    featured: boolean;
    status: string;
    categoryId: string | null;
    category?: { id: string; name: string; slug?: string } | null;
    createdAt?: string;
    updatedAt?: string;
}

export type ProductDetail = ProductRecord;

export interface ProductListMeta {
    total: number;
    currentPage: number;
    perPage: number;
    lastPage: number;
    hasMore: boolean;
}

export interface ProductListResult {
    data: ProductRecord[];
    meta: ProductListMeta;
}

function unwrapData<T>(payload: { data?: T } | T): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return (payload as { data: T }).data;
    }
    return payload as T;
}

function toNumber(value: unknown, fallback = 0): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }
    return fallback;
}

function toNullableNumber(value: unknown): number | null {
    if (value == null || value === '') return null;
    const n = toNumber(value, Number.NaN);
    return Number.isFinite(n) ? n : null;
}

function normalizeProduct(raw: ProductRecord): ProductRecord {
    const images = Array.isArray(raw.images) ? raw.images.filter(Boolean) : [];
    const imageUrl = raw.imageUrl || images[0] || null;
    return {
        ...raw,
        price: toNumber(raw.price),
        discountedPrice: toNullableNumber(raw.discountedPrice),
        imageUrl,
        images: images.length > 0 ? images : imageUrl ? [imageUrl] : [],
        badges: Array.isArray(raw.badges) ? raw.badges.filter(Boolean) : [],
        materials: Array.isArray(raw.materials) ? raw.materials.filter(Boolean) : [],
        sizes: Array.isArray(raw.sizes) ? raw.sizes.filter(Boolean) : [],
        hasEngraving: Boolean(raw.hasEngraving),
        featured: Boolean(raw.featured),
    };
}

function unwrapProductList(payload: unknown): ProductListResult {
    const outer = payload as { data?: ProductListResult | ProductRecord[] } | ProductListResult;
    const inner =
        outer && typeof outer === 'object' && 'data' in outer
            ? (outer as { data: ProductListResult | ProductRecord[] }).data
            : outer;

    if (inner && typeof inner === 'object' && 'data' in inner && Array.isArray((inner as ProductListResult).data)) {
        const list = inner as ProductListResult;
        return {
            ...list,
            data: list.data.map(normalizeProduct),
        };
    }

    if (Array.isArray(inner)) {
        const data = inner.map(normalizeProduct);
        return {
            data,
            meta: {
                total: data.length,
                currentPage: 1,
                perPage: data.length,
                lastPage: 1,
                hasMore: false,
            },
        };
    }

    return { data: [], meta: { total: 0, currentPage: 1, perPage: 0, lastPage: 1, hasMore: false } };
}

function buildProductQuery(params: {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: string;
    categoryId?: string;
    categoryIds?: string[];
    priceMin?: number;
    priceMax?: number;
    featured?: boolean;
}): string {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.perPage) searchParams.set('perPage', String(params.perPage));
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.status) searchParams.set('status', params.status);
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params.categoryIds?.length) {
        for (const id of params.categoryIds) {
            searchParams.append('categoryIds', id);
        }
    }
    if (params.priceMin != null) searchParams.set('priceMin', String(params.priceMin));
    if (params.priceMax != null) searchParams.set('priceMax', String(params.priceMax));
    if (params.featured !== undefined) searchParams.set('featured', String(params.featured));
    return searchParams.toString();
}

// ——— Admin categories ———

export async function fetchProductCategories(): Promise<ProductCategory[]> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get('/api/product-categories', headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch product categories');
    }
    const data = unwrapData(res.data as { data?: ProductCategory[] } | ProductCategory[]);
    return Array.isArray(data) ? data : [];
}

export async function createProductCategory(body: {
    name: string;
    description?: string;
    status?: string;
    sortOrder?: number;
}): Promise<ProductCategory> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(
        '/api/product-categories',
        {
            name: body.name,
            slug: slugify(body.name),
            description: body.description || undefined,
            status: body.status ?? 'ACTIVE',
            sortOrder: body.sortOrder ?? 0,
        },
        headers,
    );
    if (res.status !== HttpStatus.SuccessOK && res.status !== HttpStatus.SuccessCreated) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to create product category');
    }
    return unwrapData(res.data as { data?: ProductCategory } | ProductCategory) as ProductCategory;
}

export async function updateProductCategory(
    id: string,
    body: { name?: string; description?: string; status?: string; sortOrder?: number },
): Promise<ProductCategory> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const payload: Record<string, unknown> = {};
    if (body.name !== undefined) {
        payload.name = body.name;
        payload.slug = slugify(body.name);
    }
    if (body.description !== undefined) payload.description = body.description || undefined;
    if (body.status !== undefined) payload.status = body.status;
    if (body.sortOrder !== undefined) payload.sortOrder = body.sortOrder;

    const res = await api.post(`/api/product-categories/${id}`, payload, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to update product category');
    }
    return unwrapData(res.data as { data?: ProductCategory } | ProductCategory) as ProductCategory;
}

export async function deleteProductCategory(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/product-categories/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to delete product category');
    }
}

// ——— Admin products ———

export async function fetchProducts(params: {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: string;
    categoryId?: string;
    categoryIds?: string[];
    priceMin?: number;
    priceMax?: number;
    featured?: boolean;
}): Promise<ProductListResult> {
    const qs = buildProductQuery(params);
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get(`/api/product/list${qs ? `?${qs}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch products');
    }
    return unwrapProductList(res.data);
}

export async function fetchProductById(id: string): Promise<ProductDetail> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.get(`/api/product/${id}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch product');
    }
    return normalizeProduct(
        unwrapData(res.data as { data?: ProductDetail } | ProductDetail) as ProductDetail,
    );
}

export interface CreateProductBody {
    title: string;
    description?: string;
    price: number;
    discountedPrice?: number | null;
    imageUrl?: string;
    images?: string[];
    slug?: string;
    badges?: string[];
    materials?: string[];
    sizes?: string[];
    hasEngraving?: boolean;
    featured?: boolean;
    status: string;
    categoryId?: string | null;
}

export async function createProduct(body: CreateProductBody): Promise<ProductDetail> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(
        '/api/product',
        {
            title: body.title,
            description: body.description || undefined,
            price: body.price,
            discountedPrice: body.discountedPrice ?? undefined,
            imageUrl: body.imageUrl || body.images?.[0] || undefined,
            images: body.images ?? [],
            slug: body.slug || slugify(body.title),
            badges: body.badges ?? [],
            materials: body.materials ?? [],
            sizes: body.sizes ?? [],
            hasEngraving: body.hasEngraving ?? false,
            featured: body.featured ?? false,
            status: body.status,
            categoryId: body.categoryId || undefined,
        },
        headers,
    );
    if (res.status !== HttpStatus.SuccessOK && res.status !== HttpStatus.SuccessCreated) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to create product');
    }
    return normalizeProduct(
        unwrapData(res.data as { data?: ProductDetail } | ProductDetail) as ProductDetail,
    );
}

export type UpdateProductBody = Partial<CreateProductBody>;

export async function updateProduct(id: string, body: UpdateProductBody): Promise<ProductDetail> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.post(
        `/api/product/${id}`,
        {
            ...(body.title !== undefined && { title: body.title }),
            ...(body.description !== undefined && { description: body.description || undefined }),
            ...(body.price !== undefined && { price: body.price }),
            ...(body.discountedPrice !== undefined && {
                discountedPrice: body.discountedPrice,
            }),
            ...(body.images !== undefined && { images: body.images }),
            ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || undefined }),
            ...(body.slug !== undefined
                ? { slug: body.slug }
                : body.title
                    ? { slug: slugify(body.title) }
                    : {}),
            ...(body.badges !== undefined && { badges: body.badges }),
            ...(body.materials !== undefined && { materials: body.materials }),
            ...(body.sizes !== undefined && { sizes: body.sizes }),
            ...(body.hasEngraving !== undefined && { hasEngraving: body.hasEngraving }),
            ...(body.featured !== undefined && { featured: body.featured }),
            ...(body.status !== undefined && { status: body.status }),
            ...(body.categoryId !== undefined && { categoryId: body.categoryId || undefined }),
        },
        headers,
    );
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to update product');
    }
    return normalizeProduct(
        unwrapData(res.data as { data?: ProductDetail } | ProductDetail) as ProductDetail,
    );
}

export async function deleteProduct(id: string): Promise<void> {
    const headers = await CommonFunction.createHeaders({ withToken: true });
    const res = await api.delete(`/api/product/${id}`, {}, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        const err = res.data as { message?: string };
        throw new Error(err?.message || 'Failed to delete product');
    }
}

// ——— Public ———

export async function fetchPublicProductCategories(): Promise<ProductCategory[]> {
    const headers = await CommonFunction.createHeaders({ withToken: false });
    const res = await api.get('/api/product-categories/public', headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch product categories');
    }
    const data = unwrapData(res.data as { data?: ProductCategory[] } | ProductCategory[]);
    return Array.isArray(data) ? data : [];
}

export async function fetchPublicProducts(params: {
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    categoryId?: string;
    priceMin?: number;
    priceMax?: number;
    featured?: boolean;
}): Promise<ProductListResult> {
    const qs = buildProductQuery(params);
    const headers = await CommonFunction.createHeaders({ withToken: false });
    const res = await api.get(`/api/product/getAll${qs ? `?${qs}` : ''}`, headers);
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch products');
    }
    return unwrapProductList(res.data);
}

export async function fetchPublicProductBySlug(slug: string): Promise<ProductDetail> {
    const headers = await CommonFunction.createHeaders({ withToken: false });
    const res = await api.get(`/api/product/slug/${encodeURIComponent(slug)}`, headers);
    if (res.status === HttpStatus.NotFound) {
        throw new Error('Produit introuvable.');
    }
    if (res.status !== HttpStatus.SuccessOK) {
        throw new Error('Failed to fetch product');
    }
    return normalizeProduct(
        unwrapData(res.data as { data?: ProductDetail } | ProductDetail) as ProductDetail,
    );
}

export async function fetchPublicFeaturedProducts(take = 8): Promise<ProductRecord[]> {
    const result = await fetchPublicProducts({
        page: 1,
        perPage: take,
        featured: true,
        sortBy: 'createdAt',
        sortOrder: 'desc',
    });
    if (result.data.length > 0) return result.data.slice(0, take);

    // Fallback if featured filter yields nothing (or API ignored it)
    const all = await fetchPublicProducts({
        page: 1,
        perPage: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc',
    });
    const featured = all.data.filter((p) => p.featured);
    return (featured.length > 0 ? featured : all.data).slice(0, take);
}
