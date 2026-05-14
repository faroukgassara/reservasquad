import { ESort } from 'src/enum/sort.enum';
import { PaginationData } from './types';

type PaginationOptions = {
    defaultPage?: number;
    defaultPerPage?: number;
    maxPerPage?: number;
};

function toNestedObject(path: string, value: any) {
    const segments = path
        .split('.')
        .map((segment) => segment.trim())
        .filter(Boolean);

    return segments.reduceRight((acc, key) => ({ [key]: acc }), value);
}

export function resolvePagination(
    pageInput?: number,
    perPageInput?: number,
    options?: PaginationOptions,
): PaginationData {
    const defaultPage = options?.defaultPage ?? 1;
    const defaultPerPage = options?.defaultPerPage ?? 10;
    const maxPerPage = options?.maxPerPage ?? 100;

    const page =
        typeof pageInput === 'number' && Number.isFinite(pageInput) && pageInput > 0
            ? Math.floor(pageInput)
            : defaultPage;

    const perPageRaw =
        typeof perPageInput === 'number' && Number.isFinite(perPageInput) && perPageInput > 0
            ? Math.floor(perPageInput)
            : defaultPerPage;

    const perPage = Math.min(perPageRaw, maxPerPage);

    return {
        page,
        perPage,
    };
}

export function buildOrderBy(
    sortByInput: string | undefined,
    sortOrderInput: ESort | undefined,
    allowedFields: string[],
    defaultSortBy: string,
) {
    const sortBy =
        typeof sortByInput === 'string' && allowedFields.includes(sortByInput)
            ? sortByInput
            : defaultSortBy;

    const sortOrder = sortOrderInput ?? ESort.desc;
    return [toNestedObject(sortBy, sortOrder)];
}

export function buildSearchWhere(searchInput: string | undefined, fields: string[]) {
    const search = typeof searchInput === 'string' ? searchInput.trim() : '';
    if (!search) return undefined;

    return {
        OR: fields.map((field) =>
            toNestedObject(field, {
                contains: search,
                mode: 'insensitive',
            }),
        ),
    };
}

export function composeWhere(baseWhere: Record<string, any>, andFilters: Record<string, any>[]) {
    return {
        ...baseWhere,
        ...(andFilters.length ? { AND: andFilters } : {}),
    };
}

export function buildAndFilters<T extends Record<string, any>>(...filters: Array<T | undefined | null | false>) {
    return filters.filter((filter): filter is T => Boolean(filter));
}
