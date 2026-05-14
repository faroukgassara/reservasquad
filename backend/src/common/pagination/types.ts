import { ESort } from 'src/enum/sort.enum';

// types.ts

/**
 * Pagination information
 */
export type PaginationData = {
    page: number;
    perPage: number;
};

export type PaginationDecoratorOptions = {
    defaultPage?: number;
    defaultPerPage?: number;
    maxPerPage?: number;
};

export type SortingDecoratorOptions = {
    allowedFields: string[];
    defaultSort?: string;
    defaultOrder?: ESort;
};

export type FilterOperator =
    | 'eq'
    | 'neq'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'in'
    | 'notIn'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'isNull'
    | 'notNull';

export type FilterCondition = {
    field: string;
    operator: FilterOperator;
    value?: unknown;
    caseInsensitive?: boolean;
};

export type FilterGroup = {
    operator: 'AND' | 'OR';
    rules?: FilterCondition[];
    groups?: FilterGroup[];
};

export type FilteringDecoratorOptions = {
    allowedFilterFields?: string[];
    searchFields?: string[];
};

/**
 * Proxy functions
 * 
 * used to create custom methods for prisma models
 */
export type ProxyFunctions = {
    findMany: (params: unknown, pagination: PaginationData) => Promise<any>;
    count: (params: unknown) => Promise<number>;
};